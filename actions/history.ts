"use server";

import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export interface HistoryData {
  memberCode: string;
  memberName: string;
  businessName: string;
  discountApplied: string;
  notes?: string | null;
  businessId?: string | null;
  memberId?: string | null;
}

export async function getHistoryLogs(search = "") {
  try {
    const q = search.trim().toLowerCase();
    return await prisma.historyLog.findMany({
      where: q
        ? {
            OR: [
              { memberCode: { contains: q, mode: "insensitive" } },
              { memberName: { contains: q, mode: "insensitive" } },
              { businessName: { contains: q, mode: "insensitive" } },
              { discountApplied: { contains: q, mode: "insensitive" } },
            ],
          }
        : undefined,
      orderBy: { createdAt: "desc" },
      include: {
        member: { select: { id: true, code: true, name: true } },
        business: { select: { id: true, name: true, slug: true } },
      },
    });
  } catch (error) {
    console.error("Error al obtener historial:", error);
    return [];
  }
}

export async function getHistoryLogsPaginated({
  page = 1,
  pageSize = 10,
  search = "",
}: {
  page?: number;
  pageSize?: number;
  search?: string;
}) {
  try {
    const q = search.trim().toLowerCase();
    const whereCondition = q
      ? {
          OR: [
            { memberCode: { contains: q, mode: "insensitive" as const } },
            { memberName: { contains: q, mode: "insensitive" as const } },
            { businessName: { contains: q, mode: "insensitive" as const } },
            { discountApplied: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : undefined;

    const [total, items] = await Promise.all([
      prisma.historyLog.count({ where: whereCondition }),
      prisma.historyLog.findMany({
        where: whereCondition,
        skip: Math.max(0, (page - 1) * pageSize),
        take: pageSize,
        orderBy: { createdAt: "desc" },
        include: {
          member: { select: { id: true, code: true, name: true } },
          business: { select: { id: true, name: true, slug: true } },
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
    console.error("Error al obtener historial paginado desde DB:", error);
    return { items: [], total: 0, totalPages: 1, page: 1, pageSize };
  }
}

export async function createHistoryLog(data: HistoryData) {
  const session = await getSession();
  if (!session) throw new Error("No autorizado");

  try {
    // Buscar id de miembro y comercio si existen
    const member = await prisma.member.findUnique({
      where: { code: data.memberCode.toUpperCase().trim() },
    });

    const business = await prisma.business.findFirst({
      where: { name: { equals: data.businessName.trim(), mode: "insensitive" } },
    });

    const log = await prisma.historyLog.create({
      data: {
        memberCode: data.memberCode.toUpperCase().trim(),
        memberName: data.memberName.trim() || member?.name || "Socio Registrado",
        businessName: data.businessName.trim(),
        discountApplied: data.discountApplied.trim(),
        notes: data.notes?.trim() || null,
        memberId: member?.id || null,
        businessId: business?.id || null,
      },
    });

    revalidatePath("/admin/history");
    revalidatePath("/admin");
    return { success: true, log };
  } catch (error) {
    console.error("Error al registrar canje en historial:", error);
    return { success: false, message: "Error al registrar el canje en historial" };
  }
}

export async function deleteHistoryLog(id: string) {
  const session = await getSession();
  if (!session) throw new Error("No autorizado");

  try {
    await prisma.historyLog.delete({ where: { id } });
    revalidatePath("/admin/history");
    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    console.error("Error al eliminar registro de historial:", error);
    return { success: false, message: "No se pudo eliminar el registro" };
  }
}
