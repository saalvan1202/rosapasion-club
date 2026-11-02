"use server";

import prisma from "@/lib/prisma";
import { ClubSettingSchema, ClubSettingInput } from "@/lib/validations";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";

const DEFAULT_BANK_ACCOUNTS = [
  {
    id: "bn",
    bankName: "Banco de la Nación",
    holderName: "Orison David Cometivos Rojas",
    solesAccount: "04-581-449904",
    dollarsAccount: "",
    cci: "",
  },
  {
    id: "bcp",
    bankName: "BCP",
    holderName: "Orison David Cometivos Rojas",
    solesAccount: "550-95549542-0-21",
    dollarsAccount: "550-09325458188",
    cci: "00255010932545818821",
  },
  {
    id: "interbank",
    bankName: "Interbank",
    holderName: "Orison David Cometivos Rojas",
    solesAccount: "8983150419001",
    dollarsAccount: "",
    cci: "",
  },
  {
    id: "bbva",
    bankName: "BBVA",
    holderName: "Liley Rojas Viena",
    solesAccount: "0011-0814-0203826899",
    dollarsAccount: "",
    cci: "",
  },
];

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
          bcpAccount: "550-95549542-0-21",
          bcpCci: "00255010932545818821",
          interbankAccount: "8983150419001",
          interbankCci: "",
          bbvaAccount: "0011-0814-0203826899",
          bbvaCci: "",
          bankBeneficiary: "Orison David Cometivos Rojas",
          bankAccounts: DEFAULT_BANK_ACCOUNTS,
          membershipPrice: 29.00,
        } as any,
      });
    }

    const s = settings as any;
    let bankAccounts = DEFAULT_BANK_ACCOUNTS;
    if (Array.isArray(s.bankAccounts) && s.bankAccounts.length > 0) {
      bankAccounts = s.bankAccounts;
    } else if (typeof s.bankAccounts === "string") {
      try {
        const parsed = JSON.parse(s.bankAccounts);
        if (Array.isArray(parsed) && parsed.length > 0) bankAccounts = parsed;
      } catch {}
    }

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
      bcpAccount: s.bcpAccount || "550-95549542-0-21",
      bcpCci: s.bcpCci || "00255010932545818821",
      interbankAccount: s.interbankAccount || "8983150419001",
      interbankCci: s.interbankCci || "",
      bbvaAccount: s.bbvaAccount || "0011-0814-0203826899",
      bbvaCci: s.bbvaCci || "",
      bankBeneficiary: s.bankBeneficiary || "Orison David Cometivos Rojas",
      bankAccounts,
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
      bcpAccount: "550-95549542-0-21",
      bcpCci: "00255010932545818821",
      interbankAccount: "8983150419001",
      interbankCci: "",
      bbvaAccount: "0011-0814-0203826899",
      bbvaCci: "",
      bankBeneficiary: "Orison David Cometivos Rojas",
      bankAccounts: DEFAULT_BANK_ACCOUNTS,
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
    const bcp = validated.data.bankAccounts?.find((b) => b.bankName.toUpperCase().includes("BCP"));
    const ibk = validated.data.bankAccounts?.find((b) => b.bankName.toUpperCase().includes("INTERBANK"));
    const bbva = validated.data.bankAccounts?.find((b) => b.bankName.toUpperCase().includes("BBVA"));

    const payload: any = {
      ...validated.data,
      bcpAccount: bcp?.solesAccount || validated.data.bcpAccount || "550-95549542-0-21",
      bcpCci: bcp?.cci || validated.data.bcpCci || "00255010932545818821",
      interbankAccount: ibk?.solesAccount || validated.data.interbankAccount || "8983150419001",
      interbankCci: ibk?.cci || validated.data.interbankCci || "",
      bbvaAccount: bbva?.solesAccount || validated.data.bbvaAccount || "0011-0814-0203826899",
      bbvaCci: bbva?.cci || validated.data.bbvaCci || "",
      bankBeneficiary: bcp?.holderName || validated.data.bankBeneficiary || "Orison David Cometivos Rojas",
      bankAccounts: validated.data.bankAccounts || DEFAULT_BANK_ACCOUNTS,
    };

    let u: any;
    try {
      u = await prisma.clubSetting.upsert({
        where: { id: "default" },
        update: payload,
        create: {
          id: "default",
          ...payload,
        },
      });
    } catch (upsertErr) {
      console.warn("Upsert falló, ejecutando actualización directa por SQL:", upsertErr);
      await prisma.$executeRaw`
        UPDATE club_settings SET
          "qrRedirectUrl" = ${payload.qrRedirectUrl},
          "catalogUrl" = ${payload.catalogUrl},
          "supportPhone" = ${payload.supportPhone},
          "yapePhone" = ${payload.yapePhone},
          "yapeName" = ${payload.yapeName},
          "yapeQrUrl" = ${payload.yapeQrUrl},
          "plinPhone" = ${payload.plinPhone},
          "plinQrUrl" = ${payload.plinQrUrl},
          "bcpAccount" = ${payload.bcpAccount},
          "bcpCci" = ${payload.bcpCci},
          "interbankAccount" = ${payload.interbankAccount},
          "interbankCci" = ${payload.interbankCci},
          "bbvaAccount" = ${payload.bbvaAccount},
          "bbvaCci" = ${payload.bbvaCci},
          "bankBeneficiary" = ${payload.bankBeneficiary},
          "membershipPrice" = ${payload.membershipPrice},
          "updatedAt" = NOW()
        WHERE id = 'default'
      `;
      u = payload;
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
        bcpAccount: u.bcpAccount || "550-95549542-0-21",
        bcpCci: u.bcpCci || "00255010932545818821",
        interbankAccount: u.interbankAccount || "8983150419001",
        interbankCci: u.interbankCci || "",
        bbvaAccount: u.bbvaAccount || "0011-0814-0203826899",
        bbvaCci: u.bbvaCci || "",
        bankBeneficiary: u.bankBeneficiary || "Orison David Cometivos Rojas",
        bankAccounts: u.bankAccounts || DEFAULT_BANK_ACCOUNTS,
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
