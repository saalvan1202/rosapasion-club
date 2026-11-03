"use server";

import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export interface MemberData {
  code: string;
  cardNumber?: string | null;
  name: string;
  documentType: string; // DNI, CE, PASAPORTE
  documentNumber: string;
  email?: string | null;
  phone?: string | null;
  validFrom: string;
  validUntil: string;
  status: "ACTIVA" | "VENCIDA" | "SUSPENDIDA";
  deliveryAddress?: string | null;
  deliveryReference?: string | null;
  recipientName?: string | null;
  recipientPhone?: string | null;
  senderName?: string | null;
  dedication?: string | null;
}

export async function syncExpiredMembers() {
  try {
    const now = new Date();
    await prisma.member.updateMany({
      where: {
        status: "ACTIVA",
        validUntil: { lt: now },
      },
      data: {
        status: "VENCIDA",
      },
    });
  } catch (err) {
    console.error("Error al sincronizar socios vencidos:", err);
  }
}

export async function getMembers(search = "") {
  try {
    // Sincroniza automáticamente en background socios cuya fecha ya expiró
    await syncExpiredMembers();

    const q = search.trim().toLowerCase();
    return await prisma.member.findMany({
      where: {
        deletedAt: null,
        ...(q
          ? {
              OR: [
                { code: { contains: q, mode: "insensitive" } },
                { cardNumber: { contains: q, mode: "insensitive" } },
                { name: { contains: q, mode: "insensitive" } },
                { documentNumber: { contains: q, mode: "insensitive" } },
                { recipientName: { contains: q, mode: "insensitive" } },
                { recipientPhone: { contains: q, mode: "insensitive" } },
                { senderName: { contains: q, mode: "insensitive" } },
                { email: { contains: q, mode: "insensitive" } },
                { phone: { contains: q, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { history: true },
        },
      },
    });
  } catch (error) {
    console.error("Error al obtener socios:", error);
    return [];
  }
}

export async function getMembersPaginated({
  page = 1,
  pageSize = 10,
  search = "",
}: {
  page?: number;
  pageSize?: number;
  search?: string;
}) {
  try {
    await syncExpiredMembers();

    const q = search.trim().toLowerCase();
    const whereCondition = {
      deletedAt: null,
      ...(q
        ? {
            OR: [
              { code: { contains: q, mode: "insensitive" as const } },
              { cardNumber: { contains: q, mode: "insensitive" as const } },
              { name: { contains: q, mode: "insensitive" as const } },
              { documentNumber: { contains: q, mode: "insensitive" as const } },
              { recipientName: { contains: q, mode: "insensitive" as const } },
              { recipientPhone: { contains: q, mode: "insensitive" as const } },
              { senderName: { contains: q, mode: "insensitive" as const } },
              { email: { contains: q, mode: "insensitive" as const } },
              { phone: { contains: q, mode: "insensitive" as const } },
            ],
          }
        : {}),
    };

    const [total, items] = await Promise.all([
      prisma.member.count({ where: whereCondition }),
      prisma.member.findMany({
        where: whereCondition,
        skip: Math.max(0, (page - 1) * pageSize),
        take: pageSize,
        orderBy: { createdAt: "desc" },
        include: {
          _count: {
            select: { history: true },
          },
        },
      }),
    ]);

    return {
      items,
      total,
      totalPages: Math.ceil(total / pageSize) || 1,
      page,
      pageSize,
    };
  } catch (error) {
    console.error("Error al obtener socios paginados desde DB:", error);
    return { items: [], total: 0, totalPages: 1, page: 1, pageSize };
  }
}

export async function createMember(data: MemberData) {
  const session = await getSession();
  if (!session) throw new Error("No autorizado");

  const cleanDoc = data.documentNumber.trim();
  let cleanCode = data.code.toUpperCase().trim();
  const cleanName = data.name.trim();

  // Si ya existen membresías con este mismo DNI, podemos asignar un código adicional diferenciador si colisiona
  const existingCode = await prisma.member.findUnique({
    where: { code: cleanCode },
  });
  if (existingCode) {
    if (cleanDoc) {
      const sameDocCount = await prisma.member.count({
        where: { documentNumber: cleanDoc, deletedAt: null },
      });
      cleanCode = `${cleanCode}-${sameDocCount + 1}`;
    } else {
      return {
        success: false,
        message: `El código "${cleanCode}" ya pertenece a otro socio (${existingCode.name}). Por favor ingresa un código diferenciador.`,
      };
    }
  }

  try {
    const member = await prisma.member.create({
      data: {
        code: cleanCode,
        cardNumber: data.cardNumber?.trim() || cleanCode,
        name: cleanName,
        documentType: data.documentType || "DNI",
        documentNumber: cleanDoc || null,
        email: data.email?.trim() || null,
        phone: data.phone?.trim() || null,
        validFrom: new Date(data.validFrom),
        validUntil: new Date(data.validUntil),
        status: data.status || "ACTIVA",
        deliveryAddress: data.deliveryAddress?.trim() || null,
        deliveryReference: data.deliveryReference?.trim() || null,
        recipientName: data.recipientName?.trim() || null,
        recipientPhone: data.recipientPhone?.trim() || null,
        senderName: data.senderName?.trim() || null,
        dedication: data.dedication?.trim() || null,
      },
    });

    revalidatePath("/admin/subscriptions");
    revalidatePath("/admin");
    return { success: true, member };
  } catch (error: unknown) {
    console.error("Error al crear socio:", error);
    return { success: false, message: "Error al registrar socio en la base de datos." };
  }
}

export async function updateMember(id: string, data: Partial<MemberData>) {
  const session = await getSession();
  if (!session) throw new Error("No autorizado");

  const cleanDoc = data.documentNumber?.trim();
  const cleanCode = data.code?.toUpperCase().trim();

  // Validación si actualiza código
  if (cleanCode) {
    const existingCode = await prisma.member.findFirst({
      where: {
        code: cleanCode,
        NOT: { id },
      },
    });
    if (existingCode) {
      return {
        success: false,
        message: `El código "${cleanCode}" ya pertenece a otro socio registrado.`,
      };
    }
  }

  try {
    const member = await prisma.member.update({
      where: { id },
      data: {
        ...(cleanCode && { code: cleanCode }),
        ...(data.cardNumber !== undefined && { cardNumber: data.cardNumber?.trim() || null }),
        ...(data.name && { name: data.name.trim() }),
        ...(data.documentType && { documentType: data.documentType }),
        ...(cleanDoc !== undefined && { documentNumber: cleanDoc || null }),
        ...(data.email !== undefined && { email: data.email?.trim() || null }),
        ...(data.phone !== undefined && { phone: data.phone?.trim() || null }),
        ...(data.validFrom && { validFrom: new Date(data.validFrom) }),
        ...(data.validUntil && { validUntil: new Date(data.validUntil) }),
        ...(data.status && { status: data.status }),
        ...(data.deliveryAddress !== undefined && { deliveryAddress: data.deliveryAddress?.trim() || null }),
        ...(data.deliveryReference !== undefined && { deliveryReference: data.deliveryReference?.trim() || null }),
        ...(data.recipientName !== undefined && { recipientName: data.recipientName?.trim() || null }),
        ...(data.recipientPhone !== undefined && { recipientPhone: data.recipientPhone?.trim() || null }),
        ...(data.senderName !== undefined && { senderName: data.senderName?.trim() || null }),
        ...(data.dedication !== undefined && { dedication: data.dedication?.trim() || null }),
      },
    });

    revalidatePath("/admin/subscriptions");
    revalidatePath("/admin");
    return { success: true, member };
  } catch (error: unknown) {
    console.error("Error al actualizar socio:", error);
    return { success: false, message: "Error al actualizar los datos del socio." };
  }
}

export async function toggleMemberStatus(id: string, status: "ACTIVA" | "VENCIDA" | "SUSPENDIDA") {
  const session = await getSession();
  if (!session) throw new Error("No autorizado");

  try {
    const updated = await prisma.member.update({
      where: { id },
      data: { status },
    });

    revalidatePath("/admin/subscriptions");
    revalidatePath("/admin");
    return { success: true, status: updated.status };
  } catch (error) {
    console.error("Error al cambiar estado de socio:", error);
    return { success: false, message: "No se pudo cambiar el estado del socio" };
  }
}

export async function deleteMember(id: string) {
  const session = await getSession();
  if (!session) throw new Error("No autorizado");

  try {
    // 1. Intentar eliminación permanente directa en PostgreSQL
    await prisma.member.delete({
      where: { id },
    });
    revalidatePath("/admin/subscriptions");
    revalidatePath("/admin");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.warn("No se pudo eliminar directamente al socio, aplicando baja con soft-delete:", error);
    try {
      // 2. Si hay dependencias o restricción, aplicar borrado lógico
      await prisma.member.update({
        where: { id },
        data: {
          deletedAt: new Date(),
          status: "SUSPENDIDA",
        },
      });
      revalidatePath("/admin/subscriptions");
      revalidatePath("/admin");
      revalidatePath("/");
      return { success: true };
    } catch (innerError) {
      console.error("Error al eliminar socio:", innerError);
      return { success: false, message: "No se pudo eliminar al socio" };
    }
  }
}

export async function restoreMember(id: string) {
  const session = await getSession();
  if (!session) throw new Error("No autorizado");

  try {
    await prisma.member.update({
      where: { id },
      data: {
        deletedAt: null,
        status: "ACTIVA",
      },
    });
    revalidatePath("/admin/subscriptions");
    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    console.error("Error al restaurar socio:", error);
    return { success: false, message: "No se pudo restaurar al socio" };
  }
}
