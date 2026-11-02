import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { uploadImage } from "@/lib/storage";

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB límite de seguridad

export async function POST(req: NextRequest) {
  try {
    // 1. Verificación de autorización de administrador
    const session = await getSession();
    if (!session || (session.role !== "ADMIN" && session.role !== "EDITOR")) {
      return NextResponse.json(
        { error: "No autorizado. Inicie sesión como administrador." },
        { status: 401 }
      );
    }

    const contentType = req.headers.get("content-type") || "";

    // Acepta JSON con base64 webp o png/jpg
    if (contentType.includes("application/json")) {
      const { base64Data, filename } = await req.json();

      if (!base64Data) {
        return NextResponse.json({ error: "No se proporcionó imagen" }, { status: 400 });
      }

      // Remover cabecera data:image/webp;base64, si existe
      const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      let buffer: Buffer;
      let extension = "webp";

      if (matches && matches.length === 3) {
        buffer = Buffer.from(matches[2], "base64");
        if (matches[1].includes("png")) extension = "png";
        else if (matches[1].includes("jpeg") || matches[1].includes("jpg")) extension = "jpg";
        else if (matches[1].includes("webp")) extension = "webp";
      } else {
        buffer = Buffer.from(base64Data, "base64");
      }

      if (buffer.length > MAX_FILE_SIZE_BYTES) {
        return NextResponse.json(
          { error: "La imagen excede el límite máximo de 5MB" },
          { status: 400 }
        );
      }

      const result = await uploadImage(buffer, filename, extension, "logos");

      return NextResponse.json({
        success: true,
        url: result.url,
        provider: result.provider,
        sizeBytes: result.sizeBytes,
      });
    }

    // Acepta FormData
    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;

      if (!file) {
        return NextResponse.json({ error: "No se envió archivo" }, { status: 400 });
      }

      if (file.size > MAX_FILE_SIZE_BYTES) {
        return NextResponse.json(
          { error: "El archivo excede el límite máximo de 5MB" },
          { status: 400 }
        );
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      const extension = file.name.split(".").pop() || "webp";

      const result = await uploadImage(buffer, file.name, extension, "logos");

      return NextResponse.json({
        success: true,
        url: result.url,
        provider: result.provider,
        sizeBytes: result.sizeBytes,
      });
    }

    return NextResponse.json({ error: "Tipo de contenido no soportado" }, { status: 400 });
  } catch (error) {
    console.error("Error al subir imagen:", error);
    return NextResponse.json({ error: "Error al procesar subida" }, { status: 500 });
  }
}
