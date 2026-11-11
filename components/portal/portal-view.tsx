"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import Link from "next/link";
import { renderCategoryIcon } from "@/lib/category-icons";
import {
  Sparkles,
  Coffee,
  HeartPulse,
  Heart,
  Car,
  Cake,
  Building2,
  Scale,
  Search,
  ExternalLink,
  Crown,
  FileCheck2,
  CheckCircle2,
  X,
  BookOpen,
  Phone,
  Monitor,
  Smartphone,
  Tag,
  Gift,
  Store,
  ShieldCheck,
  CreditCard,
  AlertCircle,
  Check,
  Clock,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { lookupMemberByDocOrCode } from "@/actions/redemption";
import { RedemptionModal } from "./redemption-modal";
import { MembershipRequestSection } from "./membership-request-section";
import { RenewalPaymentModal } from "./renewal-payment-modal";
import { SocialFeedSection } from "./social-feed-section";
import { SocialButtons } from "@/components/social/social-buttons";
import { InteractiveCard } from "./interactive-card";

export interface BusinessTerm {
  id: string;
  description: string;
  isRule: boolean;
  order: number;
}

export interface BusinessItem {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string | null;
  discountSummary: string;
  whatsappNumber?: string | null;
  facebookUrl?: string | null;
  instagramUrl?: string | null;
  tiktokUrl?: string | null;
  storeCode?: string;
  order?: number;
  validUntil?: Date | string | null;
  category: {
    id: string;
    name: string;
    slug: string;
  };
  terms: BusinessTerm[];
}

interface Category {
  id: string;
  name: string;
  slug: string;
  iconName: string;
}

interface PortalViewProps {
  categories: Category[];
  businesses: BusinessItem[];
  socialPosts?: any[];
  catalogUrl: string;
  supportPhone: string;
  facebookUrl?: string;
  instagramUrl?: string;
  tiktokUrl?: string;
  clubSettings?: any;
}

export function PortalView({
  categories,
  businesses,
  socialPosts = [],
  catalogUrl,
  supportPhone,
  facebookUrl = "https://www.facebook.com/rosapasiontarapoto",
  instagramUrl = "https://www.instagram.com/rosapasiontarapoto",
  tiktokUrl = "https://www.tiktok.com/@rosapasiontarapoto",
  clubSettings,
}: PortalViewProps) {
  const [selectedCategorySlug, setSelectedCategorySlug] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeModalBusiness, setActiveModalBusiness] = useState<BusinessItem | null>(null);
  const [isCatalogModalOpen, setIsCatalogModalOpen] = useState(false);

  // Digital Card & DNI verification state
  const [docQuery, setDocQuery] = useState("");
  const [isCheckingMember, setIsCheckingMember] = useState(false);
  const [lookupMessage, setLookupMessage] = useState<string | null>(null);
  const [isLookupError, setIsLookupError] = useState(false);
  const [isRedeemModalOpen, setIsRedeemModalOpen] = useState(false);
  const [isRenewalModalOpen, setIsRenewalModalOpen] = useState(false);

  const [verifiedMember, setVerifiedMember] = useState<{
    id: string;
    code: string;
    cardNumber?: string | null;
    name: string;
    documentType: string;
    documentNumber: string | null;
    phone?: string | null;
    recipientName?: string | null;
    recipientPhone?: string | null;
    senderName?: string | null;
    dedication?: string | null;
    status: "ACTIVA" | "VENCIDA" | "SUSPENDIDA";
    validFrom: string;
    validUntil: string;
    isCurrentlyActive: boolean;
    daysRemaining: number;
    totalRedemptions: number;
    hasPendingPayment?: boolean;
    pendingPayment?: {
      id: string;
      paymentMethod: string;
      amount: number;
      createdAt: string;
      waPendingUrl: string;
    } | null;
  } | null>(null);

  const handleLookupMember = async (e?: React.FormEvent, customQuery?: string) => {
    if (e) e.preventDefault();
    const queryToUse = customQuery !== undefined ? customQuery : docQuery;

    // Si el campo está vacío, resetea la tarjeta a blanco (sin nada, sin nombre ni datos)
    if (!queryToUse.trim()) {
      setVerifiedMember(null);
      setLookupMessage(null);
      setIsLookupError(false);
      return;
    }

    setIsCheckingMember(true);
    setLookupMessage(null);
    setIsLookupError(false);

    try {
      const res = await lookupMemberByDocOrCode(queryToUse.trim());
      if (res.found && res.member) {
        setVerifiedMember(res.member);
        if (res.member.hasPendingPayment || res.hasPendingPayment) {
          setLookupMessage(
            "Tu pago de renovación aún está siendo revisado por nuestro equipo. Por favor espera unos minutos o comunícate por WhatsApp si olvidaste notificar tu pago."
          );
          setIsLookupError(false);
        } else if (res.member.isCurrentlyActive) {
          setLookupMessage(`¡Tarjeta activa! Socio: ${res.member.name}. Quedan ${res.member.daysRemaining} días de vigencia.`);
          setIsLookupError(false);
        } else {
          setLookupMessage(`La tarjeta de ${res.member.name} se encuentra ${res.member.status}.`);
          setIsLookupError(true);
        }
      } else {
        setVerifiedMember(null);
        setLookupMessage(res.message || "Socio no registrado en la base de datos.");
        setIsLookupError(true);
      }
    } catch (err) {
      setLookupMessage("Error al conectar con el servidor.");
      setIsLookupError(true);
    } finally {
      setIsCheckingMember(false);
    }
  };

  // Paginación & Carrusel Automático (6 comercios simultáneos)
  const [currentPage, setCurrentPage] = useState(1);
  const [isHovered, setIsHovered] = useState(false);
  const [isFading, setIsFading] = useState(false);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const pageSize = 3; // Mostrar exactamente 3 aliados en una sola fila (3 x 1)
  const directoryRef = useRef<HTMLElement>(null);

  // Reiniciar página a 1 cada vez que se filtre por categoría o búsqueda
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategorySlug, searchQuery]);

  // Filter businesses (respetando estrictamente el orden personalizado configurado en admin)
  const filteredBusinesses = useMemo(() => {
    const sorted = [...businesses].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    return sorted.filter((b) => {
      const matchesCategory =
        selectedCategorySlug === "all" || b.category.slug === selectedCategorySlug;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        q === "" ||
        b.name.toLowerCase().includes(q) ||
        b.discountSummary.toLowerCase().includes(q) ||
        b.category.name.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [businesses, selectedCategorySlug, searchQuery]);

  const totalItems = filteredBusinesses.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;

  const goToPage = (pageNumber: number) => {
    if (pageNumber === currentPage || isFading) return;
    setIsFading(true);
    setTimeout(() => {
      setCurrentPage(pageNumber);
      setIsFading(false);
    }, 280);
  };

  const nextCarouselPage = () => {
    const nextPage = currentPage >= totalPages ? 1 : currentPage + 1;
    goToPage(nextPage);
  };

  const prevCarouselPage = () => {
    const prevPage = currentPage <= 1 ? totalPages : currentPage - 1;
    goToPage(prevPage);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const diff = touchStartX - e.changedTouches[0].clientX;
    if (diff > 45) {
      nextCarouselPage();
    } else if (diff < -45) {
      prevCarouselPage();
    }
    setTouchStartX(null);
  };

  // Autoplay de 3 en 3 cada 10 segundos (se pausa al interactuar o pasar el cursor)
  useEffect(() => {
    if (totalPages <= 1 || isHovered) return;

    const timer = setInterval(() => {
      setIsFading(true);
      setTimeout(() => {
        setCurrentPage((prev) => (prev >= totalPages ? 1 : prev + 1));
        setIsFading(false);
      }, 280);
    }, 10000); // 10 segundos

    return () => clearInterval(timer);
  }, [totalPages, isHovered]);

  const paginatedBusinesses = filteredBusinesses.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const getCategoryIcon = (iconName: string) => {
    return renderCategoryIcon(iconName, "w-4 h-4 text-current");
  };

  const [brokenLogos, setBrokenLogos] = useState<Record<string, boolean>>({});

  const getPartnerLogo = (biz: BusinessItem) => {
    if (biz.logoUrl && !brokenLogos[biz.id]) {
      return (
        <img
          src={biz.logoUrl}
          alt={biz.name}
          className="w-full h-full object-contain"
          onError={() => setBrokenLogos((prev) => ({ ...prev, [biz.id]: true }))}
        />
      );
    }
    // High-contrast typographic vector badge
    switch (biz.slug) {
      case "master-ulala":
        return (
          <div className="flex flex-col items-center justify-center text-center">
            <span className="text-[9px] font-black uppercase text-stone-800 tracking-tighter leading-none">
              Master
            </span>
            <span className="text-base font-black text-[#751020] tracking-tighter uppercase leading-none font-sans">
              Ulala<sup className="text-[8px]">®</sup>
            </span>
          </div>
        );
      case "flora-cafe":
        return (
          <div className="flex flex-col items-center justify-center text-center">
            <Coffee className="w-4 h-4 text-[#751020] mb-0.5" />
            <span className="text-[10px] font-black tracking-widest text-stone-900 uppercase">
              FLORA CAFÉ
            </span>
          </div>
        );
      case "montecarlo-m":
        return (
          <div className="flex flex-col items-center justify-center text-center">
            <span className="text-[8px] font-serif italic text-stone-600 leading-none">
              Montecarlo
            </span>
            <span className="text-xl font-black font-serif text-[#751020] leading-none">
              M&apos;
            </span>
            <span className="text-[7px] uppercase tracking-widest text-stone-700 font-semibold leading-none">
              Pastelería Fina
            </span>
          </div>
        );
      case "orion-arq":
        return (
          <div className="flex flex-col items-center justify-center text-center">
            <div className="w-5 h-5 rounded-full border border-stone-800 flex items-center justify-center mb-0.5">
              <span className="font-bold text-[9px] text-stone-900">Ω</span>
            </div>
            <span className="text-[10px] font-extrabold tracking-widest text-stone-900 leading-none">
              ORION
            </span>
            <span className="text-[6px] uppercase tracking-tighter text-stone-500 font-medium">
              Arquitectura
            </span>
          </div>
        );
      case "g-luxury-salon":
        return (
          <div className="flex flex-col items-center justify-center text-center">
            <span className="text-xl font-serif font-black text-stone-900 leading-none">
              G
            </span>
            <span className="text-[8px] uppercase tracking-widest text-amber-700 font-bold leading-none mt-0.5">
              Luxury Salon
            </span>
          </div>
        );
      case "chopitea-falcon":
        return (
          <div className="flex flex-col items-center justify-center text-center">
            <Scale className="w-3.5 h-3.5 text-stone-900 mb-0.5" />
            <span className="text-[8px] font-serif font-black tracking-wider text-stone-900 uppercase leading-none">
              CHOPITEA FALCÓN
            </span>
            <span className="text-[7px] text-stone-600 font-medium leading-none">
              & ASOCIADOS
            </span>
          </div>
        );
      case "buitron-dent":
        return (
          <div className="flex flex-col items-center justify-center text-center">
            <HeartPulse className="w-3.5 h-3.5 text-rose-700 mb-0.5" />
            <span className="text-sm font-serif italic font-bold text-stone-900 leading-none">
              Buitron{" "}
              <span className="not-italic font-sans text-[11px] font-black text-sky-900">
                Dent
              </span>
            </span>
          </div>
        );
      default:
        return (
          <div className="flex items-center justify-center text-center">
            <span className="text-base font-serif font-black text-[#751020]">
              {biz.name.slice(0, 2).toUpperCase()}
            </span>
          </div>
        );
    }
  };

  const cleanSupport = supportPhone.replace(/[^0-9]/g, "");

  return (
    <div className="min-h-screen bg-rose-pattern text-slate-100 font-sans pb-24 md:pb-8 flex flex-col antialiased w-full max-w-full overflow-x-hidden">
      {/* MAIN HEADER NAVIGATION (Transparencia esmerilada elegante) */}
      <header className="relative border-b border-white/10 bg-black/40 sticky top-0 z-50 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2.5 sm:py-4 flex items-center justify-between gap-1.5 sm:gap-3">
          {/* Official Logo Horizontal & Club Branding */}
          <div
            className="flex items-center space-x-1.5 sm:space-x-3 cursor-pointer flex-shrink-0 group"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            title="Rosa Pasión Club"
          >
            <div className="bg-white/95 hover:bg-white px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl border border-[#D4AF37]/60 shadow-md shadow-black/25 flex items-center transition-all group-hover:scale-[1.02]">
              <img
                src="/logo-horizontal.png"
                alt="Rosa Pasión - Flores y Detalles"
                className="h-6 sm:h-8 md:h-9 w-auto object-contain"
              />
            </div>
            <span className="text-[9px] sm:text-[11px] uppercase tracking-widest text-white font-extrabold bg-[#DC2626] px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-lg border border-red-400/40 shadow-xs">
              Club
            </span>
          </div>

          {/* Action CTAs: Solicitar Membresía + Catálogo */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Solicitar Membresía con rojo claro vibrante */}
            <a
              href="#solicitar-membresia"
              className="flex items-center px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 border border-red-400/40 text-white transition text-xs font-semibold shadow-md shadow-red-600/25 active:scale-95"
              title="Solicitar Membresía"
            >
              <span>Solicitar Membresía</span>
            </a>

            {/* Botón Ver Catálogo */}
            <a
              href="https://rosapasion.com/rosa-pasion-principal"
              target="_blank"
              rel="noopener noreferrer"
              className="relative group overflow-hidden rounded-full p-[1.5px] focus:outline-none focus:ring-2 focus:ring-red-500 cursor-pointer flex-shrink-0 shadow-lg"
              title="Ver Catálogo Principal Rosa Pasión"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-red-500 via-rose-500 to-red-600 rounded-full animate-pulse opacity-90 group-hover:opacity-100 transition"></span>
              <span className="relative block px-3.5 sm:px-5 py-1.5 sm:py-2 rounded-full bg-black/50 backdrop-blur-md transition duration-200 group-hover:bg-black/30">
                <span className="text-xs sm:text-sm font-bold text-white flex items-center space-x-1.5 sm:space-x-2">
                  <BookOpen className="w-3.5 h-3.5 text-red-500" />
                  <span>Catálogo</span>
                  <ExternalLink className="w-3 h-3 text-[#F7EDC4]" />
                </span>
              </span>
            </a>
          </div>
        </div>
      </header>

        {/* MAIN HERO / DIGITAL MEMBERSHIP CARD SECTION */}
        <section className="relative w-full min-w-0 py-16 sm:py-20 lg:py-28 min-h-[560px] lg:min-h-[640px] flex items-center overflow-hidden border-b border-white/10">
          {/* Background Image - clearly visible and showing more of the full photo */}
          <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
            <img
              src="/hero-bg.jpg"
              alt="Rosa Pasión Flores y Detalles"
              className="w-full h-full object-cover object-[center_35%] scale-100"
            />
            {/* Very light uniform tint and soft top/bottom transitions so flowers and background remain fully visible */}
            <div className="absolute inset-0 bg-black/20" />
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60" />
          </div>

          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              {/* Welcome Pitch in frosted container */}
              <div className="lg:col-span-6 text-center lg:text-left space-y-4 p-5 sm:p-7 rounded-3xl bg-black/35 backdrop-blur-md border border-white/10 shadow-2xl max-w-xl mx-auto lg:mx-0">
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold text-white leading-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
                  Más que flores, una comunidad{" "}
                  <span className="gold-gradient-text italic font-serif inline-flex items-center gap-1.5 pr-2">
                    <span>para ti</span>
                    <Heart className="w-6 h-6 sm:w-8 sm:h-8 text-[#E5C058] fill-[#E5C058]/20 stroke-[2] not-italic inline-block" />
                  </span>
                </h1>

                <p className="text-slate-100 text-sm sm:text-base leading-relaxed drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)]">
                  Presenta tu tarjeta física o digital en cualquiera de nuestras marcas aliadas para
                  disfrutar de descuentos y cortesías exclusivas por ser parte de{" "}
                  <strong className="text-[#F7EDC4] font-semibold">Rosa Pasión Club</strong>.
                </p>

                <div className="pt-2 flex flex-wrap gap-3 justify-center lg:justify-start">
                  <a
                    href="#solicitar-membresia"
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 border border-red-400/40 text-white font-bold text-sm shadow-xl shadow-red-600/30 hover:brightness-110 active:scale-95 transition flex items-center space-x-2"
                  >
                    <span>Solicitar Membresía</span>
                  </a>
                  <a
                    href="https://rosapasion.com/rosa-pasion-principal"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-6 py-3 rounded-xl bg-black/40 border border-white/15 text-[#F7EDC4] font-semibold text-sm hover:bg-white/10 hover:text-white transition flex items-center space-x-2 cursor-pointer shadow-md backdrop-blur-md"
                  >
                    <Gift className="w-4 h-4 text-red-500" />
                    <span>Catálogo</span>
                    <ExternalLink className="w-3.5 h-3.5 text-stone-400" />
                  </a>
                </div>
              </div>

              {/* DIGITAL FIDELITY CARD & DNI VERIFICATION */}
              <div className="lg:col-span-6 flex flex-col items-center">
              <div className="w-full max-w-md space-y-3">
                {/* Ingreso simple de DNI / Carnet con fondo translúcido esmerilado */}
                <div className="w-full">
                  <form onSubmit={handleLookupMember} className="relative flex items-center shadow-lg">
                    <Search className="w-4 h-4 text-[#D4AF37] absolute left-3.5 pointer-events-none" />
                    <input
                      type="text"
                      value={docQuery}
                      onChange={(e) => {
                        const val = e.target.value;
                        setDocQuery(val);
                        if (!val.trim()) {
                          setVerifiedMember(null);
                          setLookupMessage(null);
                          setIsLookupError(false);
                        }
                        if (isLookupError) setIsLookupError(false);
                      }}
                      placeholder="Ingresa tu DNI o código de socio..."
                      className="w-full bg-black/40 border border-white/15 rounded-full pl-10 pr-28 py-2.5 text-xs text-white placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 backdrop-blur-md"
                    />
                    <button
                      type="submit"
                      disabled={isCheckingMember}
                      className="absolute right-1 px-4 py-1.5 rounded-full bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white font-bold text-xs uppercase tracking-wider hover:brightness-110 active:scale-95 transition cursor-pointer disabled:opacity-50 shadow-md shadow-red-600/30"
                    >
                      {isCheckingMember ? "..." : "Consultar"}
                    </button>
                  </form>

                  {/* Mensaje sutil solo si el DNI o tarjeta no existe */}
                  {lookupMessage && isLookupError && (
                    <p className="text-[11px] text-red-300 mt-1.5 text-center flex items-center justify-center gap-1 animate-in fade-in">
                      <AlertCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
                      <span>{lookupMessage}</span>
                    </p>
                  )}

                  {/* Mensaje de Pago en Revisión */}
                  {verifiedMember?.hasPendingPayment && (
                    <div className="bg-amber-950/70 border border-amber-400/40 rounded-xl px-3 py-2 mt-2 text-center flex items-center justify-center gap-2 animate-in fade-in">
                      <Clock className="w-3.5 h-3.5 text-amber-300 flex-shrink-0 animate-pulse" />
                      <span className="text-[11px] text-amber-200 font-medium">
                        Tu comprobante de renovación aún está siendo revisado.
                      </span>
                    </div>
                  )}
                </div>

                {/* TARJETA VIRTUAL OFICIAL ROSA PASIÓN CLUB INTERACTIVA (3D TILT, GIRO REVERSO Y QR) */}
                <InteractiveCard
                  member={verifiedMember}
                  onOpenRedeemModal={() => setIsRedeemModalOpen(true)}
                  onOpenRenewalModal={() => setIsRenewalModalOpen(true)}
                />

                {/* BOTÓN REGISTRAR CANJE EN LOCAL (Si está activa) */}
                {verifiedMember && verifiedMember.status === "ACTIVA" && (
                  <div className="space-y-2">
                    <button
                      onClick={() => setIsRedeemModalOpen(true)}
                      className="w-full py-3.5 px-6 rounded-2xl gold-gradient-bg text-[#230408] font-bold text-xs uppercase tracking-wider shadow-xl hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer border border-[#D4AF37]/50"
                    >
                      <Sparkles className="w-4 h-4 text-[#230408]" />
                      <span>Registrar Uso de Promoción en Local</span>
                    </button>

                    {verifiedMember.daysRemaining > 5 && (
                      <div className="text-center pt-1">
                        <button
                          type="button"
                          onClick={() => setIsRenewalModalOpen(true)}
                          className="text-[11px] text-[#EEDC94]/80 hover:text-[#EEDC94] underline cursor-pointer transition"
                        >
                          ¿Deseas extender tu membresía? Renovar con Yape / Plin / Cuentas
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* ALERTA: PAGO EN REVISIÓN */}
                {verifiedMember && verifiedMember.hasPendingPayment && verifiedMember.pendingPayment ? (
                  <div className="bg-gradient-to-br from-[#381E05] via-[#2A1404] to-[#1F0E02] border-2 border-amber-500/70 rounded-2xl p-4 shadow-xl space-y-3 animate-in fade-in">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-amber-500/20 border border-amber-400/60 flex items-center justify-center flex-shrink-0 text-amber-300">
                        <Clock className="w-5 h-5 animate-pulse" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold text-amber-200">
                          Tu pago de renovación aún está en revisión ⏳
                        </h4>
                        <p className="text-xs text-stone-300 mt-1 leading-relaxed">
                          Hemos recibido tu comprobante por{" "}
                          <strong className="text-amber-100">
                            S/ {verifiedMember.pendingPayment.amount.toFixed(2)} ({verifiedMember.pendingPayment.paymentMethod})
                          </strong>
                          . Nuestro equipo está validando el depósito; por favor espera unos minutos mientras se activa.
                        </p>
                      </div>
                    </div>

                    {/* Botón WhatsApp por si olvidó enviar la notificación */}
                    <a
                      href={verifiedMember.pendingPayment.waPendingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg transition flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>¿Olvidaste avisar de tu pago? Contactar por WhatsApp</span>
                    </a>

                    <div className="text-center pt-0.5">
                      <button
                        type="button"
                        onClick={() => setIsRenewalModalOpen(true)}
                        className="text-[11px] text-stone-400 hover:text-white underline cursor-pointer transition"
                      >
                        ¿Deseas enviar otro comprobante de pago? Clic aquí
                      </button>
                    </div>
                  </div>
                ) : (
                  /* ALERTA Y BOTÓN DE RENOVACIÓN DIRECTA CON YAPE / PLIN / TRANSFERENCIA */
                  verifiedMember && (verifiedMember.status !== "ACTIVA" || verifiedMember.daysRemaining <= 5) && (
                    <div className="space-y-2 pt-1 animate-in fade-in">
                      {verifiedMember.status === "VENCIDA" ? (
                        <div className="bg-red-950/80 border border-red-500/50 rounded-2xl p-3 text-center text-xs">
                          <p className="text-red-300 font-bold">Tu membresía ha caducado</p>
                          <p className="text-[11px] text-stone-300 mt-0.5">
                            Renueva fácilmente con Yape, Plin o Transferencia bancaria al instante para seguir usando tus descuentos.
                          </p>
                        </div>
                      ) : (
                        <div className="bg-amber-950/80 border border-amber-500/50 rounded-2xl p-3 text-center text-xs">
                          <p className="text-[#EEDC94] font-bold">
                            Tu membresía vence en {verifiedMember.daysRemaining} {verifiedMember.daysRemaining === 1 ? "día" : "días"}
                          </p>
                          <p className="text-[11px] text-stone-300 mt-0.5">
                            Renueva con anticipación y acumula 30 días adicionales de beneficios exclusivos.
                          </p>
                        </div>
                      )}

                      <button
                        onClick={() => setIsRenewalModalOpen(true)}
                        className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-[#742384] via-[#5A0C18] to-[#9E1B2E] text-white font-bold text-xs uppercase tracking-wider shadow-xl hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer border border-[#D4AF37]/60"
                      >
                        <CreditCard className="w-4 h-4 text-[#EEDC94]" />
                        <span>
                          Renovar con Yape / Plin / Cuentas (S/ {clubSettings?.membershipPrice ? Number(clubSettings.membershipPrice).toFixed(0) : 29})
                        </span>
                      </button>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

        {/* SEARCH & CATEGORY FILTER SECTION (Transparencia esmerilada) */}
        <section id="directorio" className="py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto scroll-mt-20 w-full min-w-0">
          <div className="bg-black/35 border border-white/10 rounded-3xl p-4 sm:p-6 backdrop-blur-md shadow-xl">
            {/* Search Input & Title */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
              <div>
                <h2 className="text-xl sm:text-2xl font-serif font-bold text-white flex items-center space-x-2">
                  <span className="text-red-500">✧</span>
                  <span>Marcas Aliadas & Convenios</span>
                </h2>
                <p className="text-xs text-slate-300 mt-1">
                  Explora los descuentos presentando tu membresía activa
                </p>
              </div>

              {/* Live Search Bar */}
              <div className="relative w-full md:w-80">
                <Search className="w-4 h-4 text-red-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar comercio o beneficio..."
                  className="w-full bg-black/40 border border-white/15 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder-stone-400 focus:outline-none focus:border-red-500 transition"
                />
              </div>
            </div>

            {/* Category Pills (Touch-Friendly Horizontal Scroll 100% Responsive) */}
            <div className="relative w-full min-w-0 overflow-hidden pt-1 pb-1">
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth py-1 px-1 touch-pan-x">
                {/* Botón "Todos" */}
                <button
                  type="button"
                  onClick={() => setSelectedCategorySlug("all")}
                  className={`px-4 py-2 rounded-xl text-xs whitespace-nowrap transition-all flex items-center space-x-1.5 flex-shrink-0 cursor-pointer active:scale-95 shadow-sm ${
                    selectedCategorySlug === "all"
                      ? "bg-gradient-to-r from-red-600 to-red-500 text-white font-bold ring-2 ring-red-400/50 shadow-md shadow-red-600/30"
                      : "bg-black/30 backdrop-blur-sm border border-white/10 text-slate-200 hover:text-white hover:bg-white/10"
                  }`}
                >
                  <Store className="w-3.5 h-3.5 text-current" />
                  <span>Todos</span>
                </button>

                {/* Separador vertical elegante */}
                <div className="h-5 w-[1px] bg-white/15 flex-shrink-0" />

                {/* Categorías únicas y ordenadas */}
                {categories.map((cat) => {
                  const isActive = selectedCategorySlug === cat.slug;
                  return (
                    <button
                      type="button"
                      key={cat.id}
                      onClick={() => setSelectedCategorySlug(cat.slug)}
                      className={`px-3.5 py-2 rounded-xl text-xs whitespace-nowrap transition-all flex items-center space-x-1.5 flex-shrink-0 cursor-pointer active:scale-95 ${
                        isActive
                          ? "bg-gradient-to-r from-red-600 to-red-500 text-white font-bold shadow-md shadow-red-600/30 ring-2 ring-red-400/60"
                          : "bg-black/30 backdrop-blur-sm border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 hover:border-red-400/40"
                      }`}
                    >
                      {getCategoryIcon(cat.iconName)}
                      <span>{cat.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* BUSINESSES DIRECTORY GRID */}
        <section
          ref={directoryRef}
          id="directorio-negocios"
          className="py-4 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex-1 scroll-mt-24 w-full min-w-0"
        >
          {/* Counter & Active Filter Badge */}
          <div className="flex items-center justify-between text-xs text-[#F7EDC4]/90 mb-4 px-1">
            <span>Mostrando {filteredBusinesses.length} marcas aliadas</span>
            <span className="text-slate-400">Convenios 100% verificados</span>
          </div>

          {/* Grid Container */}
          {filteredBusinesses.length > 0 ? (
            <div
              className="space-y-6"
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              {/* Carousel Viewport with Lateral Navigation Buttons */}
              <div className="relative">
                {/* Botón Lateral Izquierdo (Desktop / Tablet) */}
                {totalPages > 1 && (
                  <button
                    type="button"
                    onClick={prevCarouselPage}
                    className="hidden md:flex absolute -left-4 lg:-left-5 top-1/2 -translate-y-1/2 z-30 w-11 h-11 rounded-full bg-black/40 hover:bg-red-600 border border-white/15 hover:border-red-400 text-white items-center justify-center transition-all duration-200 shadow-2xl active:scale-90 cursor-pointer backdrop-blur-md group/btn"
                    title="Ver marcas aliadas anteriores"
                    aria-label="Marcas anteriores"
                  >
                    <ChevronLeft className="w-5 h-5 group-hover/btn:-translate-x-0.5 transition-transform" />
                  </button>
                )}

                {/* Grid 3x1 de Marcas Aliadas */}
                <div
                  className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 transition-all duration-300 ease-out transform ${
                    isFading
                      ? "opacity-0 translate-y-3 scale-[0.99] pointer-events-none"
                      : "opacity-100 translate-y-0 scale-100"
                  }`}
                >
                  {paginatedBusinesses.map((biz) => {
                    const cleanPhone = (biz.whatsappNumber || "51952226282").replace(/[^0-9]/g, "");
                    const waMsg = encodeURIComponent(
                      `¡Hola ${biz.name}! Soy socio de Rosa Pasión Club (Código: RPC-0001) y deseo hacer válido mi beneficio exclusivo.`
                    );
                    const waUrl = `https://wa.me/${cleanPhone}?text=${waMsg}`;

                    return (
                    <div
                      key={biz.id}
                      className="rounded-3xl bg-black/35 backdrop-blur-md border border-white/10 p-5 sm:p-6 flex flex-col justify-between hover:border-red-500/50 hover:shadow-[0_0_25px_rgba(239,68,68,0.2)] transition-all duration-300 shadow-xl group"
                    >
                      <div>
                        <div className="flex items-start gap-3.5 mb-4">
                          {/* DEDICATED PARTNER LOGO BOX */}
                          <div className="partner-logo-box w-20 h-20 bg-white rounded-2xl flex items-center justify-center p-2 flex-shrink-0 group-hover:scale-105 transition-transform overflow-hidden shadow-md border border-white/20">
                            {getPartnerLogo(biz)}
                          </div>

                          {/* Business Titles & Category Tag */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-1.5 text-red-500 text-xs mb-1">
                              {getCategoryIcon(biz.category.name)}
                              <span className="text-[10px] uppercase font-bold tracking-wider text-red-500">
                                {biz.category.name}
                              </span>
                            </div>
                            <h3 className="font-serif font-bold text-white text-base sm:text-lg group-hover:text-[#F7EDC4] transition leading-snug break-words">
                              {biz.name}
                            </h3>
                            <span className="inline-flex items-center mt-1 text-[9px] uppercase tracking-widest text-emerald-400 font-semibold bg-emerald-950/70 px-2 py-0.5 rounded border border-emerald-500/30">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5 animate-pulse"></span>
                              Aliado Oficial
                            </span>
                          </div>
                        </div>

                        {/* Discount Tag Ribbon */}
                        <div className="mb-3.5 py-2.5 px-3.5 rounded-xl bg-black/40 backdrop-blur-sm border-l-4 border-red-500 border border-white/5 flex items-center justify-between shadow-inner">
                          <span className="text-xs sm:text-sm font-extrabold text-white tracking-wide">
                            {biz.discountSummary}
                          </span>
                          <span className="text-[9px] text-white font-bold uppercase tracking-widest bg-red-600 px-2 py-0.5 rounded border border-red-400/40 shadow-xs">
                            Club
                          </span>
                        </div>

                        {/* Short summary of terms */}
                        <p className="text-xs text-slate-300 leading-relaxed mb-4 line-clamp-2">
                          {biz.terms?.[0]?.description ||
                            "Aplica presentando tarjeta física o digital activa en el establecimiento."}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="space-y-2 pt-3 border-t border-white/10">
                        {/* Fila: Ver Términos & Condiciones + Botones Redes Sociales */}
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => setActiveModalBusiness(biz)}
                            className="flex-1 py-2.5 px-3 rounded-xl bg-black/40 hover:bg-white/10 border border-white/10 text-[#F7EDC4] hover:text-white font-semibold text-xs transition flex items-center justify-center space-x-1.5 cursor-pointer truncate shadow-xs"
                            title="Ver Términos & Condiciones"
                          >
                            <FileCheck2 className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                            <span className="truncate">
                              <span className="hidden sm:inline">Ver </span>Términos
                            </span>
                          </button>

                          {/* Facebook */}
                          <a
                            href={
                              biz.facebookUrl?.trim() ||
                              `https://www.facebook.com/search/top?q=${encodeURIComponent(biz.name)}`
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-9 h-9 rounded-xl bg-black/40 hover:bg-[#1877F2]/20 border border-white/10 hover:border-[#1877F2]/60 text-slate-300 hover:text-[#1877F2] flex items-center justify-center transition shadow-xs cursor-pointer flex-shrink-0"
                            title={`Facebook de ${biz.name}`}
                            aria-label="Facebook"
                          >
                            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                            </svg>
                          </a>

                          {/* Instagram */}
                          <a
                            href={
                              biz.instagramUrl?.trim() ||
                              `https://www.instagram.com/explore/tags/${encodeURIComponent(biz.name.replace(/\s+/g, "").toLowerCase())}`
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-9 h-9 rounded-xl bg-black/40 hover:bg-[#E4405F]/20 border border-white/10 hover:border-[#E4405F]/60 text-slate-300 hover:text-[#E4405F] flex items-center justify-center transition shadow-xs cursor-pointer flex-shrink-0"
                            title={`Instagram de ${biz.name}`}
                            aria-label="Instagram"
                          >
                            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                            </svg>
                          </a>

                          {/* TikTok */}
                          <a
                            href={
                              biz.tiktokUrl?.trim() ||
                              `https://www.tiktok.com/search?q=${encodeURIComponent(biz.name)}`
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-9 h-9 rounded-xl bg-black/40 hover:bg-black/80 border border-white/10 hover:border-cyan-400/60 text-slate-300 hover:text-white flex items-center justify-center transition shadow-xs cursor-pointer flex-shrink-0 group/tt"
                            title={`TikTok de ${biz.name}`}
                            aria-label="TikTok"
                          >
                            <svg className="w-3.5 h-3.5 fill-current group-hover/tt:text-cyan-400 transition" viewBox="0 0 24 24">
                              <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.24 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
                            </svg>
                          </a>
                        </div>

                        <a
                          href={waUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white font-bold text-xs uppercase tracking-wider hover:brightness-110 active:scale-98 transition flex items-center justify-center space-x-2 shadow-md shadow-red-600/30"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          <span>Contactar Comercio</span>
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>

                {/* Botón Lateral Derecho (Desktop / Tablet) */}
                {totalPages > 1 && (
                  <button
                    type="button"
                    onClick={nextCarouselPage}
                    className="hidden md:flex absolute -right-4 lg:-right-5 top-1/2 -translate-y-1/2 z-30 w-11 h-11 rounded-full bg-black/40 hover:bg-red-600 border border-white/15 hover:border-red-400 text-white items-center justify-center transition-all duration-200 shadow-2xl active:scale-90 cursor-pointer backdrop-blur-md group/btn"
                    title="Ver siguientes marcas aliadas"
                    aria-label="Siguientes marcas"
                  >
                    <ChevronRight className="w-5 h-5 group-hover/btn:translate-x-0.5 transition-transform" />
                  </button>
                )}
              </div>

              {/* Interactive Carousel & Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-black/35 backdrop-blur-md border border-white/10 text-xs shadow-lg">
                  {/* Status & Counter */}
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-slate-300">
                      Mostrando <strong className="text-white">{(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, totalItems)}</strong> de <strong className="text-white">{totalItems}</strong> marcas aliadas
                    </span>
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-medium border transition-colors ${
                        isHovered
                          ? "bg-amber-950/60 border-amber-500/40 text-amber-300"
                          : "bg-red-950/50 border-red-500/40 text-red-400"
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${isHovered ? "bg-amber-400" : "bg-red-500 animate-pulse"}`} />
                      {isHovered ? "⏸ Pausado para lectura" : "● Rotación automática (10s)"}
                    </span>
                  </div>

                  {/* Interactive Controls & Dots */}
                  <div className="flex items-center gap-2.5">
                    {/* Botón Anterior */}
                    <button
                      type="button"
                      onClick={prevCarouselPage}
                      className="p-2 rounded-xl bg-black/40 hover:bg-red-600 border border-white/10 text-white transition shadow-sm cursor-pointer flex items-center justify-center active:scale-95"
                      title="Grupo anterior"
                      aria-label="Grupo anterior"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>

                    {/* Dots / Barras de progreso interactivas */}
                    <div className="flex items-center gap-2 px-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
                        const isActive = currentPage === p;
                        return (
                          <button
                            key={p}
                            type="button"
                            onClick={() => goToPage(p)}
                            className={`transition-all duration-300 cursor-pointer rounded-full ${
                              isActive
                                ? "w-8 h-2.5 bg-gradient-to-r from-red-600 to-red-500 shadow-[0_0_10px_rgba(239,68,68,0.6)]"
                                : "w-2.5 h-2.5 bg-white/20 hover:bg-white/50"
                            }`}
                            title={`Ir al grupo ${p}`}
                            aria-label={`Ir al grupo ${p}`}
                          />
                        );
                      })}
                    </div>

                    {/* Botón Siguiente */}
                    <button
                      type="button"
                      onClick={nextCarouselPage}
                      className="p-2 rounded-xl bg-black/40 hover:bg-red-600 border border-white/10 text-white transition shadow-sm cursor-pointer flex items-center justify-center active:scale-95"
                      title="Siguiente grupo"
                      aria-label="Siguiente grupo"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : businesses.length === 0 ? (
            <div className="text-center py-16 bg-[#0D0D0D]/70 rounded-3xl border border-[#8C0303]/40 p-8 my-6 backdrop-blur-sm">
              <div className="w-16 h-16 rounded-full bg-[#8C0303]/20 border border-[#F20519]/40 flex items-center justify-center mx-auto mb-4 text-[#F20519] text-2xl shadow-lg">
                <Store className="w-8 h-8" />
              </div>
              <h3 className="text-lg sm:text-xl font-serif font-bold text-white">Próximamente Marcas Aliadas & Convenios</h3>
              <p className="text-xs sm:text-sm text-stone-300 mt-2 max-w-md mx-auto leading-relaxed">
                Estamos gestionando convenios oficiales con promociones exclusivas para los socios de Rosa Pasión Club.
              </p>
            </div>
          ) : (
            <div className="text-center py-16 bg-[#0D0D0D]/70 rounded-3xl border border-[#8C0303]/40 p-8 my-6">
              <div className="w-16 h-16 rounded-full bg-[#8C0303]/30 flex items-center justify-center mx-auto mb-4 text-[#F20519] text-2xl">
                <Store className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-serif font-bold text-white">No encontramos coincidencias</h3>
              <p className="text-xs text-slate-300 mt-1 max-w-md mx-auto">
                Prueba buscando otro término o selecciona &quot;Todos&quot;.
              </p>
              <button
                onClick={() => {
                  setSelectedCategorySlug("all");
                  setSearchQuery("");
                }}
                className="mt-4 px-4 py-2 bg-gradient-to-r from-[#8C0303] to-[#F20519] text-white rounded-xl text-xs font-bold hover:brightness-110 cursor-pointer shadow-md"
              >
                Restablecer Filtros
              </button>
            </div>
          )}
        </section>

        {/* SECCIÓN: REDES SOCIALES OFICIALES & PUBLICACIONES RECIENTES */}
        <SocialFeedSection
          posts={socialPosts || []}
          facebookUrl={facebookUrl}
          instagramUrl={instagramUrl}
          tiktokUrl={tiktokUrl}
        />

        {/* SECCIÓN: SOLICITAR SER SOCIO DE ROSA PASIÓN CLUB (Envío directo a WhatsApp) */}
        <MembershipRequestSection supportPhone={supportPhone} />

        {/* BANNER: HOW TO USE THE MEMBERSHIP (Paso a paso con transparencia esmerilada) */}
        <section className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="rounded-3xl bg-black/35 backdrop-blur-md border border-white/10 p-6 sm:p-8 shadow-xl">
            <div className="text-center max-w-2xl mx-auto mb-8">
              <span className="text-red-500 text-xs font-bold uppercase tracking-widest">
                Paso a Paso
              </span>
              <h2 className="text-2xl font-serif font-bold text-white mt-1">
                ¿Cómo canjear tus beneficios?
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <div className="bg-black/30 backdrop-blur-sm p-5 rounded-2xl border border-white/10 shadow-sm">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-red-600 to-red-500 text-white font-bold flex items-center justify-center mx-auto mb-3 text-lg shadow-md shadow-red-600/30">
                  1
                </div>
                <h4 className="font-serif font-bold text-[#F7EDC4] mb-1">Elige el Negocio</h4>
                <p className="text-xs text-slate-300">
                  Explora nuestro directorio y consulta las promociones y términos activos.
                </p>
              </div>

              <div className="bg-black/30 backdrop-blur-sm p-5 rounded-2xl border border-white/10 shadow-sm">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-red-600 to-red-500 text-white font-bold flex items-center justify-center mx-auto mb-3 text-lg shadow-md shadow-red-600/30">
                  2
                </div>
                <h4 className="font-serif font-bold text-[#F7EDC4] mb-1">Presenta tu Tarjeta</h4>
                <p className="text-xs text-slate-300">
                  Muestra tu tarjeta física o esta pantalla con tu código de socio al momento del pedido.
                </p>
              </div>

              <div className="bg-black/30 backdrop-blur-sm p-5 rounded-2xl border border-white/10 shadow-sm">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-red-600 to-red-500 text-white font-bold flex items-center justify-center mx-auto mb-3 text-lg shadow-md shadow-red-600/30">
                  3
                </div>
                <h4 className="font-serif font-bold text-[#F7EDC4] mb-1">Disfruta tu Descuento</h4>
                <p className="text-xs text-slate-300">
                  El descuento especial de Rosa Pasión Club se aplicará en tu cuenta final.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* FOOTER (Transparencia esmerilada) */}
        <footer className="mt-auto border-t border-white/10 bg-black/40 backdrop-blur-md text-slate-400 text-xs py-8 px-4 sm:px-6">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
            <div className="flex items-center space-x-3">
              <div className="bg-white/95 px-2.5 py-1 rounded-lg border border-[#D4AF37]/40 shadow-xs flex items-center">
                <img
                  src="/logo-horizontal.png"
                  alt="Rosa Pasión"
                  className="h-5 sm:h-6 w-auto object-contain"
                />
              </div>
              <span className="text-slate-500">|</span>
              <span className="text-[11px] text-white font-semibold">Club de Beneficios Exclusivos</span>
            </div>
            <div className="text-[11px] text-slate-400">
              © 2026 Rosa Pasión. Todos los derechos reservados. Tarjetas personales e intransferibles.
            </div>

            {/* Redes Sociales Oficiales en Footer */}
            <div className="flex items-center gap-2">
              <SocialButtons
                facebookUrl={facebookUrl}
                instagramUrl={instagramUrl}
                tiktokUrl={tiktokUrl}
                size="sm"
              />
            </div>

            <div className="flex items-center space-x-4 text-[#F7EDC4]">
              <a
                href={`https://wa.me/${cleanSupport}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition"
              >
                <Phone className="w-4 h-4 text-emerald-400 inline" />
              </a>
              <a
                href="https://rosapasion.com/rosa-pasion-principal"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition font-semibold cursor-pointer flex items-center gap-1"
              >
                <span>Catálogo</span>
                <ExternalLink className="w-3 h-3 text-red-500" />
              </a>
            </div>
          </div>
        </footer>

      {/* FIXED BOTTOM NAVIGATION BAR (Mobile Optimized con transparencia esmerilada) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-black/50 backdrop-blur-md border-t border-white/10 px-4 py-2 z-40 flex items-center justify-around shadow-2xl">
        <a
          href="#directorio"
          className="flex flex-col items-center text-[#F7EDC4] active:text-white"
        >
          <Tag className="w-4 h-4 text-red-500" />
          <span className="text-[10px] font-semibold mt-0.5">Beneficios</span>
        </a>
        <a
          href="#solicitar-membresia"
          className="flex flex-col items-center text-stone-300 active:text-white"
        >
          <Crown className="w-4 h-4 text-[#F7EDC4]" />
          <span className="text-[10px] font-semibold mt-0.5">Ser Socio</span>
        </a>
        <a
          href="https://rosapasion.com/rosa-pasion-principal"
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center text-slate-300 hover:text-white cursor-pointer"
        >
          <div className="w-9 h-9 -mt-4 rounded-full bg-gradient-to-r from-red-600 to-red-500 text-white flex items-center justify-center shadow-lg border-2 border-black/80 shadow-red-600/30">
            <BookOpen className="w-3.5 h-3.5" />
          </div>
          <span className="text-[10px] font-bold text-white mt-0.5">Catálogo</span>
        </a>
        <a
          href={`https://wa.me/${cleanSupport}?text=Hola,%20solicito%20asistencia%20de%20mi%20tarjeta%20Rosa%20Pasión%20Club`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center text-slate-300 hover:text-emerald-400"
        >
          <Phone className="w-4 h-4 text-emerald-400" />
          <span className="text-[10px] font-semibold mt-0.5">Soporte</span>
        </a>
      </div>

      {/* MODAL: TERMS & CONDITIONS */}
      {activeModalBusiness && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="fixed inset-0" onClick={() => setActiveModalBusiness(null)} />
          <div className="relative w-full sm:max-w-lg bg-[#151214]/95 backdrop-blur-xl border border-white/15 rounded-t-3xl sm:rounded-3xl shadow-2xl p-6 sm:p-7 max-h-[85vh] overflow-y-auto z-10 animate-in slide-in-from-bottom duration-200">
            {/* Modal Header with Dedicated Logo Slot */}
            <div className="flex items-start justify-between border-b border-white/10 pb-4">
              <div className="flex items-center space-x-3.5">
                <div className="partner-logo-box w-16 h-16 rounded-2xl flex items-center justify-center p-1.5 flex-shrink-0 overflow-hidden bg-black/40 border border-white/10">
                  {getPartnerLogo(activeModalBusiness)}
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-serif font-bold text-white">
                    {activeModalBusiness.name}
                  </h3>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-red-300 bg-red-950/60 px-2 py-0.5 rounded border border-red-500/30">
                    {activeModalBusiness.category.name}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setActiveModalBusiness(null)}
                className="w-8 h-8 rounded-full bg-black/40 border border-white/15 text-slate-300 flex items-center justify-center hover:bg-red-600 hover:text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Benefit Highlight Box */}
            <div className="my-4 p-4 rounded-2xl bg-black/40 border border-red-500/30 flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-red-600 to-red-500 text-white flex items-center justify-center font-bold text-base flex-shrink-0 shadow-lg shadow-red-600/30">
                %
              </div>
              <div>
                <span className="text-[10px] uppercase text-red-400 font-bold tracking-widest block">
                  Beneficio exclusivo Club
                </span>
                <p className="text-sm font-bold text-white">
                  {activeModalBusiness.discountSummary}
                </p>
              </div>
            </div>

            {/* Conditions List */}
            <div className="space-y-3 my-4">
              <h4 className="text-xs uppercase tracking-wider font-semibold text-red-400 flex items-center space-x-1.5">
                <FileCheck2 className="w-4 h-4 text-red-400" />
                <span>Términos y Reglas de Uso</span>
              </h4>
              <ul className="space-y-2.5 text-xs text-slate-200">
                {activeModalBusiness.terms && activeModalBusiness.terms.length > 0 ? (
                  activeModalBusiness.terms.map((term) => (
                    <li key={term.id} className="flex items-start space-x-2.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-red-400 mt-0.5 flex-shrink-0" />
                      <span className="leading-relaxed">{term.description}</span>
                    </li>
                  ))
                ) : (
                  <li className="flex items-start space-x-2.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-red-400 mt-0.5 flex-shrink-0" />
                    <span className="leading-relaxed">
                      Presentar tarjeta de socio física o digital vigente antes de solicitar la cuenta.
                    </span>
                  </li>
                )}
              </ul>
            </div>

            {/* Action Footer */}
            <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row gap-3">
              <a
                href={`https://wa.me/${(activeModalBusiness.whatsappNumber || "51952226282").replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
                  `Hola ${activeModalBusiness.name}, tengo mi membresía de Rosa Pasión Club (Socio RPC-0001) y deseo consultar por el beneficio de "${activeModalBusiness.discountSummary}".`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center space-x-2 shadow-lg shadow-red-600/30 hover:brightness-110 active:scale-95 transition"
              >
                <Phone className="w-3.5 h-3.5 text-white" />
                <span>Contactar / Canjear</span>
              </a>
              <button
                onClick={() => setActiveModalBusiness(null)}
                className="py-3 px-4 rounded-xl bg-black/40 border border-white/15 text-slate-300 font-semibold text-xs hover:bg-white/10 transition cursor-pointer"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: OFFICIAL CATALOG REDIRECTION */}
      {isCatalogModalOpen && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0" />
          <div className="relative w-full max-w-md bg-gradient-to-b from-[#3D0710] to-[#230408] border-2 border-[#D4AF37]/50 rounded-3xl p-6 sm:p-8 text-center shadow-2xl z-10 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Vertical Logo */}
            <div className="w-24 sm:w-28 p-2.5 rounded-2xl bg-white mx-auto mb-4 shadow-xl border border-[#D4AF37]/50 flex items-center justify-center">
              <img
                src="/logo-vertical.png"
                alt="Catálogo Rosa Pasión"
                className="w-full h-auto object-contain"
              />
            </div>
            <h3 className="font-serif text-xl font-bold text-white">Catálogo Rosa Pasión</h3>
            <p className="text-xs text-slate-300 mt-2 leading-relaxed">
              Estás a punto de ingresar al catálogo oficial de ramos, arreglos florales y detalles
              exclusivos de <span className="text-[#EEDC94] font-semibold">Rosa Pasión</span>.
            </p>

            <div className="my-6 p-3 rounded-xl bg-black/30 border border-[#D4AF37]/25 text-left text-xs space-y-1.5">
              <div className="flex items-center space-x-2 text-[#EEDC94]">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Catálogo actualizado de temporada</span>
              </div>
              <div className="flex items-center space-x-2 text-[#EEDC94]">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Atención y pedidos por WhatsApp</span>
              </div>
              <div className="flex items-center space-x-2 text-[#EEDC94]">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Delivery a toda la ciudad</span>
              </div>
            </div>

            <div className="flex flex-col gap-2.5">
              <a
                href={
                  catalogUrl ||
                  `https://wa.me/${cleanSupport}?text=Hola%20Rosa%20Pasión,%20quiero%20ver%20su%20catálogo%20actualizado`
                }
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setIsCatalogModalOpen(false)}
                className="py-3 px-6 rounded-xl gold-gradient-bg text-[#230408] font-bold text-xs uppercase tracking-wider hover:brightness-110 active:scale-95 transition flex items-center justify-center space-x-2"
              >
                <span>Abrir Catálogo Ahora</span>
                <ExternalLink className="w-3.5 h-3.5 text-[#230408]" />
              </a>
              <button
                onClick={() => setIsCatalogModalOpen(false)}
                className="py-2.5 text-xs text-[#EEDC94] hover:text-white transition cursor-pointer"
              >
                Regresar a los Beneficios
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: REGISTRO DE USO EN LOCAL ALIADO */}
      {verifiedMember && (
        <RedemptionModal
          isOpen={isRedeemModalOpen}
          onClose={() => setIsRedeemModalOpen(false)}
          member={verifiedMember}
          businesses={businesses}
        />
      )}

      {/* MODAL: RENOVACIÓN MANUAL YAPE / PLIN / TRANSFERENCIA DIRECTO */}
      <RenewalPaymentModal
        isOpen={isRenewalModalOpen}
        onClose={() => setIsRenewalModalOpen(false)}
        onSuccess={() => {
          setDocQuery("");
          setVerifiedMember(null);
          setLookupMessage(null);
          setIsLookupError(false);
        }}
        initialMember={verifiedMember}
        yapePhone={clubSettings?.yapePhone || "952 226 282"}
        yapeName={clubSettings?.yapeName || "Rosa Pasión Flores y Detalles"}
        yapeQrUrl={clubSettings?.yapeQrUrl || "/yape-qr.png"}
        plinPhone={clubSettings?.plinPhone || "952 226 282"}
        plinQrUrl={clubSettings?.plinQrUrl || "/plin-qr.png"}
        bcpAccount={clubSettings?.bcpAccount}
        bcpCci={clubSettings?.bcpCci}
        interbankAccount={clubSettings?.interbankAccount}
        interbankCci={clubSettings?.interbankCci}
        bbvaAccount={clubSettings?.bbvaAccount}
        bbvaCci={clubSettings?.bbvaCci}
        bankBeneficiary={clubSettings?.bankBeneficiary}
        bankAccounts={clubSettings?.bankAccounts}
        membershipPrice={clubSettings?.membershipPrice ? Number(clubSettings.membershipPrice) : 29.0}
      />
    </div>
  );
}
