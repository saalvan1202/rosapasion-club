import { NextRequest, NextResponse } from "next/server";
import { uploadImage } from "@/lib/storage";

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || "";

    // 1. JSON con base64
    if (contentType.includes("application/json")) {
      const { base64Data, filename } = await req.json();

      if (!base64Data) {
        return NextResponse.json({ error: "No se proporcionó imagen de comprobante" }, { status: 400 });
      }

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

      const safeFilename = `voucher-${(filename || "comprobante").replace(/[^a-zA-Z0-9_-]/g, "")}`;
      const result = await uploadImage(buffer, safeFilename, extension, "vouchers");

      return NextResponse.json({
        success: true,
        url: result.url,
        provider: result.provider,
        sizeBytes: result.sizeBytes,
      });
    }

    // 2. FormData
    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;

      if (!file) {
        return NextResponse.json({ error: "No se envió archivo de comprobante" }, { status: 400 });
      }

      if (file.size > MAX_FILE_SIZE_BYTES) {
        return NextResponse.json(
          { error: "El archivo excede el límite máximo de 5MB" },
          { status: 400 }
        );
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      const extension = file.name.split(".").pop() || "webp";
      const safeFilename = `voucher-${file.name.replace(/[^a-zA-Z0-9_-]/g, "")}`;

      const result = await uploadImage(buffer, safeFilename, extension, "vouchers");

      return NextResponse.json({
        success: true,
        url: result.url,
        provider: result.provider,
        sizeBytes: result.sizeBytes,
      });
    }

    return NextResponse.json({ error: "Tipo de contenido no soportado" }, { status: 400 });
  } catch (error) {
    console.error("Error al procesar subida de comprobante:", error);
    return NextResponse.json({ error: "Error al subir comprobante" }, { status: 500 });
  }
}

