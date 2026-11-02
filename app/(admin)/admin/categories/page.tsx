import React from "react";
import prisma from "@/lib/prisma";
import { CategoryManager } from "@/components/admin/category-manager";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  let categories: any[] = [];

  try {
    categories = await prisma.category.findMany({
      orderBy: { order: "asc" },
      include: {
        _count: {
          select: { businesses: true },
        },
      },
    });
  } catch (error) {
    console.error("Error al obtener categorías:", error);
  }

  return <CategoryManager initialCategories={categories} />;
}
