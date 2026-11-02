import React from "react";
import prisma from "@/lib/prisma";
import { BenefitManager } from "@/components/admin/benefit-manager";

export const dynamic = "force-dynamic";

export default async function AdminBenefitsPage() {
  let businesses: any[] = [];

  try {
    businesses = await prisma.business.findMany({
      orderBy: [{ order: "asc" }, { name: "asc" }],
      include: {
        category: { select: { id: true, name: true } },
        terms: { orderBy: { order: "asc" } },
      },
    });
  } catch (error) {
    console.error("Error al obtener beneficios:", error);
  }

  return <BenefitManager initialBusinesses={businesses} />;
}
