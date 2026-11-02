import React from "react";
import prisma from "@/lib/prisma";
import { BusinessManager } from "@/components/admin/business-manager";

export const dynamic = "force-dynamic";

export default async function AdminBusinessesPage() {
  let businesses: any[] = [];
  let categories: any[] = [];

  try {
    const [fetchedBiz, fetchedCats] = await Promise.all([
      prisma.business.findMany({
        orderBy: [{ order: "asc" }, { createdAt: "desc" }],
        include: {
          category: { select: { id: true, name: true } },
          terms: { orderBy: { order: "asc" } },
        },
      }),
      prisma.category.findMany({
        orderBy: { order: "asc" },
        select: { id: true, name: true },
      }),
    ]);
    businesses = fetchedBiz;
    categories = fetchedCats;
  } catch (error) {
    console.error("Error al obtener comercios:", error);
  }

  return (
    <BusinessManager
      initialBusinesses={businesses}
      categories={categories}
    />
  );
}
