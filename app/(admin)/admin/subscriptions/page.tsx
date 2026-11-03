import React from "react";
import prisma from "@/lib/prisma";
import { SubscriptionManager } from "@/components/admin/subscription-manager";

export const dynamic = "force-dynamic";

export default async function AdminSubscriptionsPage() {
  let members: any[] = [];

  try {
    // 1. Limpiar definitivamente socios dados de baja
    await prisma.member.deleteMany({
      where: { deletedAt: { not: null } },
    }).catch(() => {});

    // 2. Obtener socios activos
    members = await prisma.member.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { history: true },
        },
      },
    });
  } catch (error) {
    console.error("Error al obtener suscripciones de socios:", error);
  }

  return <SubscriptionManager initialMembers={members} />;
}
