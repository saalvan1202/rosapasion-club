"use server";

import prisma from "@/lib/prisma";
import { BusinessSchema, BusinessInput } from "@/lib/validations";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function getBusinesses(onlyActive = false) {
  try {
    return await prisma.business.findMany({
      where: {
        deletedAt: null,
        ...(onlyActive ? { isActive: true } : {}),
      },
      orderBy: [{ order: "asc" }, { createdAt: "desc" }],
      include: {
        category: true,
        terms: {
          orderBy: { order: "asc" },
        },
      },
    });
  } catch (error) {
    console.error("Error al obtener negocios:", error);
    return [];
  }
}

export async function getBusinessById(id: string) {
  try {
    return await prisma.business.findUnique({
      where: { id },
      include: {
        category: true,
        terms: {
          orderBy: { order: "asc" },
        },
      },
    });
  } catch (error) {
    console.error("Error al obtener negocio:", error);
    return null;
  }
}

export async function createBusiness(data: BusinessInput) {
  const session = await getSession();
  if (!session) throw new Error("No autorizado");

  const validated = BusinessSchema.safeParse(data);
  if (!validated.success) {
    const fieldErrors = validated.error.flatten().fieldErrors;
    const firstError = Object.values(fieldErrors).flat()[0] || "Por favor verifica los datos ingresados";
    return { success: false, errors: fieldErrors, message: firstError };
  }

  const { terms, validUntil, ...businessData } = validated.data;
  const cleanName = businessData.name.trim();

  // Auto-generar slug si viene vacío
  const cleanSlug =
    (businessData.slug?.trim().toLowerCase() ||
      cleanName
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")) ||
    `comercio-${Date.now()}`;

  // Si el usuario sólo ingresa el número (ej. "30" o "15"), autocompletar con "% de Descuento" para óptima lectura
  let discountFormatted = businessData.discountSummary.trim();
  if (/^\d+$/.test(discountFormatted)) {
    discountFormatted = `${discountFormatted}% de Descuento`;
  }

  // Validación 1: Verificar si ya existe un comercio ACTIVO con ese nombre
  const existingName = await prisma.business.findFirst({
    where: {
      name: { equals: cleanName, mode: "insensitive" },
      deletedAt: null,
    },
  });
  if (existingName) {
    return {
      success: false,
      message: `El comercio aliado "${cleanName}" ya se encuentra registrado en el sistema.`,
    };
  }

  // Si existe un registro previo que fue dado de baja (soft-deleted) con el mismo nombre o slug, liberarlo
  const archivedConflict = await prisma.business.findFirst({
    where: {
      OR: [
        { name: { equals: cleanName, mode: "insensitive" } },
        { slug: cleanSlug },
      ],
      deletedAt: { not: null },
    },
  });
  if (archivedConflict) {
    await prisma.business.update({
      where: { id: archivedConflict.id },
      data: {
        name: `${archivedConflict.name}-archivado-${Date.now()}`,
        slug: `${archivedConflict.slug}-del-${Date.now()}`,
      },
    });
  }

  // Validación 2: Verificar que no se repita el slug en comercios activos
  const existingSlug = await prisma.business.findFirst({
    where: {
      slug: cleanSlug,
      deletedAt: null,
    },
  });
  if (existingSlug) {
    return {
      success: false,
      message: `El identificador slug "${cleanSlug}" ya pertenece al comercio "${existingSlug.name}".`,
    };
  }

  // Parsear fecha de vigencia de forma segura
  let parsedValidUntil: Date | null = null;
  if (validUntil && typeof validUntil === "string" && validUntil.trim()) {
    const d = new Date(validUntil);
    if (!isNaN(d.getTime())) {
      parsedValidUntil = d;
    }
  }

  try {
    const business = await prisma.business.create({
      data: {
        ...businessData,
        name: cleanName,
        slug: cleanSlug,
        discountSummary: discountFormatted,
        whatsappNumber: businessData.whatsappNumber?.trim() || "",
        storeCode: (businessData.storeCode || "1234").trim().toUpperCase(),
        logoUrl: businessData.logoUrl || null,
        validUntil: parsedValidUntil,
        isActive: businessData.isActive ?? true,
        deletedAt: null,
        terms: terms && terms.length > 0 ? {
          create: terms.map((t, idx) => ({
            description: t.description,
            isRule: t.isRule,
            order: t.order ?? idx + 1,
          })),
        } : undefined,
      },
      include: {
        terms: true,
      },
    });

    revalidatePath("/admin/businesses");
    revalidatePath("/admin/benefits");
    revalidatePath("/admin");
    revalidatePath("/portal");
    revalidatePath("/");
    return { success: true, business };
  } catch (error: any) {
    console.error("Error al crear comercio:", error);
    const msg = error?.code === "P2002"
      ? "Ya existe un comercio registrado con ese nombre o slug."
      : (error?.message || "Error al registrar el comercio aliado");
    return { success: false, message: msg };
  }
}

export async function updateBusiness(id: string, data: BusinessInput) {
  const session = await getSession();
  if (!session) throw new Error("No autorizado");

  const validated = BusinessSchema.safeParse(data);
  if (!validated.success) {
    const fieldErrors = validated.error.flatten().fieldErrors;
    const firstError = Object.values(fieldErrors).flat()[0] || "Por favor verifica los datos ingresados";
    return { success: false, errors: fieldErrors, message: firstError };
  }

  const { terms, validUntil, ...businessData } = validated.data;
  const cleanName = businessData.name.trim();

  const cleanSlug =
    (businessData.slug?.trim().toLowerCase() ||
      cleanName
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")) ||
    `comercio-${Date.now()}`;

  let discountFormatted = businessData.discountSummary.trim();
  if (/^\d+$/.test(discountFormatted)) {
    discountFormatted = `${discountFormatted}% de Descuento`;
  }

  // Validación de nombre duplicado en otro registro ACTIVO
  const existingName = await prisma.business.findFirst({
    where: {
      name: { equals: cleanName, mode: "insensitive" },
      deletedAt: null,
      NOT: { id },
    },
  });
  if (existingName) {
    return {
      success: false,
      message: `Ya existe otro comercio aliado registrado con el nombre "${cleanName}".`,
    };
  }

  // Validación de slug duplicado en otro registro ACTIVO
  const existingSlug = await prisma.business.findFirst({
    where: {
      slug: cleanSlug,
      deletedAt: null,
      NOT: { id },
    },
  });
  if (existingSlug) {
    return {
      success: false,
      message: `El slug "${cleanSlug}" ya está asignado al comercio "${existingSlug.name}".`,
    };
  }

  let parsedValidUntil: Date | null = null;
  if (validUntil && typeof validUntil === "string" && validUntil.trim()) {
    const d = new Date(validUntil);
    if (!isNaN(d.getTime())) {
      parsedValidUntil = d;
    }
  }

  try {
    const business = await prisma.$transaction(async (tx) => {
      // 1. Eliminar términos anteriores
      await tx.businessTerm.deleteMany({
        where: { businessId: id },
      });

      // 2. Actualizar comercio con nuevos términos
      return await tx.business.update({
        where: { id },
        data: {
          ...businessData,
          name: cleanName,
          slug: cleanSlug,
          discountSummary: discountFormatted,
          whatsappNumber: businessData.whatsappNumber?.trim() || "",
          storeCode: (businessData.storeCode || "1234").trim().toUpperCase(),
          logoUrl: businessData.logoUrl || null,
          validUntil: parsedValidUntil,
          ...(businessData.isActive ? { deletedAt: null } : {}),
          terms: terms && terms.length > 0 ? {
            create: terms.map((t, idx) => ({
              description: t.description,
              isRule: t.isRule,
              order: t.order ?? idx + 1,
            })),
          } : undefined,
        },
        include: {
          terms: true,
        },
      });
    });

    revalidatePath("/admin/businesses");
    revalidatePath("/admin/benefits");
    revalidatePath("/admin");
    revalidatePath("/portal");
    revalidatePath("/");
    return { success: true, business };
  } catch (error: any) {
    console.error("Error al actualizar comercio:", error);
    const msg = error?.code === "P2002"
      ? "Ya existe otro comercio registrado con ese nombre o slug."
      : (error?.message || "Error al actualizar los datos del comercio aliado");
    return { success: false, message: msg };
  }
}

export async function toggleBusinessStatus(id: string, isActive: boolean) {
  const session = await getSession();
  if (!session) throw new Error("No autorizado");

  try {
    const updated = await prisma.business.update({
      where: { id },
      data: {
        isActive,
        ...(isActive ? { deletedAt: null } : {}),
      },
    });

    revalidatePath("/admin/businesses");
    revalidatePath("/admin/benefits");
    revalidatePath("/admin");
    revalidatePath("/portal");
    revalidatePath("/");
    return { success: true, isActive: updated.isActive };
  } catch (error) {
    console.error("Error al cambiar estado:", error);
    return { success: false, message: "No se pudo cambiar el estado del comercio" };
  }
}

export async function deleteBusiness(id: string) {
  const session = await getSession();
  if (!session) throw new Error("No autorizado");

  try {
    // Borrado lógico (Soft delete)
    await prisma.business.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        isActive: false,
      },
    });
    revalidatePath("/admin/businesses");
    revalidatePath("/admin/benefits");
    revalidatePath("/admin");
    revalidatePath("/portal");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Error al dar de baja comercio:", error);
    return { success: false, message: "No se pudo dar de baja al comercio" };
  }
}

export async function restoreBusiness(id: string) {
  const session = await getSession();
  if (!session) throw new Error("No autorizado");

  try {
    await prisma.business.update({
      where: { id },
      data: {
        deletedAt: null,
        isActive: true,
      },
    });
    revalidatePath("/admin/businesses");
    revalidatePath("/admin/benefits");
    revalidatePath("/admin");
    revalidatePath("/portal");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Error al restaurar comercio:", error);
    return { success: false, message: "No se pudo restaurar el comercio" };
  }
}

export async function reorderBusinesses(items: { id: string; order: number }[]) {
  const session = await getSession();
  if (!session) throw new Error("No autorizado");

  try {
    await prisma.$transaction(
      items.map((item) =>
        prisma.business.update({
          where: { id: item.id },
          data: { order: item.order },
        })
      )
    );

    revalidatePath("/admin/businesses");
    revalidatePath("/admin/benefits");
    revalidatePath("/admin");
    revalidatePath("/portal");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Error al reordenar comercios:", error);
    return { success: false, message: "Error al actualizar el orden de los comercios" };
  }
}
