import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * Endpoint de ejecución periódica (Cron Job)
 * Actualiza membresías vencidas y genera auditoría de vencimientos próximos.
 * Uso seguro:
 * Header: Authorization: Bearer <CRON_SECRET> o param ?token=<CRON_SECRET>
 */
export async function GET(req: NextRequest) {
  try {
    const cronSecret = process.env.CRON_SECRET;
    const authHeader = req.headers.get("authorization");
    const queryToken = req.nextUrl.searchParams.get("token");

    // En producción, valida el token secreto del cron
    if (cronSecret) {
      const isAuthorized =
        authHeader === `Bearer ${cronSecret}` || queryToken === cronSecret;
      if (!isAuthorized) {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
      }
    }

    const now = new Date();
    const inThreeDays = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);

    // 1. Sincronizar membresías que expiraron y siguen en ACTIVA
    const expiredUpdateResult = await prisma.member.updateMany({
      where: {
        status: "ACTIVA",
        validUntil: { lt: now },
        deletedAt: null,
      },
      data: {
        status: "VENCIDA",
      },
    });

    // 2. Monitorear miembros por vencer en los próximos 3 días
    const expiringSoon = await prisma.member.findMany({
      where: {
        status: "ACTIVA",
        validUntil: {
          gte: now,
          lte: inThreeDays,
        },
        deletedAt: null,
      },
      select: {
        id: true,
        code: true,
        name: true,
        phone: true,
        validUntil: true,
      },
    });

    // 3. Métricas actuales de la base de datos
    const [totalActive, totalExpired, totalMembers] = await Promise.all([
      prisma.member.count({ where: { status: "ACTIVA", deletedAt: null } }),
      prisma.member.count({ where: { status: "VENCIDA", deletedAt: null } }),
      prisma.member.count({ where: { deletedAt: null } }),
    ]);

    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      updatedToExpiredCount: expiredUpdateResult.count,
      expiringSoonCount: expiringSoon.length,
      expiringSoonList: expiringSoon,
      stats: {
        totalActive,
        totalExpired,
        totalMembers,
      },
    });
  } catch (error) {
    console.error("Error en cron sync-members:", error);
    return NextResponse.json(
      { error: "Error interno al ejecutar cron" },
      { status: 500 }
    );
  }
}
