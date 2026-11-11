"use client";

import React, { useState, useRef, useCallback } from "react";
import { RotateCw, Sparkles, ShieldCheck, QrCode } from "lucide-react";

interface InteractiveCardProps {
  member: {
    id: string;
    code: string;
    cardNumber?: string | null;
    name: string;
    documentType?: string;
    documentNumber?: string | null;
    recipientName?: string | null;
    status: "ACTIVA" | "VENCIDA" | "SUSPENDIDA";
    validFrom: string;
    validUntil: string;
    isCurrentlyActive: boolean;
    daysRemaining: number;
    hasPendingPayment?: boolean;
  } | null;
  onOpenRedeemModal?: () => void;
  onOpenRenewalModal?: () => void;
}

export function InteractiveCard({
  member,
  onOpenRedeemModal,
  onOpenRenewalModal,
}: InteractiveCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [glarePos, setGlarePos] = useState({ x: 50, y: 50, opacity: 0 });
  const [isFlipped, setIsFlipped] = useState(false);

  // 3D Tilt calculation
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotX = ((y - centerY) / centerY) * -10; // max 10 deg tilt
    const rotY = ((x - centerX) / centerX) * 10;

    setRotateX(rotX);
    setRotateY(rotY);
    setGlarePos({
      x: (x / rect.width) * 100,
      y: (y / rect.height) * 100,
      opacity: 0.35,
    });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setRotateX(0);
    setRotateY(0);
    setGlarePos((prev) => ({ ...prev, opacity: 0 }));
  }, []);

  // Touch support for mobile
  const handleTouchMove = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    if (!cardRef.current || !e.touches[0]) return;
    const rect = cardRef.current.getBoundingClientRect();
    const touch = e.touches[0];
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    setRotateX(((y - centerY) / centerY) * -8);
    setRotateY(((x - centerX) / centerX) * 8);
    setGlarePos({
      x: (x / rect.width) * 100,
      y: (y / rect.height) * 100,
      opacity: 0.25,
    });
  }, []);

  const handleTouchEnd = useCallback(() => {
    setRotateX(0);
    setRotateY(0);
    setGlarePos((prev) => ({ ...prev, opacity: 0 }));
  }, []);

  const toggleFlip = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setIsFlipped((prev) => !prev);
  };

  const hasSearched = !!member;
  const cardMemberName = hasSearched
    ? ((member as any).recipientName || member.name).trim().toUpperCase()
    : "";
  const cardMemberCode = hasSearched
    ? ((member as any).cardNumber || member.code).trim().toUpperCase()
    : "";

  // Dynamic font sizing for long names
  const nameFontSize =
    cardMemberName.length > 26 ? 12 :
    cardMemberName.length > 20 ? 13.5 :
    cardMemberName.length > 15 ? 15 : 16.5;

  const qrData = hasSearched
    ? `https://rosapasionclub.com?code=${encodeURIComponent(cardMemberCode)}`
    : "https://rosapasionclub.com";
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
    qrData
  )}&color=7C1314&bgcolor=FFFFFF`;

  return (
    <div className="w-full flex flex-col items-center">
      {/* 3D PERSPECTIVE WRAPPER */}
      <div
        className="w-full relative select-none"
        style={{ perspective: "1200px" }}
      >
        <div
          ref={cardRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onClick={toggleFlip}
          className="relative w-full aspect-[598/350] cursor-pointer transition-transform duration-300 ease-out"
          style={{
            transformStyle: "preserve-3d",
            transform: `rotateX(${rotateX}deg) rotateY(${
              rotateY + (isFlipped ? 180 : 0)
            }deg)`,
          }}
          title="Toca para girar la tarjeta"
        >
          {/* ======================================================== */}
          {/* CARA FRONTAL (DISEÑO BLANCO OFICIAL ROSA PASIÓN CLUB)    */}
          {/* ======================================================== */}
          <div
            className="absolute inset-0 w-full h-full rounded-2xl sm:rounded-[24px] overflow-hidden shadow-2xl border-2 border-[#D4AF37]/70 bg-white"
            style={{
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
            }}
          >
            {/* Imagen Base Oficial Limpia */}
            <picture className="absolute inset-0 w-full h-full pointer-events-none">
              <source srcSet="/card-template-white-clean.webp" type="image/webp" />
              <img
                src="/card-template-white-clean.png"
                alt="Rosa Pasión Club"
                className="w-full h-full object-cover pointer-events-none select-none"
              />
            </picture>

            {/* Capa Vectorial SVG de Alta Precisión Tipográfica */}
            <svg
              viewBox="0 0 598 350"
              className="absolute inset-0 w-full h-full pointer-events-none select-none"
            >
              {hasSearched ? (
                <>
                  {/* NOMBRE DEL SOCIO */}
                  <text
                    x="272"
                    y="248"
                    fill="#7C1314"
                    fontFamily="'Playfair Display', Georgia, 'Times New Roman', serif"
                    fontWeight="700"
                    fontSize={nameFontSize}
                    letterSpacing="1.2"
                  >
                    {cardMemberName}
                  </text>

                  {/* CÓDIGO DEL SOCIO */}
                  <text
                    x="272"
                    y="273"
                    fill="#7C1314"
                    fontFamily="'Playfair Display', Georgia, 'Times New Roman', serif"
                    fontWeight="700"
                    fontSize="15.5"
                    letterSpacing="2.8"
                  >
                    {cardMemberCode}
                  </text>
                </>
              ) : (
                <>
                  {/* Guías elegantes cuando aún no se consulta DNI */}
                  <line
                    x1="272"
                    y1="244"
                    x2="455"
                    y2="244"
                    stroke="#7C1314"
                    strokeWidth="2.2"
                    strokeDasharray="8 6"
                    strokeLinecap="round"
                    opacity="0.4"
                  />
                  <line
                    x1="272"
                    y1="269"
                    x2="375"
                    y2="269"
                    stroke="#7C1314"
                    strokeWidth="2.2"
                    strokeDasharray="8 6"
                    strokeLinecap="round"
                    opacity="0.4"
                  />
                </>
              )}
            </svg>

            {/* Holographic glossy reflection effect */}
            <div
              className="absolute inset-0 pointer-events-none mix-blend-overlay transition-opacity duration-200"
              style={{
                opacity: glarePos.opacity,
                background: `radial-gradient(circle at ${glarePos.x}% ${glarePos.y}%, rgba(255,255,255,0.85) 0%, rgba(212,175,55,0.3) 35%, transparent 70%)`,
              }}
            />

            {/* Status Badge (Activa / Vencida / Pago en revisión) */}
            {member && (
              <div className="absolute top-2.5 right-2.5 sm:top-3.5 sm:right-3.5 z-20">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold tracking-wider shadow-md backdrop-blur-md ${
                    member.hasPendingPayment
                      ? "bg-amber-100 text-amber-900 border border-amber-400"
                      : member.status === "ACTIVA"
                      ? "bg-emerald-100 text-emerald-900 border border-emerald-400"
                      : "bg-red-100 text-red-900 border border-red-400"
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                      member.status === "ACTIVA"
                        ? "bg-emerald-600 animate-pulse"
                        : member.hasPendingPayment
                        ? "bg-amber-600 animate-pulse"
                        : "bg-red-600"
                    }`}
                  />
                  {member.hasPendingPayment ? "PAGO EN REVISIÓN" : member.status}
                </span>
              </div>
            )}

            {/* Subtle interactive Hint at Bottom Right */}
            <div className="absolute bottom-2 right-2.5 z-20 flex items-center space-x-1 text-[9px] text-[#7C1314]/70 hover:text-[#7C1314] font-medium bg-white/80 px-2 py-0.5 rounded-full border border-[#D4AF37]/40 shadow-xs">
              <RotateCw className="w-2.5 h-2.5 animate-spin-slow" />
              <span>Girar</span>
            </div>
          </div>

          {/* ======================================================== */}
          {/* CARA POSTERIOR / REVERSO OFICIAL DE LA TARJETA           */}
          {/* ======================================================== */}
          <div
            className="absolute inset-0 w-full h-full rounded-2xl sm:rounded-[24px] overflow-hidden shadow-2xl border-2 border-[#D4AF37]/70 bg-white"
            style={{
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
            }}
          >
            {/* Imagen Base Oficial del Reverso */}
            <picture className="absolute inset-0 w-full h-full pointer-events-none">
              <source srcSet="/card-template-white-back.webp" type="image/webp" />
              <img
                src="/card-template-white-back.png"
                alt="Reverso Rosa Pasión Club - Marcas Aliadas"
                className="w-full h-full object-cover pointer-events-none select-none"
              />
            </picture>

            {/* Holographic glossy reflection effect en reverso */}
            <div
              className="absolute inset-0 pointer-events-none mix-blend-overlay transition-opacity duration-200"
              style={{
                opacity: glarePos.opacity * 0.7,
                background: `radial-gradient(circle at ${glarePos.x}% ${glarePos.y}%, rgba(255,255,255,0.7) 0%, transparent 60%)`,
              }}
            />

            {/* Botón flotante para voltear al frente */}
            <div className="absolute bottom-2 right-2.5 z-20 flex items-center space-x-1 text-[9px] text-[#7C1314]/80 hover:text-[#7C1314] font-medium bg-white/90 px-2 py-0.5 rounded-full border border-[#D4AF37]/50 shadow-xs cursor-pointer">
              <RotateCw className="w-2.5 h-2.5" />
              <span>Voltear al frente</span>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Helper Text */}
      <div className="mt-2.5 flex items-center justify-center gap-2 text-xs text-stone-300">
        <span className="inline-flex items-center gap-1 bg-white/[0.12] backdrop-blur-md border border-white/20 px-3 py-1 rounded-full text-[11px] text-white shadow-sm">
          <RotateCw className="w-3 h-3 text-[#E5C058]" />
          <span>Toca la tarjeta para ver el reverso y QR</span>
        </span>
      </div>
    </div>
  );
}

