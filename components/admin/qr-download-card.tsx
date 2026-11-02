"use client";

import React, { useState, useEffect, useRef } from "react";
import QRCode from "qrcode";
import {
  Download,
  Copy,
  Check,
  ExternalLink,
  Printer,
  Sparkles,
  QrCode as QrCodeIcon,
  Palette,
  Eye,
  FileDown,
} from "lucide-react";

interface QrDownloadCardProps {
  targetUrl: string;
}

export function QrDownloadCard({ targetUrl }: QrDownloadCardProps) {
  const [copied, setCopied] = useState(false);
  const [colorScheme, setColorScheme] = useState<"black" | "red" | "wine">("black");
  const [dotStyle, setDotStyle] = useState<"rounded" | "square">("rounded");
  const [withLogo, setWithLogo] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewDataUrl, setPreviewDataUrl] = useState<string>("");

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Colores principales
  const colorMap = {
    black: { fill: "#0D0D0D", label: "Negro Ónix (Recomendado)", preview: "bg-[#0D0D0D]" },
    red: { fill: "#F20519", label: "Rojo Pasión Vivo", preview: "bg-[#F20519]" },
    wine: { fill: "#8C0303", label: "Carmesí Profundo", preview: "bg-[#8C0303]" },
  };

  const activeColor = colorMap[colorScheme].fill;
  const effectiveUrl = (targetUrl || "https://rosapasionclub.com").trim();

  // Función principal para renderizar el QR en el canvas
  const renderQrToCanvas = async (
    targetCanvas: HTMLCanvasElement,
    canvasSize: number = 1600
  ): Promise<void> => {
    const ctx = targetCanvas.getContext("2d");
    if (!ctx) return;

    targetCanvas.width = canvasSize;
    targetCanvas.height = canvasSize;

    // Fondo blanco nítido
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, canvasSize, canvasSize);

    const qr = QRCode.create(effectiveUrl, { errorCorrectionLevel: "H" });
    const matrix = qr.modules;
    const modCount = matrix.size;
    const margin = 3.5;
    const totalMods = modCount + margin * 2;
    const modSize = canvasSize / totalMods;

    // Área reservada para el logo central (aprox 28% del ancho)
    const centerSize = withLogo ? Math.floor(modCount * 0.28) : 0;
    const centerStart = withLogo ? Math.floor((modCount - centerSize) / 2) : -1;
    const centerEnd = withLogo ? centerStart + centerSize : -1;

    // Dibujar módulos de datos
    ctx.fillStyle = activeColor;

    for (let r = 0; r < modCount; r++) {
      for (let c = 0; c < modCount; c++) {
        // Omitir zona del logo central
        if (
          withLogo &&
          r >= centerStart &&
          r < centerEnd &&
          c >= centerStart &&
          c < centerEnd
        ) {
          continue;
        }

        // Omitir esquinas de los localizadores (finders)
        const isTopLeftFinder = r < 7 && c < 7;
        const isTopRightFinder = r < 7 && c >= modCount - 7;
        const isBottomLeftFinder = r >= modCount - 7 && c < 7;

        if (isTopLeftFinder || isTopRightFinder || isBottomLeftFinder) {
          continue;
        }

        if (matrix.get(r, c)) {
          const x = (c + margin) * modSize;
          const y = (r + margin) * modSize;
          const w = modSize - 0.6;
          const h = modSize - 0.6;

          ctx.beginPath();
          if (dotStyle === "rounded") {
            const rad = modSize * 0.44;
            if (ctx.roundRect) {
              ctx.roundRect(x + 0.3, y + 0.3, w, h, rad);
            } else {
              ctx.arc(x + modSize / 2, y + modSize / 2, modSize * 0.42, 0, Math.PI * 2);
            }
          } else {
            ctx.rect(x + 0.3, y + 0.3, w, h);
          }
          ctx.fill();
        }
      }
    }

    // Función auxiliar para dibujar los ojos del QR (Finder patterns)
    const drawFinderEye = (row: number, col: number) => {
      const x = (col + margin) * modSize;
      const y = (row + margin) * modSize;
      const w = 7 * modSize;
      const rOuter = dotStyle === "rounded" ? modSize * 2.2 : 0;
      const rInner = dotStyle === "rounded" ? modSize * 1.2 : 0;

      // Marco exterior
      ctx.fillStyle = activeColor;
      ctx.beginPath();
      if (ctx.roundRect && rOuter > 0) {
        ctx.roundRect(x, y, w, w, rOuter);
      } else {
        ctx.rect(x, y, w, w);
      }
      ctx.fill();

      // Espacio blanco intermedio
      ctx.fillStyle = "#FFFFFF";
      ctx.beginPath();
      const gapX = x + modSize;
      const gapY = y + modSize;
      const gapW = 5 * modSize;
      if (ctx.roundRect && rOuter > 0) {
        ctx.roundRect(gapX, gapY, gapW, gapW, rOuter * 0.72);
      } else {
        ctx.rect(gapX, gapY, gapW, gapW);
      }
      ctx.fill();

      // Punto central
      ctx.fillStyle = activeColor;
      ctx.beginPath();
      const eyeX = x + 2 * modSize;
      const eyeY = y + 2 * modSize;
      const eyeW = 3 * modSize;
      if (ctx.roundRect && rInner > 0) {
        ctx.roundRect(eyeX, eyeY, eyeW, eyeW, rInner);
      } else {
        ctx.rect(eyeX, eyeY, eyeW, eyeW);
      }
      ctx.fill();
    };

    drawFinderEye(0, 0);
    drawFinderEye(0, modCount - 7);
    drawFinderEye(modCount - 7, 0);

    // Dibujar logo central si está activo
    if (withLogo) {
      const badgeX = (centerStart + margin - 0.4) * modSize;
      const badgeY = (centerStart + margin - 0.4) * modSize;
      const badgeW = (centerSize + 0.8) * modSize;
      const badgeH = badgeW;

      // Placa blanca protectora con borde sutil
      ctx.fillStyle = "#FFFFFF";
      ctx.beginPath();
      const badgeRadius = modSize * 1.6;
      if (ctx.roundRect) {
        ctx.roundRect(badgeX, badgeY, badgeW, badgeH, badgeRadius);
      } else {
        ctx.rect(badgeX, badgeY, badgeW, badgeH);
      }
      ctx.fill();

      ctx.strokeStyle = "#F5ECE1";
      ctx.lineWidth = modSize * 0.15;
      ctx.stroke();

      // Cargar e incrustar la imagen del logo oficial
      await new Promise<void>((resolve) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = "/logo-vertical.png";
        img.onload = () => {
          const logoMaxW = badgeW * 0.88;
          const logoMaxH = badgeH * 0.88;
          const aspect = img.width / img.height;

          let targetW = logoMaxW;
          let targetH = targetW / aspect;
          if (targetH > logoMaxH) {
            targetH = logoMaxH;
            targetW = targetH * aspect;
          }

          const logoX = badgeX + (badgeW - targetW) / 2;
          const logoY = badgeY + (badgeH - targetH) / 2;

          ctx.drawImage(img, logoX, logoY, targetW, targetH);
          resolve();
        };
        img.onerror = () => {
          // Si falla la imagen, continuamos limpiamente
          resolve();
        };
      });
    }
  };

  // Re-generar QR cuando cambien las propiedades
  useEffect(() => {
    let isCancelled = false;
    const generate = async () => {
      setIsGenerating(true);
      try {
        const offscreen = document.createElement("canvas");
        await renderQrToCanvas(offscreen, 1200);
        if (!isCancelled) {
          setPreviewDataUrl(offscreen.toDataURL("image/png"));
        }
      } catch (err) {
        console.error("Error al generar vista previa del QR:", err);
      } finally {
        if (!isCancelled) setIsGenerating(false);
      }
    };

    generate();

    return () => {
      isCancelled = true;
    };
  }, [effectiveUrl, colorScheme, dotStyle, withLogo]);

  // 1. Descargar en Alta Definición (2000x2000 px)
  const handleDownloadHD = async () => {
    const canvas = document.createElement("canvas");
    await renderQrToCanvas(canvas, 2048);
    const dataUrl = canvas.toDataURL("image/png");

    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `qr-rosapasionclub-${colorScheme}-2048px.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // 2. Descargar Stand / Tarjeta lista para imprimir en A5/Mostrador
  const handleDownloadPrintableCard = async () => {
    const canvas = document.createElement("canvas");
    const width = 1400;
    const height = 1900;
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Fondo elegante degradado carmesí oscuro y negro ónix
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, "#1A0205");
    grad.addColorStop(0.5, "#0D0D0D");
    grad.addColorStop(1, "#0D0D0D");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Borde perimetral dorado fino
    ctx.strokeStyle = "#D4AF37";
    ctx.lineWidth = 6;
    if (ctx.roundRect) {
      ctx.roundRect(40, 40, width - 80, height - 80, 36);
    } else {
      ctx.rect(40, 40, width - 80, height - 80);
    }
    ctx.stroke();

    // Marco interior tenue
    ctx.strokeStyle = "rgba(212, 175, 55, 0.3)";
    ctx.lineWidth = 1.5;
    if (ctx.roundRect) {
      ctx.roundRect(55, 55, width - 110, height - 110, 28);
    } else {
      ctx.rect(55, 55, width - 110, height - 110);
    }
    ctx.stroke();

    // Texto de Cabecera
    ctx.textAlign = "center";
    ctx.fillStyle = "#EEDC94";
    ctx.font = "bold 28px sans-serif";
    ctx.letterSpacing = "6px";
    ctx.fillText("CLUB DE BENEFICIOS EXCLUSIVOS", width / 2, 140);

    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 64px serif";
    ctx.letterSpacing = "2px";
    ctx.fillText("ROSA PASIÓN CLUB", width / 2, 220);

    ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
    ctx.font = "26px sans-serif";
    ctx.letterSpacing = "1px";
    ctx.fillText("Descuentos & Cortesías en Toda Nuestra Red de Aliados", width / 2, 275);

    // Renderizar QR en un canvas secundario de 860x860
    const qrCanvas = document.createElement("canvas");
    await renderQrToCanvas(qrCanvas, 900);

    // Fondo blanco con sombra para el QR
    const qrBoxW = 960;
    const qrBoxH = 960;
    const qrBoxX = (width - qrBoxW) / 2;
    const qrBoxY = 330;

    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(qrBoxX, qrBoxY, qrBoxW, qrBoxH, 40);
    } else {
      ctx.rect(qrBoxX, qrBoxY, qrBoxW, qrBoxH);
    }
    ctx.fill();

    // Borde dorado sutil alrededor del QR
    ctx.strokeStyle = "rgba(212, 175, 55, 0.5)";
    ctx.lineWidth = 4;
    ctx.stroke();

    // Dibujar el QR
    ctx.drawImage(qrCanvas, qrBoxX + 30, qrBoxY + 30, 900, 900);

    // Instrucción de escaneo inferior
    ctx.fillStyle = "#F7EDC4";
    ctx.font = "bold 38px sans-serif";
    ctx.letterSpacing = "2px";
    ctx.fillText("¡ESCANEA AQUÍ CON TU CELULAR!", width / 2, 1370);

    ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
    ctx.font = "24px sans-serif";
    ctx.fillText("Abre la cámara de tu smartphone y enfoca este código", width / 2, 1420);

    // Enlace web inferior
    ctx.fillStyle = "#EEDC94";
    ctx.font = "bold 32px monospace";
    ctx.letterSpacing = "3px";
    ctx.fillText("rosapasionclub.com", width / 2, 1500);

    // Footer oficial
    ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
    ctx.font = "20px sans-serif";
    ctx.letterSpacing = "1px";
    ctx.fillText("Rosa Pasión Flores y Detalles • Tarjetas Físicas & Digitales", width / 2, 1780);

    // Descargar
    const dataUrl = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `stand-imprimible-rosapasionclub.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // 3. Copiar imagen al portapapeles
  const handleCopyClipboard = async () => {
    try {
      const canvas = document.createElement("canvas");
      await renderQrToCanvas(canvas, 1200);
      canvas.toBlob((blob) => {
        if (blob && navigator.clipboard && navigator.clipboard.write) {
          navigator.clipboard
            .write([
              new ClipboardItem({
                "image/png": blob,
              }),
            ])
            .then(() => {
              setCopied(true);
              setTimeout(() => setCopied(false), 2500);
            });
        }
      });
    } catch (e) {
      console.error("Error al copiar al portapapeles:", e);
    }
  };

  return (
    <div className="mt-4 pt-4 border-t border-stone-200">
      <div className="bg-stone-50/80 rounded-2xl border border-stone-200 p-4 sm:p-5">
        {/* Cabecera del generador */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-stone-200/70">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#8C0303]/10 text-[#8C0303] flex items-center justify-center font-bold">
              <QrCodeIcon className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wide flex items-center gap-1.5">
                <span>Código QR Oficial de Rosa Pasión Club</span>
                <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  Listo para Descargar
                </span>
              </h4>
              <p className="text-[11px] text-stone-500">
                Generado con el logotipo oficial de Rosa Pasión y corrección de error alta (H) para máxima legibilidad
              </p>
            </div>
          </div>

          <a
            href={effectiveUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="self-start sm:self-auto inline-flex items-center gap-1 text-[11px] font-semibold text-[#8C0303] hover:underline"
            title="Abrir destino en pestaña nueva"
          >
            <span>Probar Enlace</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        {/* Contenido: Preview a la izquierda + Opciones y Descargas a la derecha */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 pt-4 items-center">
          {/* LADO 1: Vista Previa del QR Estilizado */}
          <div className="md:col-span-5 flex flex-col items-center">
            <div className="relative group p-3 bg-white rounded-2xl shadow-md border border-stone-200/80 hover:shadow-lg transition-all">
              {previewDataUrl ? (
                <img
                  src={previewDataUrl}
                  alt="Código QR Oficial Rosa Pasión Club"
                  className="w-48 h-48 sm:w-56 sm:h-56 object-contain rounded-xl"
                />
              ) : (
                <div className="w-48 h-48 sm:w-56 sm:h-56 bg-stone-100 rounded-xl flex items-center justify-center text-xs text-stone-400 animate-pulse">
                  Generando QR...
                </div>
              )}

              {/* Marca de agua / URL pequeña bajo el QR */}
              <div className="mt-2 text-center">
                <p className="text-[10px] font-mono font-bold text-stone-600 truncate max-w-[200px] mx-auto">
                  {effectiveUrl.replace(/^https?:\/\//, "")}
                </p>
              </div>
            </div>
          </div>

          {/* LADO 2: Controles de Personalización y Botones de Descarga */}
          <div className="md:col-span-7 space-y-4">
            {/* Opciones Rápidas de Estilo */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-stone-700 block">
                Personalizar Diseño del QR:
              </span>

              {/* Selector de Color */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] text-stone-500 w-12">Color:</span>
                {(Object.keys(colorMap) as Array<keyof typeof colorMap>).map((key) => {
                  const item = colorMap[key];
                  const isSelected = colorScheme === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setColorScheme(key)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition cursor-pointer ${
                        isSelected
                          ? "bg-stone-900 text-white border-stone-900 shadow-2xs"
                          : "bg-white text-stone-700 border-stone-200 hover:bg-stone-50"
                      }`}
                    >
                      <span className={`w-3 h-3 rounded-full ${item.preview} border border-white/40`} />
                      <span>{key === "black" ? "Negro" : key === "red" ? "Rojo" : "Carmesí"}</span>
                    </button>
                  );
                })}
              </div>

              {/* Forma y Logo */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="text-[11px] text-stone-500 w-12">Forma:</span>
                <button
                  type="button"
                  onClick={() => setDotStyle("rounded")}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                    dotStyle === "rounded"
                      ? "bg-stone-900 text-white border-stone-900 shadow-2xs"
                      : "bg-white text-stone-700 border-stone-200 hover:bg-stone-50"
                  }`}
                >
                  Suave (Redondeado)
                </button>
                <button
                  type="button"
                  onClick={() => setDotStyle("square")}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                    dotStyle === "square"
                      ? "bg-stone-900 text-white border-stone-900 shadow-2xs"
                      : "bg-white text-stone-700 border-stone-200 hover:bg-stone-50"
                  }`}
                >
                  Clásico (Cuadrado)
                </button>

                <button
                  type="button"
                  onClick={() => setWithLogo(!withLogo)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                    withLogo
                      ? "bg-red-50 text-[#8C0303] border-red-200 font-bold"
                      : "bg-white text-stone-600 border-stone-200"
                  }`}
                >
                  {withLogo ? "✓ Con Logo Oficial" : "Sin Logo"}
                </button>
              </div>
            </div>

            {/* Acciones de Descarga */}
            <div className="space-y-2 pt-2 border-t border-stone-200/80">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {/* Botón 1: Descargar PNG en Alta Definición */}
                <button
                  type="button"
                  onClick={handleDownloadHD}
                  className="w-full py-2.5 px-3.5 rounded-xl bg-gradient-to-r from-[#8C0303] to-[#F20519] hover:from-[#720202] hover:to-[#D40416] text-white font-bold text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Descargar PNG (2048px)</span>
                </button>

                {/* Botón 2: Tarjeta / Stand Listo para Imprimir */}
                <button
                  type="button"
                  onClick={handleDownloadPrintableCard}
                  className="w-full py-2.5 px-3.5 rounded-xl bg-stone-900 hover:bg-black text-amber-300 border border-amber-400/40 font-bold text-xs uppercase tracking-wider shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  title="Genera un afiche de mesa / stand vertical para imprimir"
                >
                  <Printer className="w-4 h-4 text-amber-300" />
                  <span>Stand / Afiche Imprimible</span>
                </button>
              </div>

              {/* Botón 3: Copiar al Portapapeles */}
              <button
                type="button"
                onClick={handleCopyClipboard}
                className="w-full py-2 px-3 rounded-lg bg-white hover:bg-stone-100 text-stone-700 border border-stone-200 text-xs font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700 font-bold">¡Copiado al Portapapeles!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-stone-500" />
                    <span>Copiar Imagen para Pegar (WhatsApp / Photoshop / Canva)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
