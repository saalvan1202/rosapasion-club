"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export interface PendingPaymentInfo {
  id: string;
  paymentMethod: string;
  amount: number;
  createdAt: string;
  waPendingUrl: string;
}

export interface MemberLookupResult {
  found: boolean;
  message?: string;
  hasPendingPayment?: boolean;
  pendingPayment?: PendingPaymentInfo | null;
  member?: {
    id: string;
    code: string;
    cardNumber?: string | null;
    name: string;
    documentType: string;
    documentNumber: string | null;
    phone?: string | null;
    recipientName?: string | null;
    recipientPhone?: string | null;
    senderName?: string | null;
    dedication?: string | null;
    status: "ACTIVA" | "VENCIDA" | "SUSPENDIDA";
    validFrom: string;
    validUntil: string;
    isCurrentlyActive: boolean;
    daysRemaining: number;
    totalRedemptions: number;
    hasPendingPayment?: boolean;
    pendingPayment?: PendingPaymentInfo | null;
  };
}

export async function lookupMemberByDocOrCode(query: string): Promise<MemberLookupResult> {
  const q = query.trim();
  if (!q) {
    return { found: false, message: "Por favor ingresa un número de DNI o código de socio." };
  }

  try {
    const member = await prisma.member.findFirst({
      where: {
        OR: [
          { code: { equals: q.toUpperCase() } },
          { cardNumber: { equals: q.toUpperCase() } },
          { documentNumber: { equals: q, mode: "insensitive" } },
        ],
      },
      include: {
        _count: {
          select: { history: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Buscar si existe un pago en estado PENDIENTE para este socio o documento
    const pendingPayment = await prisma.membershipPayment.findFirst({
      where: {
        OR: [
          ...(member ? [{ memberId: member.id }] : []),
          { documentNumber: { equals: q, mode: "insensitive" as const } },
          { memberCode: { equals: q.toUpperCase() } },
          ...(member?.documentNumber ? [{ documentNumber: { equals: member.documentNumber, mode: "insensitive" as const } }] : []),
        ],
        status: "PENDIENTE",
      },
      orderBy: { createdAt: "desc" },
    });

    let pendingPaymentInfo: PendingPaymentInfo | null = null;
    if (pendingPayment) {
      const settings = await prisma.clubSetting.findUnique({ where: { id: "default" } });
      const supportPhone = (settings?.supportPhone || "51952226282").replace(/\D/g, "");
      const waText = encodeURIComponent(
        `¡Hola Rosa Pasión! 🌹 Envié mi comprobante de renovación pero aún figura en revisión.\n\n` +
          `👤 *Socio:* ${pendingPayment.memberName}\n` +
          `💳 *Código:* ${pendingPayment.memberCode}\n` +
          `📄 *DNI:* ${pendingPayment.documentNumber}\n` +
          `💰 *Monto:* S/ ${Number(pendingPayment.amount).toFixed(2)} (${pendingPayment.paymentMethod})\n\n` +
          `¿Podrían confirmarme la activación por favor?`
      );
      const waPendingUrl = `https://wa.me/${supportPhone}?text=${waText}`;

      pendingPaymentInfo = {
        id: pendingPayment.id,
        paymentMethod: pendingPayment.paymentMethod,
        amount: Number(pendingPayment.amount),
        createdAt: pendingPayment.createdAt.toISOString(),
        waPendingUrl,
      };
    }

    if (!member) {
      if (pendingPaymentInfo && pendingPayment) {
        return {
          found: true,
          hasPendingPayment: true,
          pendingPayment: pendingPaymentInfo,
          message:
            "Tu pago de renovación aún está siendo revisado por nuestro equipo. Por favor espera unos minutos o comunícate por WhatsApp si olvidaste notificar tu pago.",
          member: {
            id: "",
            code: pendingPayment.memberCode || "RPC-SOCIO",
            name: pendingPayment.memberName || "Socio Registrado",
            documentType: "DNI",
            documentNumber: pendingPayment.documentNumber || q,
            phone: pendingPayment.phone || "",
            status: "VENCIDA",
            validFrom: new Date().toISOString(),
            validUntil: new Date().toISOString(),
            isCurrentlyActive: false,
            daysRemaining: 0,
            totalRedemptions: 0,
            hasPendingPayment: true,
            pendingPayment: pendingPaymentInfo,
          },
        };
      }

      return {
        found: false,
        message: `No se encontró ningún socio registrado con el DNI o código "${q}".`,
      };
    }

    const now = new Date();
    const validUntilDate = new Date(member.validUntil);
    const isExpiredByDate = validUntilDate < now;
    const isCurrentlyActive = member.status === "ACTIVA" && !isExpiredByDate;

    const diffTime = validUntilDate.getTime() - now.getTime();
    const daysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

    let effectiveStatus: "ACTIVA" | "VENCIDA" | "SUSPENDIDA" = member.status;
    if (member.status === "ACTIVA" && isExpiredByDate) {
      effectiveStatus = "VENCIDA";
    }

    const hasPending = Boolean(pendingPaymentInfo);

    return {
      found: true,
      hasPendingPayment: hasPending,
      pendingPayment: pendingPaymentInfo,
      message: hasPending
        ? "Tu pago de renovación aún está siendo revisado por nuestro equipo. Por favor espera unos minutos o comunícate por WhatsApp si olvidaste notificar tu pago."
        : undefined,
      member: {
        id: member.id,
        code: member.code,
        cardNumber: member.cardNumber,
        name: member.name,
        recipientName: member.recipientName,
        recipientPhone: member.recipientPhone,
        senderName: member.senderName,
        dedication: member.dedication,
        documentType: member.documentType,
        documentNumber: member.documentNumber,
        phone: member.phone || "",
        status: effectiveStatus,
        validFrom: member.validFrom.toISOString(),
        validUntil: member.validUntil.toISOString(),
        isCurrentlyActive,
        daysRemaining,
        totalRedemptions: member._count.history,
        hasPendingPayment: hasPending,
        pendingPayment: pendingPaymentInfo,
      },
    };
  } catch (error) {
    console.error("Error al consultar socio por DNI/Código:", error);
    return { found: false, message: "Error al consultar la membresía en el servidor." };
  }
}

export async function redeemBenefitInStore(data: {
  memberCodeOrDoc: string;
  storeCode: string;
  businessId?: string;
  notes?: string;
}) {
  const { memberCodeOrDoc, businessId, storeCode, notes } = data;

  if (!memberCodeOrDoc?.trim()) {
    return { success: false, message: "Falta identificar al socio." };
  }
  if (!storeCode?.trim()) {
    return { success: false, message: "Por favor ingresa el código del negocio." };
  }

  try {
    // 1. Obtener socio y verificar vigencia
    const member = await prisma.member.findFirst({
      where: {
        OR: [
          { documentNumber: { equals: memberCodeOrDoc.trim(), mode: "insensitive" } },
          { code: { equals: memberCodeOrDoc.trim().toUpperCase() } },
        ],
      },
    });

    if (!member) {
      return { success: false, message: "Socio no registrado en la base de datos." };
    }

    const now = new Date();
    if (member.status !== "ACTIVA" || new Date(member.validUntil) < now) {
      return {
        success: false,
        message: `La membresía de ${member.name} (${member.code}) no está activa o ya se encuentra vencida.`,
      };
    }

    const cleanInputCode = storeCode.trim();

    // 2. Buscar comercio directamente por su código de local o por id
    let business = null;
    if (businessId) {
      business = await prisma.business.findFirst({
        where: { id: businessId, isActive: true, deletedAt: null },
      });
      if (business && business.storeCode && business.storeCode.trim().toUpperCase() !== cleanInputCode.toUpperCase()) {
        return {
          success: false,
          message: `El código "${cleanInputCode}" no coincide con el establecimiento seleccionado.`,
        };
      }
    } else {
      business = await prisma.business.findFirst({
        where: {
          storeCode: { equals: cleanInputCode, mode: "insensitive" },
          isActive: true,
          deletedAt: null,
        },
      });

      // Si no se encontró un comercio activo, verificar si existe pero está INACTIVO o archivado para orientar al usuario
      if (!business) {
        const inactiveBiz = await prisma.business.findFirst({
          where: {
            storeCode: { equals: cleanInputCode, mode: "insensitive" },
          },
        });
        if (inactiveBiz) {
          if (!inactiveBiz.isActive) {
            return {
              success: false,
              message: `El comercio aliado "${inactiveBiz.name}" (código ${cleanInputCode}) está en estado INACTIVO en el sistema. Debes hacer clic en "Activar" en el Panel de Administración para habilitarlo.`,
            };
          }
          if (inactiveBiz.deletedAt) {
            return {
              success: false,
              message: `El comercio aliado "${inactiveBiz.name}" (código ${cleanInputCode}) se encuentra en la papelera o archivado. Reactívalo en el Panel de Administración.`,
            };
          }
        }
      }
    }

    if (!business) {
      return {
        success: false,
        message: `No se encontró ningún negocio aliado con el código "${cleanInputCode}". Pide al encargado el código del local.`,
      };
    }

    // 3. Prevenir doble clic / envío duplicado en los últimos 15 segundos
    const fifteenSecondsAgo = new Date(Date.now() - 15 * 1000);
    const recentDuplicate = await prisma.historyLog.findFirst({
      where: {
        memberId: member.id,
        businessId: business.id,
        createdAt: { gte: fifteenSecondsAgo },
      },
    });

    if (recentDuplicate) {
      return {
        success: true,
        log: {
          id: recentDuplicate.id,
          date: recentDuplicate.createdAt.toISOString(),
          discountApplied: recentDuplicate.discountApplied,
        },
        member: {
          name: member.name,
          code: member.code,
          documentNumber: member.documentNumber,
        },
        business: {
          name: business.name,
          discountSummary: business.discountSummary,
        },
      };
    }

    // 4. Registrar en historial de canjes
    const log = await prisma.historyLog.create({
      data: {
        memberId: member.id,
        memberCode: member.code,
        memberName: member.name,
        businessId: business.id,
        businessName: business.name,
        discountApplied: business.discountSummary,
        notes: notes?.trim() || "Canje verificado presencialmente en el local",
      },
    });

    revalidatePath("/admin/history");
    revalidatePath("/admin/subscriptions");
    revalidatePath("/admin");
    revalidatePath("/portal");
    revalidatePath("/");

    return {
      success: true,
      log: {
        id: log.id,
        date: log.createdAt.toISOString(),
        discountApplied: log.discountApplied,
      },
      member: {
        name: member.name,
        code: member.code,
        documentNumber: member.documentNumber,
      },
      business: {
        name: business.name,
        discountSummary: business.discountSummary,
      },
    };
  } catch (error) {
    console.error("Error al registrar canje en local:", error);
    return { success: false, message: "Error al procesar la transacción en el servidor." };
  }
}
