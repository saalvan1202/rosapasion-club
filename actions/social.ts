"use server";

import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export interface SocialPostItem {
  id: string;
  platform: "FACEBOOK" | "INSTAGRAM" | "TIKTOK" | string;
  url?: string;
  title?: string | null;
  caption: string;
  mediaUrl: string;
  postUrl: string;
  embedUrl?: string | null;
  authorName: string;
  authorHandle?: string | null;
  authorAvatar?: string | null;
  likesCount?: number | null;
  commentsCount?: number | null;
  viewsCount?: number | null;
  publishedAt: Date | string;
  order: number;
  isActive: boolean;
}

const INITIAL_SOCIAL_POSTS = [
  {
    platform: "INSTAGRAM",
    title: "Nueva Colección de Rosas Eternas",
    caption: "🌹 ¿Sabías que con tu membresía de Rosa Pasión Club tienes un 15% de descuento en todos nuestros arreglos florales y cajas de lujo? Ven y sorprende a quien más amas. #RosaPasion #Tarapoto #ClubDeBeneficios",
    mediaUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80",
    postUrl: "https://www.instagram.com/rosapasion_tarapoto",
    authorName: "Rosa Pasión Florería",
    authorHandle: "@rosapasion_tarapoto",
    authorAvatar: "/logo.png",
    likesCount: 520,
    commentsCount: 42,
    viewsCount: 4600,
    order: 1,
    isActive: true,
  },
  {
    platform: "TIKTOK",
    title: "Preparando una sorpresa gigante en Tarapoto ✨",
    caption: "¡Mira el detrás de cámaras de este ramo buchón de 100 rosas rojas entregado hoy! Recuerda mostrar tu tarjeta Rosa Pasión Club para beneficios exclusivos. 💐❤️ #TarapotoSanMartin #RamosBuchones #FloresTarapoto",
    mediaUrl: "https://images.unsplash.com/photo-1561181286-d3fee7d55364?auto=format&fit=crop&w=800&q=80",
    postUrl: "https://www.tiktok.com/@rosapasion.tarapoto",
    authorName: "Rosa Pasión Oficial",
    authorHandle: "@rosapasion.tarapoto",
    authorAvatar: "/logo.png",
    likesCount: 1850,
    commentsCount: 95,
    viewsCount: 24500,
    order: 2,
    isActive: true,
  },
  {
    platform: "FACEBOOK",
    title: "¡Nuevas Marcas Aliadas se suman al Club!",
    caption: "¡Seguimos creciendo para darte lo mejor! 🎉 Presentando tu tarjeta física o digital de Rosa Pasión Club accedes a descuentos exclusivos en cafeterías, restaurantes, spa y más en toda la ciudad. Conoce la lista completa en nuestra web.",
    mediaUrl: "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=800&q=80",
    postUrl: "https://www.facebook.com/Rosapasion",
    authorName: "Rosa Pasión Tarapoto",
    authorHandle: "@Rosapasion",
    authorAvatar: "/logo.png",
    likesCount: 340,
    commentsCount: 28,
    viewsCount: 3800,
    order: 3,
    isActive: true,
  },
  {
    platform: "INSTAGRAM",
    title: "Detalles que enamoran en cada ocasión",
    caption: "Cada entrega lleva un pedacito de nuestro corazón. Gracias por confiar en nosotros para sus fechas más memorables. ¡Aprovecha los descuentos del Club para tu próximo aniversario! 🥂🌷",
    mediaUrl: "https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=800&q=80",
    postUrl: "https://www.instagram.com/rosapasiontarapoto",
    authorName: "Rosa Pasión Florería",
    authorHandle: "@rosapasiontarapoto",
    authorAvatar: "/logo.png",
    likesCount: 228,
    commentsCount: 12,
    viewsCount: 2100,
    order: 4,
    isActive: true,
  },
  {
    platform: "TIKTOK",
    title: "Así reaccionó al recibir su ramo sorpresa 🥺",
    caption: "¿Y a ti, ya te regalaron rosas este año? Etiqueta a tu persona especial para que sepa qué regalarte en tu cumpleaños 😉🌹 #RosaPasionClub #SorpresasTarapoto",
    mediaUrl: "https://images.unsplash.com/photo-1526047932273-341f2a7631f9?auto=format&fit=crop&w=800&q=80",
    postUrl: "https://www.tiktok.com/@rosapasiontarapoto",
    authorName: "Rosa Pasión Oficial",
    authorHandle: "@rosapasiontarapoto",
    authorAvatar: "/logo.png",
    likesCount: 1450,
    commentsCount: 88,
    viewsCount: 28900,
    order: 5,
    isActive: true,
  },
  {
    platform: "FACEBOOK",
    title: "Horarios de Atención y Envíos a Domicilio",
    caption: "Atendemos de Lunes a Domingo con envíos exprés a todo Tarapoto, Morales y La Banda de Shilcayo. Haz tu pedido con anticipación o contáctanos por WhatsApp para asesorarte al instante. 🛵✨",
    mediaUrl: "https://images.unsplash.com/photo-1508615039623-a25605d2b022?auto=format&fit=crop&w=800&q=80",
    postUrl: "https://www.facebook.com/rosapasiontarapoto",
    authorName: "Rosa Pasión Tarapoto",
    authorHandle: "@rosapasiontarapoto",
    authorAvatar: "/logo.png",
    likesCount: 195,
    commentsCount: 14,
    viewsCount: 1800,
    order: 6,
    isActive: true,
  },
];

