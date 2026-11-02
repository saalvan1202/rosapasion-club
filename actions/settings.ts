"use server";

import prisma from "@/lib/prisma";
import { ClubSettingSchema, ClubSettingInput } from "@/lib/validations";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function getClubSettings() {
  try {
    let settings = await prisma.clubSetting.findUnique({
      where: { id: "default" },
    });

    if (!settings) {
      settings = await prisma.clubSetting.create({
        data: {
          id: "default",
          qrRedirectUrl: "https://rosapasionclub.com",
          catalogUrl: "https://wa.me/51952226282?text=Hola%20Rosa%20Pasión,%20quiero%20ver%20su%20catálogo%20actualizado",
          supportPhone: "51952226282",
          yapePhone: "952 226 282",
          yapeName: "Rosa Pasión Flores y Detalles",
          plinPhone: "952 226 282",
          membershipPrice: 29.00,
        } as any,
      });
    }

    const s = settings as any;
    return {
      id: s.id,
      qrRedirectUrl: s.qrRedirectUrl,
      catalogUrl: s.catalogUrl,
      supportPhone: s.supportPhone,
      yapePhone: s.yapePhone || "952 226 282",
      yapeName: s.yapeName || "Rosa Pasión Flores y Detalles",
      yapeQrUrl: s.yapeQrUrl || "/yape-qr.png",
      plinPhone: s.plinPhone || "952 226 282",
      plinQrUrl: s.plinQrUrl || "/plin-qr.png",
      bcpAccount: s.bcpAccount || "355-98231456-0-12",
      bcpCci: s.bcpCci || "002-355-009823145601-28",
      interbankAccount: s.interbankAccount || "200-3001234567",
      interbankCci: s.interbankCci || "003-200-003001234567-19",
      bbvaAccount: s.bbvaAccount || "0011-0175-0200987654",
      bbvaCci: s.bbvaCci || "011-175-000200987654-88",
      bankBeneficiary: s.bankBeneficiary || "Rosa Pasión Flores y Detalles",
      membershipPrice: s.membershipPrice != null ? Number(s.membershipPrice) : 29.00,
    };
  } catch (error) {
    console.error("Error al obtener configuraciones:", error);
    return {
      id: "default",
      qrRedirectUrl: "https://rosapasionclub.com",
      catalogUrl: "https://wa.me/51952226282?text=Hola%20Rosa%20Pasión,%20quiero%20ver%20su%20catálogo%20actualizado",
      supportPhone: "51952226282",
      yapePhone: "952 226 282",
      yapeName: "Rosa Pasión Flores y Detalles",
      yapeQrUrl: "/yape-qr.png",
      plinPhone: "952 226 282",
      plinQrUrl: "/plin-qr.png",
      bcpAccount: "355-98231456-0-12",
      bcpCci: "002-355-009823145601-28",
      interbankAccount: "200-3001234567",
      interbankCci: "003-200-003001234567-19",
      bbvaAccount: "0011-0175-0200987654",
      bbvaCci: "011-175-000200987654-88",
      bankBeneficiary: "Rosa Pasión Flores y Detalles",
      membershipPrice: 29.00,
    };
  }
}

export async function updateClubSettings(data: ClubSettingInput) {
  const session = await getSession();
  if (!session) throw new Error("No autorizado");

  const validated = ClubSettingSchema.safeParse(data);
  if (!validated.success) {
    return { success: false, errors: validated.error.flatten().fieldErrors };
  }

  try {
    let u: any;
    try {
      u = await prisma.clubSetting.upsert({
        where: { id: "default" },
        update: validated.data as any,
        create: {
          id: "default",
          ...validated.data,
        } as any,
      });
    } catch (upsertErr) {
      console.warn("Upsert falló, ejecutando actualización directa por SQL:", upsertErr);
      await prisma.$executeRaw`
        UPDATE club_settings SET
          "qrRedirectUrl" = ${validated.data.qrRedirectUrl},
          "catalogUrl" = ${validated.data.catalogUrl},
          "supportPhone" = ${validated.data.supportPhone},
          "yapePhone" = ${validated.data.yapePhone},
          "yapeName" = ${validated.data.yapeName},
          "yapeQrUrl" = ${validated.data.yapeQrUrl},
          "plinPhone" = ${validated.data.plinPhone},
          "plinQrUrl" = ${validated.data.plinQrUrl},
          "bcpAccount" = ${validated.data.bcpAccount},
          "bcpCci" = ${validated.data.bcpCci},
          "interbankAccount" = ${validated.data.interbankAccount},
          "interbankCci" = ${validated.data.interbankCci},
          "bbvaAccount" = ${validated.data.bbvaAccount},
          "bbvaCci" = ${validated.data.bbvaCci},
          "bankBeneficiary" = ${validated.data.bankBeneficiary},
          "membershipPrice" = ${validated.data.membershipPrice},
          "updatedAt" = NOW()
        WHERE id = 'default'
      `;
      u = validated.data;
    }

    revalidatePath("/admin/settings");
    revalidatePath("/");
    return {
      success: true,
      settings: {
        id: "default",
        qrRedirectUrl: u.qrRedirectUrl,
        catalogUrl: u.catalogUrl,
        supportPhone: u.supportPhone,
        yapePhone: u.yapePhone || "952 226 282",
        yapeName: u.yapeName || "Rosa Pasión Flores y Detalles",
        yapeQrUrl: u.yapeQrUrl || "/yape-qr.png",
        plinPhone: u.plinPhone || "952 226 282",
        plinQrUrl: u.plinQrUrl || "/plin-qr.png",
        bcpAccount: u.bcpAccount || "355-98231456-0-12",
        bcpCci: u.bcpCci || "002-355-009823145601-28",
        interbankAccount: u.interbankAccount || "200-3001234567",
        interbankCci: u.interbankCci || "003-200-003001234567-19",
        bbvaAccount: u.bbvaAccount || "0011-0175-0200987654",
        bbvaCci: u.bbvaCci || "011-175-000200987654-88",
        bankBeneficiary: u.bankBeneficiary || "Rosa Pasión Flores y Detalles",
        membershipPrice: u.membershipPrice != null ? Number(u.membershipPrice) : 29.00,
      },
    };
  } catch (error: any) {
    console.error("Error al actualizar configuraciones:", error);
    return {
      success: false,
      message: error?.message || "Error al guardar la configuración global",
    };
  }
}
