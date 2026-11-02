"use server";

import prisma from "@/lib/prisma";
import { CategorySchema, CategoryInput } from "@/lib/validations";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function getCategories() {
  try {
    return await prisma.category.findMany({
      orderBy: { order: "asc" },
      include: {
        _count: {
          select: { businesses: true },
        },
      },
    });
  } catch (error) {
    console.error("Error al obtener categorías:", error);
    return [];
  }
}

export async function createCategory(data: CategoryInput) {
  const session = await getSession();
  if (!session) throw new Error("No autorizado");

  const validated = CategorySchema.safeParse(data);
  if (!validated.success) {
    return { success: false, errors: validated.error.flatten().fieldErrors };
  }

  const cleanName = validated.data.name.trim();
  const cleanSlug = validated.data.slug.trim().toLowerCase();

  // Validación 1: Verificar que no se repita el nombre de la categoría
  const existingName = await prisma.category.findFirst({
    where: { name: { equals: cleanName, mode: "insensitive" } },
  });
  if (existingName) {
    return {
      success: false,
      message: `La categoría "${cleanName}" ya se encuentra registrada.`,
    };
  }

  // Validación 2: Verificar que no se repita el slug
  const existingSlug = await prisma.category.findUnique({
    where: { slug: cleanSlug },
  });
  if (existingSlug) {
    return {
      success: false,
      message: `El slug identificador "${cleanSlug}" ya está en uso por la categoría "${existingSlug.name}".`,
    };
  }

  try {
    const category = await prisma.category.create({
      data: {
        ...validated.data,
        name: cleanName,
        slug: cleanSlug,
      },
    });
    revalidatePath("/admin/categories");
    revalidatePath("/admin/businesses");
    revalidatePath("/admin");
    revalidatePath("/portal");
    revalidatePath("/");
    return { success: true, category };
  } catch (error: unknown) {
    console.error("Error al crear categoría:", error);
    return { success: false, message: "Error al crear la categoría en la base de datos" };
  }
}

export async function updateCategory(id: string, data: CategoryInput) {
  const session = await getSession();
  if (!session) throw new Error("No autorizado");

  const validated = CategorySchema.safeParse(data);
  if (!validated.success) {
    return { success: false, errors: validated.error.flatten().fieldErrors };
  }

  const cleanName = validated.data.name.trim();
  const cleanSlug = validated.data.slug.trim().toLowerCase();

  // Validación si el nombre ya existe en otra categoría
  const existingName = await prisma.category.findFirst({
    where: {
      name: { equals: cleanName, mode: "insensitive" },
      NOT: { id },
    },
  });
  if (existingName) {
    return {
      success: false,
      message: `Ya existe otra categoría registrada con el nombre "${cleanName}".`,
    };
  }

  // Validación si el slug ya existe en otra categoría
  const existingSlug = await prisma.category.findFirst({
    where: {
      slug: cleanSlug,
      NOT: { id },
    },
  });
  if (existingSlug) {
    return {
      success: false,
      message: `El slug "${cleanSlug}" ya está asignado a la categoría "${existingSlug.name}".`,
    };
  }

  try {
    const category = await prisma.category.update({
      where: { id },
      data: {
        ...validated.data,
        name: cleanName,
        slug: cleanSlug,
      },
    });
    revalidatePath("/admin/categories");
    revalidatePath("/admin/businesses");
    revalidatePath("/admin");
    revalidatePath("/portal");
    revalidatePath("/");
    return { success: true, category };
  } catch (error: unknown) {
    console.error("Error al actualizar categoría:", error);
    return { success: false, message: "Error al actualizar la categoría" };
  }
}

export async function deleteCategory(id: string) {
  const session = await getSession();
  if (!session) throw new Error("No autorizado");

  try {
    await prisma.category.delete({ where: { id } });
    revalidatePath("/admin/categories");
    revalidatePath("/admin/businesses");
    revalidatePath("/admin");
    revalidatePath("/portal");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Error al eliminar categoría:", error);
    return { success: false, message: "No se pudo eliminar la categoría" };
  }
}
