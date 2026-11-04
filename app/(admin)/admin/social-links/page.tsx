import React from "react";
import prisma from "@/lib/prisma";
import { SocialLinksManager } from "@/components/admin/social-links-manager";
import { Share2 } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminSocialLinksPage() {
  let posts: any[] = [];

  try {
    const db = prisma as any;
    const fetched = await db.socialPost.findMany({
      orderBy: [{ createdAt: "desc" }],
    });
    posts = fetched.map((p: any) => ({
      id: p.id,
      platform: p.platform,
      url: p.url || p.postUrl || "",
      title: p.title,
      caption: p.caption,
      isActive: p.isActive,
      createdAt: p.createdAt ? p.createdAt.toISOString() : new Date().toISOString(),
    }));
  } catch (error) {
    console.error("Error al obtener enlaces de redes sociales:", error);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-serif font-bold text-stone-900 flex items-center gap-2.5">
          <Share2 className="w-6 h-6 text-[#4A0A10]" />
          Gestión de Publicaciones de Redes Sociales
        </h1>
        <p className="text-sm text-stone-500 mt-1">
          Administra las publicaciones reales de TikTok, Instagram y Facebook que se muestran en el bloque 3x1 de la página de inicio.
        </p>
      </div>

      <SocialLinksManager initialPosts={posts} />
    </div>
  );
}

