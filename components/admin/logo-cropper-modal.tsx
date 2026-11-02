"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Upload,
  X,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Check,
  Sparkles,
  Image as ImageIcon,
  Move,
  Maximize2,
  Minimize2,
} from "lucide-react";

interface LogoCropperModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (webpUrl: string) => void;
  currentLogoUrl?: string;
  businessName?: string;
}

export function LogoCropperModal({
  isOpen,
  onClose,
  onSave,
  currentLogoUrl,
  businessName = "Comercio Aliado",
}: LogoCropperModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(currentLogoUrl || null);
  const [origSizeKb, setOrigSizeKb] = useState<number | null>(null);
  const [webpSizeKb, setWebpSizeKb] = useState<number | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [livePreviewUrl, setLivePreviewUrl] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const imageObjRef = useRef<HTMLImageElement | null>(null);

  // Cargar imagen
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setOrigSizeKb(Math.round(file.size / 1024));

    const reader = new FileReader();
    reader.onload = () => {
      const src = reader.result as string;
      setImageSrc(src);
      setZoom(1);
      setOffsetX(0);
      setOffsetY(0);

      const img = new Image();
      img.onload = () => {
        imageObjRef.current = img;
        renderCanvas(img, 1, 0, 0);
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  };

  // Renderizar en Canvas de alta resolución (500x500)
  const renderCanvas = useCallback(
    (img: HTMLImageElement, currentZoom: number, curX: number, curY: number) => {
      const canvas = canvasRef.current;
      if (!canvas || !img) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const size = 500;
      canvas.width = size;
      canvas.height = size;

      // Limpiar fondo blanco puro (como la tarjeta del portal)
      ctx.clearRect(0, 0, size, size);
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, size, size);

      // Proporción base: encajar imagen
      const imgRatio = img.width / img.height;
      let drawWidth = size;
      let drawHeight = size;

      if (imgRatio > 1) {
        drawHeight = size / imgRatio;
      } else {
        drawWidth = size * imgRatio;
      }

      // Aplicar zoom
      drawWidth *= currentZoom;
      drawHeight *= currentZoom;

      // Centrado con offset
      const posX = (size - drawWidth) / 2 + curX;
      const posY = (size - drawHeight) / 2 + curY;

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, posX, posY, drawWidth, drawHeight);

      // Generar data URL para estimación y vista previa en tiempo real
      const webpData = canvas.toDataURL("image/webp", 0.9);
      setLivePreviewUrl(webpData);

      const head = "data:image/webp;base64,";
      const bytes = Math.round(((webpData.length - head.length) * 3) / 4);
      setWebpSizeKb(Math.round(bytes / 1024));
    },
    []
  );

  useEffect(() => {
    if (imageObjRef.current) {
      renderCanvas(imageObjRef.current, zoom, offsetX, offsetY);
    }
  }, [zoom, offsetX, offsetY, renderCanvas]);

  // Manejo de arrastre interactivo escalado al tamaño visual del canvas
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const canvas = canvasRef.current;
    const rect = canvas?.getBoundingClientRect();
    const scale = rect && rect.width > 0 ? 500 / rect.width : 1.78;

    const deltaX = (e.clientX - dragStart.x) * scale;
    const deltaY = (e.clientY - dragStart.y) * scale;

    setOffsetX((prev) => prev + deltaX);
    setOffsetY((prev) => prev + deltaY);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Preajustes rápidos de escala
  const handlePresetFit = () => {
    setZoom(1.0);
    setOffsetX(0);
    setOffsetY(0);
  };

  const handlePresetFill = () => {
    if (!imageObjRef.current) return;
    const img = imageObjRef.current;
    const imgRatio = img.width / img.height;
    // Si la imagen es horizontal, escalar para que el alto cubra los 500px, y viceversa
    const fillZoom = imgRatio > 1 ? imgRatio : 1 / imgRatio;
    setZoom(Math.min(3.0, Math.max(1.0, fillZoom * 1.15)));
    setOffsetX(0);
    setOffsetY(0);
  };

  // Guardar y convertir a WebP
  const handleApplyWebP = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setIsProcessing(true);
    try {
      const webpBase64 = canvas.toDataURL("image/webp", 0.9);

      // Subir a servidor para guardar como archivo estático
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          base64Data: webpBase64,
          filename: selectedFile ? selectedFile.name.split(".")[0] : "logo-aliado",
        }),
      });

      const data = await res.json();
      if (data.success && data.url) {
        onSave(data.url);
      } else {
        onSave(webpBase64);
      }
      onClose();
    } catch (err) {
      console.error("Error al procesar logo:", err);
      const webpBase64 = canvas.toDataURL("image/webp", 0.9);
      onSave(webpBase64);
      onClose();
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      <div className="fixed inset-0 bg-black/75 backdrop-blur-xs" />

      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl p-5 sm:p-6 z-10 border border-stone-200 animate-in fade-in zoom-in-95 duration-150 max-h-[94vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-100 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#FAF2E8] text-[#800C1B] flex items-center justify-center shadow-xs">
              <Sparkles className="w-4 h-4 text-[#D4AF37]" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-stone-900">
                Ajustar y Encuadrar Logo (WebP)
              </h3>
              <p className="text-[11px] text-stone-500">
                Escala y posición exacta 1:1 tal como se verá en la web
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-stone-400 hover:text-stone-700 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3.5 py-3 overflow-y-auto flex-1">
          {/* File Picker Button */}
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png, image/jpeg, image/jpg, image/webp"
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl border-2 border-dashed border-stone-300 hover:border-[#800C1B] text-stone-700 hover:text-[#800C1B] text-xs font-semibold bg-stone-50/60 hover:bg-[#FAF2E8]/40 transition cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>{imageSrc ? "Cambiar archivo PNG / JPG" : "Seleccionar PNG o JPG del equipo"}</span>
            </button>
          </div>

          {/* Interactive Canvas Viewport (Proporción exacta del contenedor de logo en tarjeta) */}
          <div className="flex flex-col items-center">
            <div className="relative w-64 h-64 sm:w-68 sm:h-68 bg-white rounded-2xl border-2 border-[#D4AF37]/60 overflow-hidden shadow-lg select-none cursor-move flex items-center justify-center">
              <canvas
                ref={canvasRef}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                className="w-full h-full object-contain"
              />

              {!imageSrc && (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center pointer-events-none text-stone-400">
                  <ImageIcon className="w-10 h-10 mb-2 stroke-1" />
                  <span className="text-xs font-medium">Ningún logo seleccionado</span>
                  <span className="text-[10px] text-stone-400 mt-1">
                    Selecciona un archivo PNG o JPG
                  </span>
                </div>
              )}

              {/* Guía de encuadre en esquinas */}
              {imageSrc && (
                <div className="absolute inset-0 pointer-events-none border border-stone-300/40 rounded-2xl shadow-[inset_0_0_0_1px_rgba(255,255,255,0.6)]" />
              )}
            </div>

            <p className="text-[10px] text-stone-400 mt-1.5 flex items-center gap-1">
              <Move className="w-3 h-3 text-[#D4AF37]" />
              <span>Arrastra con el mouse para centrar o reubicar el logotipo</span>
            </p>
          </div>

          {/* Vista Previa Real en Tarjeta de la Web */}
          {imageSrc && (
            <div className="bg-gradient-to-r from-[#3D0710] via-[#2A050B] to-[#230408] p-3 rounded-2xl border border-[#D4AF37]/40 shadow-inner flex items-center gap-3">
              <div className="w-16 h-16 rounded-2xl bg-white shadow-md flex items-center justify-center p-1.5 flex-shrink-0 overflow-hidden border border-[#D4AF37]/40">
                {livePreviewUrl ? (
                  <img
                    src={livePreviewUrl}
                    alt="Vista previa tarjeta"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <span className="text-[9px] text-stone-400">Sin logo</span>
                )}
              </div>
              <div className="min-w-0">
                <span className="text-[9px] uppercase tracking-wider text-[#D4AF37] font-bold block">
                  Vista Previa en Tarjeta Web (1:1)
                </span>
                <p className="text-xs sm:text-sm font-bold text-white truncate">
                  {businessName}
                </p>
                <span className="inline-block mt-0.5 text-[9px] text-emerald-400 font-semibold bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/30">
                  ● ALIADO OFICIAL
                </span>
              </div>
            </div>
          )}

          {/* Controles de Zoom y Ajuste */}
          {imageSrc && (
            <div className="space-y-2.5 bg-stone-50 p-3 rounded-2xl border border-stone-200 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-stone-700 flex items-center gap-1.5">
                  <ZoomIn className="w-3.5 h-3.5 text-stone-500" />
                  Zoom / Escala ({Math.round(zoom * 100)}%)
                </span>

                {/* Preajustes rápidos */}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handlePresetFit}
                    className="px-2 py-0.5 rounded bg-white hover:bg-stone-100 text-stone-600 border border-stone-200 text-[10px] font-medium flex items-center gap-1 cursor-pointer"
                    title="Ajustar completo"
                  >
                    <Minimize2 className="w-2.5 h-2.5" />
                    <span>Ajustar</span>
                  </button>
                  <button
                    type="button"
                    onClick={handlePresetFill}
                    className="px-2 py-0.5 rounded bg-white hover:bg-stone-100 text-stone-600 border border-stone-200 text-[10px] font-medium flex items-center gap-1 cursor-pointer"
                    title="Llenar recuadro"
                  >
                    <Maximize2 className="w-2.5 h-2.5" />
                    <span>Llenar</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setZoom(1);
                      setOffsetX(0);
                      setOffsetY(0);
                    }}
                    className="px-2 py-0.5 rounded bg-white hover:bg-stone-100 text-stone-600 border border-stone-200 text-[10px] font-medium flex items-center gap-1 cursor-pointer"
                    title="Restablecer"
                  >
                    <RotateCcw className="w-2.5 h-2.5" />
                    <span>100%</span>
                  </button>
                </div>
              </div>

              {/* Slider de Zoom ampliado de 0.5 a 3.5 */}
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setZoom((z) => Math.max(0.5, parseFloat((z - 0.1).toFixed(2))))}
                  className="p-1 rounded-md bg-stone-200/70 hover:bg-stone-300 text-stone-700 cursor-pointer"
                  title="Reducir zoom"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <input
                  type="range"
                  min="0.5"
                  max="3.5"
                  step="0.05"
                  value={zoom}
                  onChange={(e) => setZoom(parseFloat(e.target.value))}
                  className="flex-1 accent-[#800C1B] cursor-pointer"
                />
                <button
                  type="button"
                  onClick={() => setZoom((z) => Math.min(3.5, parseFloat((z + 0.1).toFixed(2))))}
                  className="p-1 rounded-md bg-stone-200/70 hover:bg-stone-300 text-stone-700 cursor-pointer"
                  title="Aumentar zoom"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Comparador de Peso WebP */}
              <div className="pt-2 border-t border-stone-200 flex items-center justify-between text-[11px]">
                <span className="text-stone-500">
                  {origSizeKb ? `Original: ${origSizeKb} KB` : "PNG/JPG"}
                </span>
                {webpSizeKb && (
                  <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    <Check className="w-3 h-3" />
                    WebP Optimizado: {webpSizeKb} KB
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="pt-3 border-t border-stone-100 flex items-center justify-end gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-stone-600 hover:bg-stone-100 cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={!imageSrc || isProcessing}
            onClick={handleApplyWebP}
            className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#800C1B] hover:bg-[#580A15] text-white text-xs font-semibold shadow-md disabled:opacity-50 cursor-pointer transition-all active:scale-95"
          >
            <Check className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>{isProcessing ? "Procesando WebP..." : "Guardar Logo WebP"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