export async function getSocialPosts(): Promise<SocialPostItem[]> {
  const db = prisma as any;
  try {
    let posts = await db.socialPost.findMany({
      where: { isActive: true },
      orderBy: [{ order: "asc" }, { publishedAt: "desc" }],
    });

    if (!posts || posts.length === 0) {
      // Auto-seed initial posts
      await db.socialPost.createMany({
        data: INITIAL_SOCIAL_POSTS,
      });

      posts = await db.socialPost.findMany({
        where: { isActive: true },
        orderBy: [{ order: "asc" }, { publishedAt: "desc" }],
      });
    }

    return posts.map((p: any) => ({
      id: p.id,
      platform: p.platform,
      title: p.title,
      caption: p.caption || "",
      url: p.url || p.postUrl || "",
      mediaUrl: p.mediaUrl || "",
      postUrl: p.postUrl || p.url || "",
      embedUrl: p.embedUrl,
      authorName: p.authorName || "Rosa Pasión",
      authorHandle: p.authorHandle,
      authorAvatar: p.authorAvatar,
      likesCount: p.likesCount,
      commentsCount: p.commentsCount,
      viewsCount: p.viewsCount,
      publishedAt: p.publishedAt ? p.publishedAt.toISOString() : p.createdAt.toISOString(),
      order: p.order,
      isActive: p.isActive,
    }));
  } catch (error) {
    console.error("Error al obtener publicaciones sociales:", error);
    return INITIAL_SOCIAL_POSTS.map((p, idx) => ({
      ...p,
      id: `fallback-${idx}`,
      publishedAt: new Date().toISOString(),
    }));
  }
}

export async function createSocialPost(data: Partial<SocialPostItem>) {
  const session = await getSession();
  if (!session) throw new Error("No autorizado");
  const db = prisma as any;

  try {
    const post = await db.socialPost.create({
      data: {
        platform: data.platform || "INSTAGRAM",
        title: data.title || null,
        caption: data.caption || "",
        mediaUrl: data.mediaUrl || "",
        postUrl: data.postUrl || "",
        embedUrl: data.embedUrl || null,
        authorName: data.authorName || "Rosa Pasión",
        authorHandle: data.authorHandle || "@rosapasiontarapoto",
        authorAvatar: data.authorAvatar || "/logo.png",
        likesCount: Number(data.likesCount) || 0,
        commentsCount: Number(data.commentsCount) || 0,
        viewsCount: Number(data.viewsCount) || 0,
        order: Number(data.order) || 0,
        isActive: data.isActive !== false,
      },
    });

    revalidatePath("/");
    revalidatePath("/admin/settings");
    return { success: true, post };
  } catch (error: any) {
    console.error("Error al crear publicación social:", error);
    return { success: false, error: error.message };
  }
}

export async function updateSocialPost(id: string, data: Partial<SocialPostItem>) {
  const session = await getSession();
  if (!session) throw new Error("No autorizado");
  const db = prisma as any;

  try {
    const post = await db.socialPost.update({
      where: { id },
      data: {
        platform: data.platform,
        title: data.title,
        caption: data.caption,
        mediaUrl: data.mediaUrl,
        postUrl: data.postUrl,
        embedUrl: data.embedUrl,
        authorName: data.authorName,
        authorHandle: data.authorHandle,
        authorAvatar: data.authorAvatar,
        likesCount: data.likesCount != null ? Number(data.likesCount) : undefined,
        commentsCount: data.commentsCount != null ? Number(data.commentsCount) : undefined,
        viewsCount: data.viewsCount != null ? Number(data.viewsCount) : undefined,
        order: data.order != null ? Number(data.order) : undefined,
        isActive: data.isActive,
      },
    });

    revalidatePath("/");
    revalidatePath("/admin/settings");
    return { success: true, post };
  } catch (error: any) {
    console.error("Error al actualizar publicación social:", error);
    return { success: false, error: error.message };
  }
}

export async function deleteSocialPost(id: string) {
  const session = await getSession();
  if (!session) throw new Error("No autorizado");
  const db = prisma as any;

  try {
    await db.socialPost.delete({
      where: { id },
    });

    revalidatePath("/");
    revalidatePath("/admin/settings");
    return { success: true };
  } catch (error: any) {
    console.error("Error al eliminar publicación social:", error);
    return { success: false, error: error.message };
  }
}

