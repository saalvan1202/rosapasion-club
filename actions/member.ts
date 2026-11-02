"use server";

import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export interface MemberData {
  code: string;
  name: string;
  documentType: string; // DNI, CE, PASAPORTE
  documentNumber: string;
  email?: string | null;
  phone?: string | null;
  validFrom: string;
  validUntil: string;
  status: "ACTIVA" | "VENCIDA" | "SUSPENDIDA";
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
                { name: { contains: q, mode: "insensitive" } },
                { documentNumber: { contains: q, mode: "insensitive" } },
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
              { name: { contains: q, mode: "insensitive" as const } },
              { documentNumber: { contains: q, mode: "insensitive" as const } },
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
  const cleanCode = data.code.toUpperCase().trim();
  const cleanName = data.name.trim();

  // Validación 1: Verificar duplicado por Código RPC
  const existingCode = await prisma.member.findUnique({
    where: { code: cleanCode },
  });
  if (existingCode) {
    return {
      success: false,
      message: `Ya existe un socio registrado con el código de membresía "${cleanCode}" (${existingCode.name}).`,
    };
  }

  // Validación 2: Verificar duplicado por Documento (DNI o Carnet de Extranjería)
  if (cleanDoc) {
    const existingDoc = await prisma.member.findUnique({
      where: { documentNumber: cleanDoc },
    });
    if (existingDoc) {
      return {
        success: false,
        message: `El documento ${data.documentType || "DNI/CE"} "${cleanDoc}" ya se encuentra registrado con el socio ${existingDoc.name} (${existingDoc.code}).`,
      };
    }
  }

  try {
    const member = await prisma.member.create({
      data: {
        code: cleanCode,
        name: cleanName,
        documentType: data.documentType || "DNI",
        documentNumber: cleanDoc || null,
        email: data.email?.trim() || null,
        phone: data.phone?.trim() || null,
        validFrom: new Date(data.validFrom),
        validUntil: new Date(data.validUntil),
        status: data.status || "ACTIVA",
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

  // Validación si actualiza documento
  if (cleanDoc) {
    const existingDoc = await prisma.member.findFirst({
      where: {
        documentNumber: cleanDoc,
        NOT: { id },
      },
    });
    if (existingDoc) {
      return {
        success: false,
        message: `El documento "${cleanDoc}" ya está asignado a otro socio (${existingDoc.name}).`,
      };
    }
  }

  try {
    const member = await prisma.member.update({
      where: { id },
      data: {
        ...(cleanCode && { code: cleanCode }),
        ...(data.name && { name: data.name.trim() }),
        ...(data.documentType && { documentType: data.documentType }),
        ...(cleanDoc !== undefined && { documentNumber: cleanDoc || null }),
        ...(data.email !== undefined && { email: data.email?.trim() || null }),
        ...(data.phone !== undefined && { phone: data.phone?.trim() || null }),
        ...(data.validFrom && { validFrom: new Date(data.validFrom) }),
        ...(data.validUntil && { validUntil: new Date(data.validUntil) }),
        ...(data.status && { status: data.status }),
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
    // Borrado lógico (Soft delete) para proteger el historial y permitir restauración
    await prisma.member.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        status: "SUSPENDIDA",
      },
    });
    revalidatePath("/admin/subscriptions");
    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    console.error("Error al dar de baja socio:", error);
    return { success: false, message: "No se pudo dar de baja al socio" };
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
