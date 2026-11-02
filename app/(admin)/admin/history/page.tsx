import React from "react";
import prisma from "@/lib/prisma";
import { HistoryManager } from "@/components/admin/history-manager";

export const dynamic = "force-dynamic";

export default async function AdminHistoryPage() {
  let logs: any[] = [];
  let businesses: any[] = [];
  let members: any[] = [];

  try {
    const [fetchedLogs, fetchedBiz, fetchedMembers] = await Promise.all([
      prisma.historyLog.findMany({
        orderBy: { createdAt: "desc" },
      }),
      prisma.business.findMany({
        where: { isActive: true },
        select: { id: true, name: true, discountSummary: true },
        orderBy: { name: "asc" },
      }),
      prisma.member.findMany({
        select: { id: true, code: true, name: true },
        orderBy: { code: "asc" },
      }),
    ]);

    logs = fetchedLogs;
    businesses = fetchedBiz;
    members = fetchedMembers;
  } catch (error) {
    console.error("Error al obtener historial de canjes:", error);
  }

  return (
    <HistoryManager
      initialLogs={logs}
      businesses={businesses}
      members={members}
    />
  );
}
