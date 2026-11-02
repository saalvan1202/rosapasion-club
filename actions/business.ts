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
    return { success: false, errors: validated.error.flatten().fieldErrors };
  }

  const { terms, validUntil, ...businessData } = validated.data;
  const cleanName = businessData.name.trim();
  const cleanSlug = businessData.slug.trim().toLowerCase();

  // Validación 1: Verificar que no se repita el nombre de la empresa/marca
  const existingName = await prisma.business.findFirst({
    where: { name: { equals: cleanName, mode: "insensitive" } },
  });
  if (existingName) {
    return {
      success: false,
      message: `El comercio aliado "${cleanName}" ya se encuentra registrado en el sistema.`,
    };
  }

  // Validación 2: Verificar que no se repita el slug
  const existingSlug = await prisma.business.findUnique({
    where: { slug: cleanSlug },
  });
  if (existingSlug) {
    return {
      success: false,
      message: `El slug identificador "${cleanSlug}" ya pertenece al comercio "${existingSlug.name}".`,
    };
  }

  try {
    const business = await prisma.business.create({
      data: {
        ...businessData,
        name: cleanName,
        slug: cleanSlug,
        logoUrl: businessData.logoUrl || null,
        validUntil: validUntil ? new Date(validUntil) : null,
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
  } catch (error: unknown) {
    console.error("Error al crear comercio:", error);
    return { success: false, message: "Error al registrar el comercio aliado" };
  }
}

export async function updateBusiness(id: string, data: BusinessInput) {
  const session = await getSession();
  if (!session) throw new Error("No autorizado");

  const validated = BusinessSchema.safeParse(data);
  if (!validated.success) {
    return { success: false, errors: validated.error.flatten().fieldErrors };
  }

  const { terms, validUntil, ...businessData } = validated.data;
  const cleanName = businessData.name.trim();
  const cleanSlug = businessData.slug.trim().toLowerCase();

  // Validación de nombre duplicado en otro registro
  const existingName = await prisma.business.findFirst({
    where: {
      name: { equals: cleanName, mode: "insensitive" },
      NOT: { id },
    },
  });
  if (existingName) {
    return {
      success: false,
      message: `Ya existe otro comercio aliado registrado con el nombre "${cleanName}".`,
    };
  }

  // Validación de slug duplicado en otro registro
  const existingSlug = await prisma.business.findFirst({
    where: {
      slug: cleanSlug,
      NOT: { id },
    },
  });
  if (existingSlug) {
    return {
      success: false,
      message: `El slug "${cleanSlug}" ya está asignado al comercio "${existingSlug.name}".`,
    };
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
          logoUrl: businessData.logoUrl || null,
          validUntil: validUntil ? new Date(validUntil) : null,
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
  } catch (error: unknown) {
    console.error("Error al actualizar comercio:", error);
    return { success: false, message: "Error al actualizar los datos del comercio aliado" };
  }
}

export async function toggleBusinessStatus(id: string, isActive: boolean) {
  const session = await getSession();
  if (!session) throw new Error("No autorizado");

  try {
    const updated = await prisma.business.update({
      where: { id },
      data: { isActive },
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
