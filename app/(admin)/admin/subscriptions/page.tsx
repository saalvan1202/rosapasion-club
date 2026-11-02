import React from "react";
import prisma from "@/lib/prisma";
import { SubscriptionManager } from "@/components/admin/subscription-manager";

export const dynamic = "force-dynamic";

export default async function AdminSubscriptionsPage() {
  let members: any[] = [];

  try {
    members = await prisma.member.findMany({
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
