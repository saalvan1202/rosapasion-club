import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET: Obtener publicaciones activas ordenadas por fecha de creación
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const includeInactive = searchParams.get("all") === "true";

    const posts = await prisma.socialPost.findMany({
      where: includeInactive ? undefined : { isActive: true },
      orderBy: [{ createdAt: "desc" }],
    });

    return NextResponse.json({
      success: true,
      posts,
      count: posts.length,
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
    const body = await req.json();
    let { platform, url, title, caption, mediaUrl, isActive } = body;

    if (!url || typeof url !== "string" || !url.trim()) {
      return NextResponse.json(
        { success: false, error: "La URL de la publicación es obligatoria" },
        { status: 400 }
      );
    }

    const cleanUrl = url.trim();

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

    const newPost = await prisma.socialPost.create({
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

    await prisma.socialPost.delete({
      where: { id },
    });

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
    const body = await req.json();
    const { id, isActive } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "El ID es requerido" },
        { status: 400 }
      );
    }

    const updated = await prisma.socialPost.update({
      where: { id },
      data: { isActive: Boolean(isActive) },
    });

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

