"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import Link from "next/link";
import {
  Sparkles,
  Coffee,
  HeartPulse,
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
  UserCheck,
  AlertCircle,
  Check,
  Clock,
} from "lucide-react";
import { lookupMemberByDocOrCode } from "@/actions/redemption";
import { RedemptionModal } from "./redemption-modal";
import { MembershipRequestSection } from "./membership-request-section";
import { RenewalPaymentModal } from "./renewal-payment-modal";

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
  whatsappNumber: string;
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
  catalogUrl: string;
  supportPhone: string;
  clubSettings?: any;
}

export function PortalView({
  categories,
  businesses,
  catalogUrl,
  supportPhone,
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
    name: string;
    documentType: string;
    documentNumber: string | null;
    phone?: string | null;
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

  // Pagination (6 comercios por página)
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 6;
  const directoryRef = useRef<HTMLElement>(null);

  // Reiniciar página a 1 cada vez que se filtre por categoría o búsqueda
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategorySlug, searchQuery]);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    if (directoryRef.current) {
      const yOffset = -90; // compensar altura de la barra superior fija
      const y = directoryRef.current.getBoundingClientRect().top + window.scrollY + yOffset;
      window.scrollTo({ top: Math.max(0, y), behavior: "smooth" });
    }
  };

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
  const paginatedBusinesses = filteredBusinesses.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const getCategoryIcon = (iconName: string) => {
    switch (iconName.toLowerCase()) {
      case "coffee":
        return <Coffee className="w-4 h-4 text-current" />;
      case "heartpulse":
      case "odontologia":
        return <HeartPulse className="w-4 h-4 text-current" />;
      case "car":
      case "lavado":
        return <Car className="w-4 h-4 text-current" />;
      case "cake":
      case "pasteleria":
        return <Cake className="w-4 h-4 text-current" />;
      case "building2":
      case "building":
      case "arquitectura":
        return <Building2 className="w-4 h-4 text-current" />;
      case "scale":
      case "legal":
        return <Scale className="w-4 h-4 text-current" />;
      case "sparkles":
      default:
        return <Sparkles className="w-4 h-4 text-current" />;
    }
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
    <div className="min-h-screen bg-rose-pattern text-slate-100 font-sans pb-24 md:pb-8 flex flex-col antialiased">
      {/* MAIN HEADER NAVIGATION */}
      <header className="relative border-b border-[#D4AF37]/25 bg-gradient-to-r from-[#230408] via-[#3D0710] to-[#230408] sticky top-0 z-50 backdrop-blur-md">
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
            <span className="text-[9px] sm:text-[11px] uppercase tracking-widest text-[#EEDC94] font-extrabold bg-[#5A0C18]/90 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-lg border border-[#D4AF37]/50 shadow-xs">
              Club
            </span>
          </div>

          {/* Action CTAs: Costado izquierdo de Ver Catálogo (Teléfono + Ingresar al Sistema + Solicitar Membresía) + Botón Ver Catálogo */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Solicitar Membresía */}
            <a
              href="#solicitar-membresia"
              className="hidden lg:flex items-center space-x-1.5 px-3 py-1.5 sm:py-2 rounded-full bg-[#5A0C18]/90 border border-[#D4AF37]/50 text-[#F7EDC4] hover:brightness-125 transition text-xs font-semibold shadow-xs"
              title="Solicitar Membresía"
            >
              <Crown className="w-3.5 h-3.5 text-[#EEDC94] flex-shrink-0" />
              <span>Solicitar Membresía</span>
            </a>

            {/* Teléfono WhatsApp de Soporte */}
            <a
              href={`https://wa.me/${cleanSupport}?text=Hola%20Rosa%20Pasión,%20tengo%20una%20consulta%20sobre%20mi%20membresía%20Rosa%20Pasión%20Club`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-1.5 px-3 py-1.5 sm:py-2 rounded-full bg-black/40 border border-emerald-500/30 text-stone-200 hover:text-white hover:border-emerald-400 transition text-xs shadow-xs"
              title="Atención WhatsApp: 952 226 282"
            >
              <Phone className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
              <span className="hidden sm:inline font-semibold tracking-wide">952 226 282</span>
            </a>

            {/* Ingresar al Sistema (Acceso Admin / Login) */}
            <Link
              href="/login"
              className="flex items-center space-x-1.5 px-3 py-1.5 sm:py-2 rounded-full bg-[#3D0710]/90 border border-[#D4AF37]/40 text-[#EEDC94] hover:text-white hover:border-[#D4AF37] transition text-xs font-semibold shadow-xs"
              title="Ingresar al Sistema"
            >
              <UserCheck className="w-3.5 h-3.5 text-[#D4AF37] flex-shrink-0" />
              <span className="hidden md:inline">Ingresar al Sistema</span>
              <span className="md:hidden">Ingresar</span>
            </Link>

            {/* Botón Ver Catálogo */}
            <button
              onClick={() => setIsCatalogModalOpen(true)}
              className="relative group overflow-hidden rounded-full p-[1px] focus:outline-none focus:ring-2 focus:ring-[#D4AF37] cursor-pointer flex-shrink-0"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-[#EEDC94] via-[#D4AF37] to-amber-600 rounded-full animate-pulse opacity-75 group-hover:opacity-100 transition"></span>
              <span className="relative block px-3.5 sm:px-5 py-1.5 sm:py-2 rounded-full bg-[#230408] transition duration-200 group-hover:bg-[#3D0710]">
                <span className="text-xs sm:text-sm font-semibold text-[#F7EDC4] flex items-center space-x-1.5 sm:space-x-2">
                  <BookOpen className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span className="hidden xs:inline">Ver Catálogo</span>
                  <span className="xs:hidden">Catálogo</span>
                  <ExternalLink className="w-3 h-3 text-[#EEDC94]" />
                </span>
              </span>
            </button>
          </div>
        </div>
      </header>

        {/* MAIN HERO / DIGITAL MEMBERSHIP CARD SECTION */}
        <section className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Welcome Pitch */}
            <div className="lg:col-span-6 text-center lg:text-left space-y-4">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#3D0710]/80 border border-[#D4AF37]/40 text-[#EEDC94] text-xs tracking-wider uppercase">
                <Crown className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>Comunidad Exclusiva • Beneficios 2026</span>
              </div>

              <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold text-white leading-tight">
                Más que flores, una comunidad{" "}
                <span className="gold-gradient-text italic font-serif block sm:inline">
                  para ti ♡
                </span>
              </h1>

              <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-xl mx-auto lg:mx-0">
                Presenta tu tarjeta física o digital en cualquiera de nuestras marcas aliadas para
                disfrutar de descuentos y cortesías exclusivas por ser parte de{" "}
                <strong className="text-[#F7EDC4] font-semibold">Rosa Pasión Club</strong>.
              </p>

              <div className="pt-2 flex flex-wrap gap-3 justify-center lg:justify-start">
                <a
                  href="#directorio"
                  className="px-5 py-3 rounded-xl gold-gradient-bg text-[#230408] font-bold text-sm shadow-lg hover:brightness-110 active:scale-95 transition flex items-center space-x-2"
                >
                  <Tag className="w-4 h-4 text-[#230408]" />
                  <span>Explorar Descuentos</span>
                </a>
                <a
                  href="#solicitar-membresia"
                  className="px-5 py-3 rounded-xl bg-[#5A0C18] border border-[#D4AF37]/50 text-[#F7EDC4] font-bold text-sm shadow-lg hover:bg-[#7D0C1B] transition flex items-center space-x-2"
                >
                  <Crown className="w-4 h-4 text-[#EEDC94]" />
                  <span>Solicitar Membresía</span>
                </a>
                <button
                  onClick={() => setIsCatalogModalOpen(true)}
                  className="px-5 py-3 rounded-xl bg-[#3D0710]/80 border border-[#D4AF37]/40 text-[#F7EDC4] font-semibold text-sm hover:bg-[#5A0C18] transition flex items-center space-x-2 cursor-pointer"
                >
                  <Gift className="w-4 h-4 text-[#D4AF37]" />
                  <span>Catálogo</span>
                </button>
              </div>
            </div>

            {/* DIGITAL FIDELITY CARD & DNI VERIFICATION */}
            <div className="lg:col-span-6 flex flex-col items-center">
              <div className="w-full max-w-md space-y-3">
                {/* Ingreso simple de DNI / Carnet (Mobile-First) */}
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
                      placeholder="Ingresa tu DNI o Carnet de Extranjería..."
                      className="w-full bg-[#230408]/90 border border-[#D4AF37]/50 rounded-full pl-10 pr-28 py-2.5 text-xs text-white placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-[#D4AF37] focus:border-[#D4AF37] backdrop-blur-md"
                    />
                    <button
                      type="submit"
                      disabled={isCheckingMember}
                      className="absolute right-1 px-4 py-1.5 rounded-full gold-gradient-bg text-[#230408] font-bold text-xs uppercase tracking-wider hover:brightness-110 active:scale-95 transition cursor-pointer disabled:opacity-50"
                    >
                      {isCheckingMember ? "..." : "Ingresar"}
                    </button>
                  </form>

                  {/* Mensaje sutil solo si el DNI no existe */}
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

                {/* TARJETA VIRTUAL (Proporción exacta y diseño de tarjeta física real ISO 7810 ID-1) */}
                <div className="relative w-full aspect-[1.586/1] rounded-2xl sm:rounded-[24px] p-4 sm:p-5 border-2 border-[#D4AF37]/70 bg-gradient-to-br from-[#800C1B] via-[#4A0610] to-[#200307] card-luxury-shadow text-white overflow-hidden transition-all duration-300 transform hover:-translate-y-1 hover:shadow-[0_20px_45px_rgba(0,0,0,0.65)] flex flex-col justify-between select-none shadow-2xl">
                  {/* Sheen & Watermark Accents */}
                  <div className="absolute -top-24 -right-24 w-60 h-60 bg-gradient-to-br from-white/10 via-[#D4AF37]/15 to-transparent rounded-full blur-2xl pointer-events-none"></div>
                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.04] to-transparent pointer-events-none"></div>
                  <div className="absolute -right-8 -bottom-10 w-44 h-44 opacity-10 pointer-events-none">
                    <svg viewBox="0 0 200 200" fill="#D4AF37">
                      <path d="M100 0 C120 40 180 50 180 100 C180 160 120 180 100 200 C80 180 20 160 20 100 C20 50 80 40 100 0 Z" />
                    </svg>
                  </div>

                  {/* 1. FILA SUPERIOR: Logo Oficial Horizontal y Estado + Contactless */}
                  <div className="flex items-center justify-between relative z-10">
                    <div className="flex items-center space-x-2 sm:space-x-2.5">
                      <div className="bg-white/95 px-2.5 py-1 rounded-lg border border-[#D4AF37]/60 shadow-xs flex items-center">
                        <img
                          src="/logo-horizontal.png"
                          alt="Rosa Pasión"
                          className="h-5 sm:h-6 w-auto object-contain"
                        />
                      </div>
                      <span className="text-[8px] sm:text-[9px] uppercase tracking-widest text-[#F7EDC4] font-bold bg-[#5A0C18]/90 px-1.5 py-0.5 rounded border border-[#D4AF37]/40 shadow-xs">
                        Socio Club
                      </span>
                    </div>

                    {/* Símbolo Contactless y Badge de Estado */}
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <svg
                        className="w-4 h-4 sm:w-5 sm:h-5 text-[#EEDC94]/75"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        aria-label="Contactless"
                      >
                        <path d="M8.5 7.5a6 6 0 0 1 0 9" />
                        <path d="M12 4.5a10 10 0 0 1 0 15" />
                        <path d="M15.5 1.5a14 14 0 0 1 0 21" />
                      </svg>

                      {verifiedMember ? (
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold tracking-wider ${
                            verifiedMember.hasPendingPayment
                              ? "bg-amber-950/90 text-amber-300 border border-amber-500/50 shadow-[0_0_8px_rgba(245,158,11,0.3)]"
                              : verifiedMember.status === "ACTIVA"
                              ? "bg-emerald-950/90 text-emerald-400 border border-emerald-500/50 shadow-[0_0_8px_rgba(16,185,129,0.3)]"
                              : verifiedMember.status === "VENCIDA"
                              ? "bg-red-950/90 text-red-400 border border-red-500/50"
                              : "bg-amber-950/90 text-amber-400 border border-amber-500/50"
                          }`}
                        >
                          {verifiedMember.hasPendingPayment ? (
                            <>
                              <Clock className="w-2.5 h-2.5 mr-1 text-amber-300 animate-pulse" />
                              PAGO EN REVISIÓN
                            </>
                          ) : (
                            <>
                              {verifiedMember.status === "ACTIVA" && (
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1 animate-pulse"></span>
                              )}
                              {verifiedMember.status}
                            </>
                          )}
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-medium tracking-wider bg-white/5 text-stone-400 border border-white/10">
                          CONSULTAR DNI
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 2. FILA MEDIA: Chip EMV Metálico Dorado y Código Embosado del Club */}
                  <div className="flex items-center justify-between gap-3 relative z-10 my-auto py-1">
                    {/* Chip Inteligente EMV (como tarjeta de crédito real) */}
                    <div className="w-10 h-7 sm:w-11 sm:h-8 rounded-md bg-gradient-to-br from-amber-200 via-amber-400 to-amber-600 p-[1.5px] shadow-md border border-amber-300/70 flex-shrink-0">
                      <div className="w-full h-full rounded-[3.5px] border border-amber-900/40 grid grid-cols-2 grid-rows-2 relative overflow-hidden bg-gradient-to-br from-amber-300 to-amber-500">
                        <div className="border-r border-b border-amber-900/35"></div>
                        <div className="border-b border-amber-900/35"></div>
                        <div className="border-r border-amber-900/35"></div>
                        <div></div>
                        <div className="absolute inset-x-2 inset-y-1 rounded-sm border border-amber-950/40 bg-amber-200/60 shadow-inner"></div>
                      </div>
                    </div>

                    {/* Título de Club y Código de Tarjeta con efecto troquelado */}
                    <div className="text-right">
                      <div className="flex items-center justify-end gap-1 mb-0.5">
                        <span className="font-serif text-xs sm:text-sm font-extrabold tracking-widest gold-gradient-text uppercase drop-shadow-sm">
                          ROSA PASIÓN CLUB
                        </span>
                        <span className="text-[#D4AF37] text-[9px]">❤</span>
                      </div>
                      <p className="font-mono text-sm sm:text-base font-bold tracking-[0.22em] text-[#F7EDC4] drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
                        {verifiedMember ? verifiedMember.code : "RPC • • • •"}
                      </p>
                    </div>
                  </div>

                  {/* 3. FILA INFERIOR: Información del Titular y Fechas de Vigencia */}
                  <div className="pt-2 border-t border-[#D4AF37]/25 flex items-end justify-between gap-2 relative z-10">
                    <div className="min-w-0 flex-1">
                      <p className="text-[7.5px] sm:text-[8.5px] uppercase tracking-wider text-[#D4AF37]/90 font-semibold leading-tight">
                        MIEMBRO TITULAR
                      </p>
                      <p className={`font-bold tracking-wide uppercase truncate drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] ${
                        verifiedMember
                          ? `${verifiedMember.name.length > 22 ? "text-[11px] sm:text-xs" : "text-xs sm:text-sm"} text-white`
                          : "text-stone-500 font-mono tracking-widest text-xs"
                      }`}>
                        {verifiedMember ? verifiedMember.name : "•••••••• ••••••••"}
                      </p>
                      <p className="text-[9px] sm:text-[10px] font-mono text-stone-400 tracking-wider">
                        {verifiedMember && verifiedMember.documentNumber
                          ? `${verifiedMember.documentType || "DNI"}: ${verifiedMember.documentNumber}`
                          : "DNI: --------"}
                      </p>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <p className="text-[7.5px] sm:text-[8.5px] uppercase tracking-wider text-[#D4AF37]/90 font-semibold leading-tight">
                        VIGENCIA
                      </p>
                      <p className="font-mono text-[10px] sm:text-xs text-stone-300 font-semibold tracking-wider">
                        {verifiedMember ? (
                          `${new Date(verifiedMember.validFrom).toLocaleDateString("es-PE", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "2-digit",
                          })} – ${new Date(verifiedMember.validUntil).toLocaleDateString("es-PE", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "2-digit",
                          })}`
                        ) : (
                          "--/--/-- – --/--/--"
                        )}
                      </p>
                      <p className="text-[7.5px] sm:text-[8.5px] text-[#EEDC94]/80 tracking-widest uppercase font-serif">
                        VIP MEMBER ♡
                      </p>
                    </div>
                  </div>
                </div>

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
        </section>

        {/* SEARCH & CATEGORY FILTER SECTION */}
        <section id="directorio" className="py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto scroll-mt-20">
          <div className="bg-[#230408]/70 border border-[#D4AF37]/25 rounded-2xl p-4 sm:p-6 backdrop-blur-md">
            {/* Search Input & Title */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
              <div>
                <h2 className="text-xl sm:text-2xl font-serif font-bold text-white flex items-center space-x-2">
                  <span className="text-[#D4AF37]">✧</span>
                  <span>Marcas Aliadas & Convenios</span>
                </h2>
                <p className="text-xs text-slate-300 mt-1">
                  Explora los descuentos presentando tu membresía activa
                </p>
              </div>

              {/* Live Search Bar */}
              <div className="relative w-full md:w-80">
                <Search className="w-4 h-4 text-[#D4AF37] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar por negocio o beneficio..."
                  className="w-full bg-[#3D0710]/70 border border-[#D4AF37]/40 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none focus:border-[#EEDC94] transition"
                />
              </div>
            </div>

            {/* Category Pills (Botón 'Todos' Fijo + Carrusel Continuo Lento de Categorías) */}
            <div className="flex items-center gap-2 pt-1 pb-1">
              {/* Botón "Todos" Fijo y Siempre Visible */}
              <button
                onClick={() => setSelectedCategorySlug("all")}
                className={`px-4 py-2 rounded-xl text-xs whitespace-nowrap transition flex items-center space-x-1.5 flex-shrink-0 z-10 cursor-pointer shadow-sm ${
                  selectedCategorySlug === "all"
                    ? "gold-gradient-bg text-[#230408] font-bold ring-2 ring-[#D4AF37]/50 shadow-md"
                    : "bg-[#3D0710]/90 border border-[#D4AF37]/35 text-slate-200 hover:text-[#EEDC94] hover:bg-[#5A0C18]"
                }`}
              >
                <Store className="w-3.5 h-3.5 text-current" />
                <span>Todos</span>
              </button>

              {/* Separador vertical elegante */}
              <div className="h-6 w-[1px] bg-[#D4AF37]/30 flex-shrink-0 mx-0.5" />

              {/* Track en movimiento suave (Marquee infinito continuo y pausible al interactuar) */}
              <div className="relative flex-1 overflow-hidden mask-category-edges">
                <div className="animate-category-scroll flex items-center gap-2">
                  {/* Duplicado en 3 tandas para ciclo infinito continuo y sin saltos */}
                  {[...categories, ...categories, ...categories].map((cat, idx) => {
                    const isActive = selectedCategorySlug === cat.slug;
                    return (
                      <button
                        key={`${cat.id}-${idx}`}
                        onClick={() => setSelectedCategorySlug(cat.slug)}
                        className={`px-3.5 py-2 rounded-xl text-xs whitespace-nowrap transition flex items-center space-x-1.5 flex-shrink-0 cursor-pointer ${
                          isActive
                            ? "gold-gradient-bg text-[#230408] font-bold shadow-md ring-2 ring-[#D4AF37]/60"
                            : "bg-[#3D0710]/60 border border-[#D4AF37]/25 text-slate-300 hover:text-[#EEDC94] hover:bg-[#5A0C18] hover:border-[#D4AF37]/40"
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
          </div>
        </section>

        {/* BUSINESSES DIRECTORY GRID */}
        <section
          ref={directoryRef}
          id="directorio-negocios"
          className="py-4 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex-1 scroll-mt-24"
        >
          {/* Counter & Active Filter Badge */}
          <div className="flex items-center justify-between text-xs text-[#F7EDC4]/90 mb-4 px-1">
            <span>Mostrando {filteredBusinesses.length} marcas aliadas</span>
            <span className="text-slate-400">Convenios 100% verificados</span>
          </div>

          {/* Grid Container */}
          {filteredBusinesses.length > 0 ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 min-h-[400px]">
                {paginatedBusinesses.map((biz) => {
                  const cleanPhone = (biz.whatsappNumber || "51952226282").replace(/[^0-9]/g, "");
                  const waMsg = encodeURIComponent(
                    `¡Hola ${biz.name}! Soy socio de Rosa Pasión Club (Código: RPC-0001) y deseo hacer válido mi beneficio exclusivo.`
                  );
                  const waUrl = `https://wa.me/${cleanPhone}?text=${waMsg}`;

                  return (
                    <div
                      key={biz.id}
                      className="rounded-3xl bg-gradient-to-b from-[#3D0710]/90 to-[#230408] border border-[#D4AF37]/30 p-5 sm:p-6 flex flex-col justify-between hover:border-[#D4AF37] transition-all duration-300 shadow-xl group"
                    >
                      <div>
                        <div className="flex items-center gap-4 mb-4">
                          {/* DEDICATED PARTNER LOGO BOX (Proporción cuadrada 1:1) */}
                          <div className="partner-logo-box w-20 h-20 rounded-2xl flex items-center justify-center p-1.5 flex-shrink-0 group-hover:scale-105 transition-transform overflow-hidden">
                            {getPartnerLogo(biz)}
                          </div>

                          {/* Business Titles & Category Tag */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-1.5 text-[#D4AF37] text-xs mb-1">
                              {getCategoryIcon(biz.category.name)}
                              <span className="text-[10px] uppercase font-bold tracking-wider text-[#EEDC94] truncate">
                                {biz.category.name}
                              </span>
                            </div>
                            <h3 className="font-serif font-bold text-white text-base sm:text-lg group-hover:text-[#F7EDC4] transition truncate">
                              {biz.name}
                            </h3>
                            <span className="inline-flex items-center mt-0.5 text-[9px] uppercase tracking-widest text-emerald-400 font-semibold bg-emerald-950/70 px-2 py-0.5 rounded border border-emerald-500/30">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1"></span>
                              Aliado Oficial
                            </span>
                          </div>
                        </div>

                        {/* Discount Tag Ribbon */}
                        <div className="mb-3.5 py-2 px-3.5 rounded-xl bg-black/50 border-l-4 border-[#D4AF37] flex items-center justify-between shadow-inner">
                          <span className="text-xs sm:text-sm font-extrabold text-white tracking-wide">
                            {biz.discountSummary}
                          </span>
                          <span className="text-[9px] text-[#D4AF37] font-bold uppercase tracking-widest bg-[#3D0710] px-2 py-0.5 rounded border border-[#D4AF37]/30">
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
                      <div className="space-y-2 pt-3 border-t border-[#D4AF37]/20">
                        {/* Fila: Ver Términos & Condiciones + Botones Redes Sociales (Facebook, Instagram, TikTok) */}
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => setActiveModalBusiness(biz)}
                            className="flex-1 py-2.5 px-3 rounded-xl bg-[#3D0710]/80 hover:bg-[#5A0C18] border border-[#D4AF37]/30 text-[#F7EDC4] font-semibold text-xs transition flex items-center justify-center space-x-1.5 cursor-pointer truncate"
                            title="Ver Términos & Condiciones"
                          >
                            <FileCheck2 className="w-3.5 h-3.5 text-[#D4AF37] flex-shrink-0" />
                            <span className="truncate">
                              <span className="hidden sm:inline">Ver </span>Términos
                            </span>
                          </button>

                          {/* Facebook */}
                          <a
                            href={`https://www.facebook.com/search/top?q=${encodeURIComponent(biz.name)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-9 h-9 rounded-xl bg-[#3D0710]/80 hover:bg-[#1877F2]/20 border border-[#D4AF37]/30 hover:border-[#1877F2]/60 text-slate-300 hover:text-[#1877F2] flex items-center justify-center transition shadow-xs cursor-pointer flex-shrink-0"
                            title={`Facebook de ${biz.name}`}
                            aria-label="Facebook"
                          >
                            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                            </svg>
                          </a>

                          {/* Instagram */}
                          <a
                            href={`https://www.instagram.com/explore/tags/${encodeURIComponent(biz.name.replace(/\s+/g, "").toLowerCase())}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-9 h-9 rounded-xl bg-[#3D0710]/80 hover:bg-[#E4405F]/20 border border-[#D4AF37]/30 hover:border-[#E4405F]/60 text-slate-300 hover:text-[#E4405F] flex items-center justify-center transition shadow-xs cursor-pointer flex-shrink-0"
                            title={`Instagram de ${biz.name}`}
                            aria-label="Instagram"
                          >
                            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                            </svg>
                          </a>

                          {/* TikTok */}
                          <a
                            href={`https://www.tiktok.com/search?q=${encodeURIComponent(biz.name)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-9 h-9 rounded-xl bg-[#3D0710]/80 hover:bg-black/60 border border-[#D4AF37]/30 hover:border-cyan-400/60 text-slate-300 hover:text-white flex items-center justify-center transition shadow-xs cursor-pointer flex-shrink-0 group/tt"
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
                          className="w-full py-2.5 px-3 rounded-xl gold-gradient-bg text-[#230408] font-bold text-xs uppercase tracking-wider hover:brightness-110 active:scale-98 transition flex items-center justify-center space-x-2 shadow"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          <span>Contactar Comercio</span>
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Portal Directory Pagination Controls */}
              {totalItems > pageSize && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-2xl bg-[#230408]/80 border border-[#D4AF37]/30 text-xs mt-6">
                  <span className="text-[#EEDC94]">
                    Mostrando {(currentPage - 1) * pageSize + 1} a{" "}
                    {Math.min(currentPage * pageSize, totalItems)} de {totalItems} marcas aliadas
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1.5 rounded-lg bg-[#3D0710] border border-[#D4AF37]/40 text-[#F7EDC4] hover:bg-[#5A0C18] disabled:opacity-40 disabled:pointer-events-none cursor-pointer transition-colors"
                    >
                      Anterior
                    </button>
                    {Array.from({ length: Math.ceil(totalItems / pageSize) }, (_, i) => i + 1).map(
                      (p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => handlePageChange(p)}
                          className={`w-7 h-7 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            currentPage === p
                              ? "gold-gradient-bg text-[#230408] shadow-sm ring-1 ring-[#D4AF37]"
                              : "bg-[#3D0710] text-[#EEDC94] hover:bg-[#5A0C18] border border-[#D4AF37]/20"
                          }`}
                        >
                          {p}
                        </button>
                      )
                    )}
                    <button
                      type="button"
                      onClick={() =>
                        handlePageChange(
                          Math.min(Math.ceil(totalItems / pageSize), currentPage + 1)
                        )
                      }
                      disabled={currentPage === Math.ceil(totalItems / pageSize)}
                      className="px-3 py-1.5 rounded-lg bg-[#3D0710] border border-[#D4AF37]/40 text-[#F7EDC4] hover:bg-[#5A0C18] disabled:opacity-40 disabled:pointer-events-none cursor-pointer transition-colors"
                    >
                      Siguiente
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-16 bg-[#230408]/40 rounded-2xl border border-[#D4AF37]/20 p-8 my-6">
              <div className="w-16 h-16 rounded-full bg-[#3D0710] flex items-center justify-center mx-auto mb-4 text-[#D4AF37] text-2xl">
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
                className="mt-4 px-4 py-2 bg-[#D4AF37] text-[#230408] rounded-xl text-xs font-bold hover:brightness-110 cursor-pointer"
              >
                Restablecer Filtros
              </button>
            </div>
          )}
        </section>

        {/* SECCIÓN: SOLICITAR SER SOCIO DE ROSA PASIÓN CLUB (Envío directo a WhatsApp) */}
        <MembershipRequestSection supportPhone={supportPhone} />

        {/* BANNER: HOW TO USE THE MEMBERSHIP */}
        <section className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="rounded-3xl bg-gradient-to-r from-[#3D0710] via-[#230408] to-[#3D0710] border border-[#D4AF37]/30 p-6 sm:p-8">
            <div className="text-center max-w-2xl mx-auto mb-8">
              <span className="text-[#D4AF37] text-xs font-bold uppercase tracking-widest">
                Paso a Paso
              </span>
              <h2 className="text-2xl font-serif font-bold text-white mt-1">
                ¿Cómo canjear tus beneficios?
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <div className="bg-[#230408]/60 p-5 rounded-2xl border border-[#D4AF37]/15">
                <div className="w-12 h-12 rounded-full gold-gradient-bg text-[#230408] font-bold flex items-center justify-center mx-auto mb-3 text-lg">
                  1
                </div>
                <h4 className="font-serif font-bold text-[#EEDC94] mb-1">Elige el Negocio</h4>
                <p className="text-xs text-slate-300">
                  Explora nuestro directorio y consulta las promociones y términos activos.
                </p>
              </div>

              <div className="bg-[#230408]/60 p-5 rounded-2xl border border-[#D4AF37]/15">
                <div className="w-12 h-12 rounded-full gold-gradient-bg text-[#230408] font-bold flex items-center justify-center mx-auto mb-3 text-lg">
                  2
                </div>
                <h4 className="font-serif font-bold text-[#EEDC94] mb-1">Presenta tu Tarjeta</h4>
                <p className="text-xs text-slate-300">
                  Muestra tu tarjeta física o esta pantalla con tu código de socio al momento del pedido.
                </p>
              </div>

              <div className="bg-[#230408]/60 p-5 rounded-2xl border border-[#D4AF37]/15">
                <div className="w-12 h-12 rounded-full gold-gradient-bg text-[#230408] font-bold flex items-center justify-center mx-auto mb-3 text-lg">
                  3
                </div>
                <h4 className="font-serif font-bold text-[#EEDC94] mb-1">Disfruta tu Descuento</h4>
                <p className="text-xs text-slate-300">
                  El descuento especial de Rosa Pasión Club se aplicará en tu cuenta final.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="mt-auto border-t border-[#D4AF37]/25 bg-[#230408]/90 text-slate-400 text-xs py-8 px-4 sm:px-6">
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
              <span className="text-[11px] text-[#EEDC94] font-semibold">Club de Beneficios Exclusivos</span>
            </div>
            <div className="text-[11px] text-slate-400">
              © 2026 Rosa Pasión. Todos los derechos reservados. Tarjetas personales e intransferibles.
            </div>
            <div className="flex items-center space-x-4 text-[#EEDC94]">
              <a
                href={`https://wa.me/${cleanSupport}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[#F7EDC4] transition"
              >
                <Phone className="w-4 h-4 text-emerald-400 inline" />
              </a>
              <button
                onClick={() => setIsCatalogModalOpen(true)}
                className="hover:text-[#F7EDC4] transition font-semibold cursor-pointer"
              >
                Catálogo
              </button>
            </div>
          </div>
        </footer>

      {/* FIXED BOTTOM NAVIGATION BAR (Mobile Optimized) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[#230408]/95 backdrop-blur-md border-t border-[#D4AF37]/30 px-4 py-2 z-40 flex items-center justify-around shadow-2xl">
        <a
          href="#directorio"
          className="flex flex-col items-center text-[#EEDC94] active:text-[#FCF8E8]"
        >
          <Tag className="w-4 h-4" />
          <span className="text-[10px] font-semibold mt-0.5">Beneficios</span>
        </a>
        <a
          href="#solicitar-membresia"
          className="flex flex-col items-center text-[#F7EDC4] active:text-white"
        >
          <Crown className="w-4 h-4 text-[#D4AF37]" />
          <span className="text-[10px] font-semibold mt-0.5">Ser Socio</span>
        </a>
        <button
          onClick={() => setIsCatalogModalOpen(true)}
          className="flex flex-col items-center text-slate-300 hover:text-[#EEDC94] cursor-pointer"
        >
          <div className="w-9 h-9 -mt-4 rounded-full gold-gradient-bg text-[#230408] flex items-center justify-center shadow-lg border-2 border-[#230408]">
            <BookOpen className="w-3.5 h-3.5" />
          </div>
          <span className="text-[10px] font-bold text-[#F7EDC4] mt-0.5">Catálogo</span>
        </button>
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
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="fixed inset-0" />
          <div className="relative w-full sm:max-w-lg bg-gradient-to-b from-[#3D0710] via-[#230408] to-[#230408] border border-[#D4AF37]/40 rounded-t-3xl sm:rounded-3xl shadow-2xl p-6 sm:p-7 max-h-[85vh] overflow-y-auto z-10 animate-in slide-in-from-bottom duration-200">
            {/* Modal Header with Dedicated Logo Slot */}
            <div className="flex items-start justify-between border-b border-[#D4AF37]/20 pb-4">
              <div className="flex items-center space-x-3.5">
                <div className="partner-logo-box w-16 h-16 rounded-2xl flex items-center justify-center p-1.5 flex-shrink-0 overflow-hidden">
                  {getPartnerLogo(activeModalBusiness)}
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-serif font-bold text-white">
                    {activeModalBusiness.name}
                  </h3>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#EEDC94] bg-[#5A0C18]/80 px-2 py-0.5 rounded border border-[#D4AF37]/30">
                    {activeModalBusiness.category.name}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setActiveModalBusiness(null)}
                className="w-8 h-8 rounded-full bg-[#3D0710] border border-[#D4AF37]/30 text-[#EEDC94] flex items-center justify-center hover:bg-[#D4AF37] hover:text-[#230408] transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Benefit Highlight Box */}
            <div className="my-4 p-4 rounded-2xl bg-black/40 border border-[#D4AF37]/30 flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full gold-gradient-bg text-[#230408] flex items-center justify-center font-bold text-base flex-shrink-0">
                %
              </div>
              <div>
                <span className="text-[10px] uppercase text-[#EEDC94] font-bold tracking-widest block">
                  Beneficio exclusivo Club
                </span>
                <p className="text-sm font-bold text-white">
                  {activeModalBusiness.discountSummary}
                </p>
              </div>
            </div>

            {/* Conditions List */}
            <div className="space-y-3 my-4">
              <h4 className="text-xs uppercase tracking-wider font-serif font-bold text-[#EEDC94] flex items-center space-x-1.5">
                <FileCheck2 className="w-4 h-4 text-[#D4AF37]" />
                <span>Términos y Reglas de Uso</span>
              </h4>
              <ul className="space-y-2.5 text-xs text-slate-200">
                {activeModalBusiness.terms && activeModalBusiness.terms.length > 0 ? (
                  activeModalBusiness.terms.map((term) => (
                    <li key={term.id} className="flex items-start space-x-2.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#D4AF37] mt-0.5 flex-shrink-0" />
                      <span className="leading-relaxed">{term.description}</span>
                    </li>
                  ))
                ) : (
                  <li className="flex items-start space-x-2.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#D4AF37] mt-0.5 flex-shrink-0" />
                    <span className="leading-relaxed">
                      Presentar tarjeta de socio física o digital vigente antes de solicitar la cuenta.
                    </span>
                  </li>
                )}
              </ul>
            </div>

            {/* Action Footer */}
            <div className="pt-4 border-t border-[#D4AF37]/20 flex flex-col sm:flex-row gap-3">
              <a
                href={`https://wa.me/${(activeModalBusiness.whatsappNumber || "51952226282").replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
                  `Hola ${activeModalBusiness.name}, tengo mi membresía de Rosa Pasión Club (Socio RPC-0001) y deseo consultar por el beneficio de "${activeModalBusiness.discountSummary}".`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-3 px-4 rounded-xl gold-gradient-bg text-[#230408] font-bold text-xs uppercase tracking-wider flex items-center justify-center space-x-2 shadow-lg hover:brightness-110 active:scale-95 transition"
              >
                <Phone className="w-3.5 h-3.5 text-[#230408]" />
                <span>Contactar / Canjear</span>
              </a>
              <button
                onClick={() => setActiveModalBusiness(null)}
                className="py-3 px-4 rounded-xl bg-[#3D0710] border border-[#D4AF37]/30 text-[#EEDC94] font-semibold text-xs hover:bg-[#5A0C18] transition cursor-pointer"
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
        membershipPrice={clubSettings?.membershipPrice ? Number(clubSettings.membershipPrice) : 29.0}
      />
    </div>
  );
}
