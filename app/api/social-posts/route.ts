import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";

// Resuelve URLs de redirección de Facebook móvil (ej: /share/r/CODE/) a la URL canónica del Reel
async function resolveCanonicalUrl(url: string): Promise<string> {
  const clean = url.trim();
  if (clean.includes("facebook.com/share/")) {
    try {
      const res = await fetch(clean, { method: "HEAD", redirect: "manual" });
      const location = res.headers.get("location");
      if (location) {
        const u = new URL(location);
        u.search = ""; // Remover parámetros de tracking como mibextid, rdid, share_url
        return u.toString();
      }
    } catch (e) {
      console.error("Error al resolver URL de Facebook share:", e);
    }
  }
  return clean;
}

// GET: Obtener publicaciones activas ordenadas por fecha de creación
export async function GET(req: NextRequest) {
  try {
    const db = prisma as any;
    const { searchParams } = new URL(req.url);
    const includeInactive = searchParams.get("all") === "true";

    const posts = await db.socialPost.findMany({
      where: includeInactive ? undefined : { isActive: true },
      orderBy: [{ createdAt: "desc" }],
    });

    // Resolver en paralelo enlaces de share que hayan quedado pendientes
    const resolvedPosts = await Promise.all(
      posts.map(async (post: any) => {
        const rawUrl = post.url || post.postUrl || "";
        if (rawUrl.includes("facebook.com/share/")) {
          const canonical = await resolveCanonicalUrl(rawUrl);
          if (canonical !== rawUrl) {
            // Actualizar en DB en segundo plano para que quede permanente
            db.socialPost
              .update({
                where: { id: post.id },
                data: { url: canonical, postUrl: canonical },
              })
              .catch(() => {});
            return { ...post, url: canonical, postUrl: canonical };
          }
        }
        return post;
      })
    );

    return NextResponse.json({
      success: true,
      posts: resolvedPosts,
      count: resolvedPosts.length,
    });
  } catch (error) {
    console.error("Error al obtener social posts:", error);
    return NextResponse.json(
      { success: false, error: "Error al obtener las publicaciones de redes sociales" },
      { status: 500 }
    );
  }
}

// POST: Registrar un nuevo enlace de publicación
export async function POST(req: NextRequest) {
  try {
    const db = prisma as any;
    const body = await req.json();
    let { platform, url, title, caption, mediaUrl, isActive } = body;

    if (!url || typeof url !== "string" || !url.trim()) {
      return NextResponse.json(
        { success: false, error: "La URL de la publicación es obligatoria" },
        { status: 400 }
      );
    }

    let cleanUrl = url.trim();

    // Detección automática de plataforma si no se especificó o para normalizar
    let detectedPlatform = (platform || "").toUpperCase();
    if (!["TIKTOK", "FACEBOOK", "INSTAGRAM"].includes(detectedPlatform)) {
      if (cleanUrl.includes("tiktok.com")) {
        detectedPlatform = "TIKTOK";
      } else if (cleanUrl.includes("instagram.com")) {
        detectedPlatform = "INSTAGRAM";
      } else if (cleanUrl.includes("facebook.com") || cleanUrl.includes("fb.watch")) {
        detectedPlatform = "FACEBOOK";
      } else {
        detectedPlatform = "FACEBOOK";
      }
    }

    // Si es enlace compartido de Facebook, resolver a la URL canónica permanente
    if (detectedPlatform === "FACEBOOK" && cleanUrl.includes("facebook.com/share/")) {
      cleanUrl = await resolveCanonicalUrl(cleanUrl);
    }

    const newPost = await db.socialPost.create({
      data: {
        platform: detectedPlatform,
        url: cleanUrl,
        postUrl: cleanUrl,
        title: title?.trim() || null,
        caption: caption?.trim() || "",
        mediaUrl: mediaUrl?.trim() || null,
        isActive: isActive !== undefined ? Boolean(isActive) : true,
      },
    });

    revalidatePath("/admin/social-links");
    revalidatePath("/admin/social");
    revalidatePath("/");
    revalidatePath("/portal");

    return NextResponse.json(
      { success: true, post: newPost, message: "Publicación registrada con éxito" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error al registrar social post:", error);
    return NextResponse.json(
      { success: false, error: "Error interno al guardar la publicación" },
      { status: 500 }
    );
  }
}

// DELETE: Eliminar una publicación registrada
export async function DELETE(req: NextRequest) {
  try {
    const db = prisma as any;
    const { searchParams } = new URL(req.url);
    let id = searchParams.get("id");

    if (!id) {
      try {
        const body = await req.json();
        id = body?.id;
      } catch {
        // no body
      }
    }

    if (!id) {
      return NextResponse.json(
        { success: false, error: "El ID de la publicación es obligatorio" },
        { status: 400 }
      );
    }

    await db.socialPost.delete({
      where: { id },
    });

    revalidatePath("/admin/social-links");
    revalidatePath("/admin/social");
    revalidatePath("/");
    revalidatePath("/portal");

    return NextResponse.json({
      success: true,
      message: "Publicación eliminada correctamente",
    });
  } catch (error) {
    console.error("Error al eliminar social post:", error);
    return NextResponse.json(
      { success: false, error: "No se pudo eliminar la publicación" },
      { status: 500 }
    );
  }
}

// PATCH: Alternar estado activo / inactivo
export async function PATCH(req: NextRequest) {
  try {
    const db = prisma as any;
    const body = await req.json();
    const { id, isActive } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "El ID es requerido" },
        { status: 400 }
      );
    }

    const updated = await db.socialPost.update({
      where: { id },
      data: { isActive: Boolean(isActive) },
    });

    revalidatePath("/admin/social-links");
    revalidatePath("/admin/social");
    revalidatePath("/");
    revalidatePath("/portal");

    return NextResponse.json({
      success: true,
      post: updated,
    });
  } catch (error) {
    console.error("Error al actualizar social post:", error);
    return NextResponse.json(
      { success: false, error: "No se pudo actualizar el estado" },
      { status: 500 }
    );
  }
}

