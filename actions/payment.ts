"use server";

import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export interface SubmitPaymentInput {
  documentNumber: string;
  memberName: string;
  phone: string;
  paymentMethod?: string;
  operationNumber?: string;
  voucherUrl?: string;
  planName?: string;
  amount?: number;
  notes?: string;
}

/**
 * 1. Envío público de comprobante de renovación (Socio -> BD con estado PENDIENTE)
 */
export async function submitRenewalPayment(data: SubmitPaymentInput) {
  try {
    const cleanDoc = data.documentNumber.trim();
    if (!cleanDoc) {
      return { success: false, message: "Por favor ingresa tu número de DNI o documento." };
    }

    if (!data.phone.trim()) {
      return { success: false, message: "Por favor ingresa tu número de celular o WhatsApp." };
    }

    // Buscar si el socio ya existe en la base de datos por DNI o código
    const member = await prisma.member.findFirst({
      where: {
        OR: [
          { documentNumber: { equals: cleanDoc, mode: "insensitive" } },
          { code: { equals: cleanDoc.toUpperCase() } },
        ],
        deletedAt: null,
      },
    });

    const memberCode = member ? member.code : "NUEVO-SOCIO";
    const memberName = member ? member.name : data.memberName.trim();
    const cleanPhone = data.phone.trim();

    // Obtener configuraciones del club (precio y soporte)
    const settings = await prisma.clubSetting.findUnique({ where: { id: "default" } });
    const configuredPrice = settings?.membershipPrice ? Number(settings.membershipPrice) : 29.0;
    const amount = data.amount ?? configuredPrice;
    const planName = data.planName || "Membresía Mensual (30 Días)";

    const payment = await prisma.membershipPayment.create({
      data: {
        memberId: member ? member.id : null,
        memberCode,
        memberName,
        documentNumber: cleanDoc,
        phone: cleanPhone,
        planName,
        amount,
        paymentMethod: data.paymentMethod || "YAPE",
        operationNumber: data.operationNumber?.trim() || null,
        voucherUrl: data.voucherUrl?.trim() || null,
        notes: data.notes?.trim() || "Pago registrado por autoservicio web",
        status: "PENDIENTE",
      },
    });

    const supportPhone = (settings?.supportPhone || "51952226282").replace(/\D/g, "");

    const waText = encodeURIComponent(
      `¡Hola Rosa Pasión! 🌹 Acabo de registrar mi comprobante de renovación en la web.\n\n` +
        `👤 *Socio:* ${memberName}\n` +
        `📄 *DNI:* ${cleanDoc}\n` +
        `💳 *Código:* ${memberCode}\n` +
        `💰 *Monto:* S/ ${amount.toFixed(2)} (${data.paymentMethod || "Yape"})\n` +
        (data.operationNumber ? `🔢 *N° Op:* ${data.operationNumber.trim()}\n` : "") +
        `\nPor favor validar mi activación. ¡Gracias!`
    );

    const waDirectUrl = `https://wa.me/${supportPhone}?text=${waText}`;

    revalidatePath("/admin/subscriptions");
    revalidatePath("/admin/payments");

    return {
      success: true,
      paymentId: payment.id,
      memberCode,
      memberName,
      waDirectUrl,
      message: "¡Comprobante registrado con éxito! Tu activación será procesada en breve.",
    };
  } catch (error) {
    console.error("Error al registrar pago de renovación:", error);
    return {
      success: false,
      message: "Error en el servidor al guardar el comprobante de pago.",
    };
  }
}

/**
 * 2. Consulta de pagos para el Administrador
 */
export async function getMembershipPayments(search = "", statusFilter: string = "ALL") {
  const session = await getSession();
  if (!session) throw new Error("No autorizado");

  try {
    const q = search.trim().toLowerCase();
    const whereCondition = {
      ...(statusFilter !== "ALL"
        ? { status: statusFilter as "PENDIENTE" | "APROBADO" | "RECHAZADO" }
        : {}),
      ...(q
        ? {
            OR: [
              { memberName: { contains: q, mode: "insensitive" as const } },
              { documentNumber: { contains: q, mode: "insensitive" as const } },
              { memberCode: { contains: q, mode: "insensitive" as const } },
              { operationNumber: { contains: q, mode: "insensitive" as const } },
              { phone: { contains: q, mode: "insensitive" as const } },
            ],
          }
        : {}),
    };

    const payments = await prisma.membershipPayment.findMany({
      where: whereCondition,
      orderBy: { createdAt: "desc" },
      include: {
        member: {
          select: {
            id: true,
            code: true,
            name: true,
            validUntil: true,
            status: true,
          },
        },
      },
    });

    return payments.map((p) => ({
      ...p,
      amount: Number(p.amount),
    }));
  } catch (error) {
    console.error("Error al consultar pagos:", error);
    return [];
  }
}

/**
 * 3. Contador de comprobantes pendientes para la barra lateral (Badge)
 */
export async function getPendingPaymentsCount(): Promise<number> {
  try {
    return await prisma.membershipPayment.count({
      where: { status: "PENDIENTE" },
    });
  } catch {
    return 0;
  }
}

export interface PendingPaymentNotificationItem {
  id: string;
  memberName: string;
  memberCode: string;
  documentNumber: string;
  paymentMethod: string;
  amount: number;
  operationNumber: string | null;
  voucherUrl: string | null;
  createdAt: string;
}

/**
 * 3.1. Lista de los últimos pagos pendientes para el menú desplegable de notificaciones
 */
