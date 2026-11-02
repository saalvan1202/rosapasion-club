import crypto from "crypto";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export interface UploadResult {
  url: string;
  provider: "cloudinary" | "local";
  sizeBytes: number;
}

let sharpInstance: any = null;
let sharpChecked = false;

async function getSharp() {
  if (sharpChecked) return sharpInstance;
  try {
    // Import dinámico para evitar fallos en compilación (Next.js build) en CPUs de VPS
    const sharpModule = await import("sharp");
    sharpInstance = sharpModule.default || sharpModule;
  } catch (err) {
    console.warn("Aviso: Sharp nativo no está disponible en este procesador/VPS. Se usará el archivo directo.");
    sharpInstance = null;
  }
  sharpChecked = true;
  return sharpInstance;
}

/**
 * Optimiza y convierte cualquier imagen (PNG, JPG, JPEG, WEBP, etc.) al formato .webp:
 * - Reduce el peso drásticamente (60-80% de ahorro de ancho de banda y disco)
 * - Auto-rota según orientación del sensor móvil (EXIF)
 * - Limpia metadatos privados
 * - Redimensiona de forma segura a máx 1920px si la foto proviene de cámaras de alta resolución
 */
export async function optimizeToWebp(buffer: Buffer): Promise<{ buffer: Buffer; sizeBytes: number; isWebp: boolean }> {
  try {
    const sharp = await getSharp();
    if (!sharp) {
      return { buffer, sizeBytes: buffer.length, isWebp: false };
    }

    const optimized = await sharp(buffer)
      .rotate() // Auto-orientación según EXIF de teléfonos
      .resize({
        width: 1920,
        height: 1920,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: 82, effort: 4 })
      .toBuffer();

    return { buffer: optimized, sizeBytes: optimized.length, isWebp: true };
  } catch (err) {
    console.warn("Aviso: No se pudo convertir con Sharp, se usará el buffer original:", err);
    return { buffer, sizeBytes: buffer.length, isWebp: false };
  }
}

/**
 * Almacenamiento desacoplado listo para VPS y producción:
 * - Convierte todas las imágenes automáticamente a .webp de bajo peso si Sharp está disponible.
 * - Si existen variables de Cloudinary en .env, sube al CDN de Cloudinary.
 * - Si no, utiliza almacenamiento local ultra-eficiente en /public/uploads/ con carpetas organizadas.
 */
export async function uploadImage(
  buffer: Buffer,
  filename: string,
  extension = "webp",
  folder = "logos"
): Promise<UploadResult> {
  // 1. Convertir y optimizar con Sharp si la CPU lo soporta, o usar buffer directo
  const { buffer: webpBuffer, sizeBytes, isWebp } = await optimizeToWebp(buffer);
  const targetExtension = isWebp ? "webp" : (extension.replace(".", "") || "png");

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  // 2. Si Cloudinary está configurado, usar Cloudinary CDN
  if (cloudName && apiKey && apiSecret) {
    try {
      const timestamp = Math.round(Date.now() / 1000);
      const cloudinaryFolder = `rosapasion_${folder}`;

      // Generar firma SHA-1 requerida por la API REST de Cloudinary
      const paramsToSign = `folder=${cloudinaryFolder}&timestamp=${timestamp}${apiSecret}`;
      const signature = crypto.createHash("sha1").update(paramsToSign).digest("hex");

      const mimeType = isWebp ? "image/webp" : (targetExtension === "png" ? "image/png" : "image/jpeg");
      const base64Data = webpBuffer.toString("base64");
      const dataUri = `data:${mimeType};base64,${base64Data}`;

      const formData = new URLSearchParams();
      formData.append("file", dataUri);
      formData.append("api_key", apiKey);
      formData.append("timestamp", timestamp.toString());
      formData.append("folder", cloudinaryFolder);
      formData.append("signature", signature);

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        const errText = await response.text();
        console.error("Error al subir a Cloudinary:", errText);
        throw new Error("Fallo al subir a Cloudinary");
      }

      const result = await response.json();
      return {
        url: result.secure_url,
        provider: "cloudinary",
        sizeBytes,
      };
    } catch (cloudErr) {
      console.warn("Fallo en Cloudinary, recurriendo a almacenamiento local VPS:", cloudErr);
    }
  }

  // 3. Almacenamiento local en disco del VPS: /public/uploads/{folder}
  const safeFolder = folder.replace(/[^a-zA-Z0-9_-]/g, "");
  const uploadDir = path.join(process.cwd(), "public", "uploads", safeFolder);
  await mkdir(uploadDir, { recursive: true });

  const cleanBase = filename
    ? filename.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9_-]/g, "")
    : `img-${Date.now()}`;
  const cleanName = `${Date.now()}-${cleanBase}.${targetExtension}`;

  const filePath = path.join(uploadDir, cleanName);
  await writeFile(filePath, webpBuffer);

  return {
    url: `/uploads/${safeFolder}/${cleanName}`,
    provider: "local",
    sizeBytes,
  };
}