export async function getPendingPaymentsList(): Promise<PendingPaymentNotificationItem[]> {
  try {
    const payments = await prisma.membershipPayment.findMany({
      where: { status: "PENDIENTE" },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        memberName: true,
        memberCode: true,
        documentNumber: true,
        paymentMethod: true,
        amount: true,
        operationNumber: true,
        voucherUrl: true,
        createdAt: true,
      },
    });

    return payments.map((p) => ({
      ...p,
      amount: Number(p.amount),
      createdAt: p.createdAt.toISOString(),
    }));
  } catch (error) {
    console.error("Error al obtener lista de pagos pendientes:", error);
    return [];
  }
}

/**
 * 4. Aprobación de pago (1 Clic): Extiende 30 días y activa carnet
 */
export async function approvePayment(paymentId: string) {
  const session = await getSession();
  if (!session) throw new Error("No autorizado");

  try {
    const payment = await prisma.membershipPayment.findUnique({
      where: { id: paymentId },
      include: { member: true },
    });

    if (!payment) {
      return { success: false, message: "Comprobante no encontrado." };
    }

    if (payment.status === "APROBADO") {
      return { success: false, message: "Este pago ya fue aprobado anteriormente." };
    }

    const now = new Date();
    let newValidUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 días por defecto
    let memberUpdated = null;

    // Si está vinculado a un socio existente, calcula la extensión acumulativa
    if (payment.member) {
      const currentExpiry = new Date(payment.member.validUntil);
      if (currentExpiry > now) {
        // Aún vigente: sumar 30 días a su fecha de expiración actual
        newValidUntil = new Date(currentExpiry.getTime() + 30 * 24 * 60 * 60 * 1000);
      } else {
        // Ya vencido: sumar 30 días a partir de hoy
        newValidUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      }

      memberUpdated = await prisma.member.update({
        where: { id: payment.member.id },
        data: {
          status: "ACTIVA",
          validUntil: newValidUntil,
        },
      });
    }

    // Actualizar estado del pago a APROBADO
    const updatedPayment = await prisma.membershipPayment.update({
      where: { id: paymentId },
      data: {
        status: "APROBADO",
        approvedAt: now,
        approvedBy: session.name || session.email,
      },
    });

    revalidatePath("/admin/payments");
    revalidatePath("/admin/subscriptions");
    revalidatePath("/admin");
    revalidatePath("/");

    // Generar enlace directo de WhatsApp para notificar al socio con 1 clic
    const cleanPhone = payment.phone.replace(/\D/g, "");
    const waPhone = cleanPhone.startsWith("51") ? cleanPhone : `51${cleanPhone}`;
    const formattedExpiry = newValidUntil.toLocaleDateString("es-PE", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });

    const notifyMsg = encodeURIComponent(
      `¡Hola ${payment.memberName}! 🌹\n\n` +
        `Tu pago de renovación para *Rosa Pasión Club* ha sido verificado y *APROBADO* exitosamente.\n\n` +
        `✨ *Estado:* Tarjeta ACTIVA\n` +
        `📅 *Nueva Vigencia:* Hasta el ${formattedExpiry}\n` +
        `💳 *Código de Socio:* ${payment.memberCode}\n\n` +
        `Ya puedes disfrutar de tus beneficios exclusivos en cafeterías, lavado, pastelerías y comercios aliados mostrando tu tarjeta en:\n` +
        `👉 https://rosapasionclub.com\n\n` +
        `¡Gracias por ser parte de nuestra comunidad!`
    );

    const whatsappNotifyUrl = `https://wa.me/${waPhone}?text=${notifyMsg}`;

    return {
      success: true,
      paymentId: updatedPayment.id,
      amount: Number(updatedPayment.amount),
      memberCode: updatedPayment.memberCode,
      memberName: updatedPayment.memberName,
      newValidUntil: newValidUntil.toISOString(),
      whatsappNotifyUrl,
      message: "Pago aprobado con éxito. La membresía ha sido renovada por 30 días.",
    };
  } catch (error) {
    console.error("Error al aprobar pago:", error);
    return { success: false, message: "Error al procesar la aprobación del pago." };
  }
}

/**
 * 5. Rechazo de comprobante
 */
export async function rejectPayment(paymentId: string, reason: string) {
  const session = await getSession();
  if (!session) throw new Error("No autorizado");

  try {
    const updated = await prisma.membershipPayment.update({
      where: { id: paymentId },
      data: {
        status: "RECHAZADO",
        rejectedReason: reason.trim() || "Comprobante no coincide o no es legible",
      },
    });

    revalidatePath("/admin/payments");
    revalidatePath("/admin/subscriptions");

    // Enlace de WhatsApp para avisarle al usuario amablemente el motivo
    const cleanPhone = updated.phone.replace(/\D/g, "");
    const waPhone = cleanPhone.startsWith("51") ? cleanPhone : `51${cleanPhone}`;
    const rejectMsg = encodeURIComponent(
      `¡Hola ${updated.memberName}! 🌹\n\n` +
        `Hemos revisado tu comprobante de renovación para Rosa Pasión Club, pero tuvimos un inconveniente:\n` +
        `⚠️ *Observación:* ${reason.trim()}\n\n` +
        `Por favor envíanos la captura clara de tu Yape/Plin por este medio para ayudarte a validar tu activación. ¡Gracias!`
    );
    const whatsappRejectUrl = `https://wa.me/${waPhone}?text=${rejectMsg}`;

    return {
      success: true,
      whatsappRejectUrl,
      message: "Comprobante marcado como rechazado.",
    };
  } catch (error) {
    console.error("Error al rechazar pago:", error);
    return { success: false, message: "Error al rechazar comprobante." };
  }
}
