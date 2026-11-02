"use client";

import React, { useState, useTransition } from "react";
import {
  Plus,
  Trash2,
  Edit2,
  Search,
  CheckCircle2,
  AlertCircle,
  X,
  CreditCard,
  Phone,
  Mail,
  Calendar,
  Clock,
  UserCheck,
  MessageCircle,
} from "lucide-react";
import {
  createMember,
  updateMember,
  toggleMemberStatus,
  deleteMember,
  MemberData,
} from "@/actions/member";
import { Pagination } from "@/components/ui/pagination";

interface Member {
  id: string;
  code: string;
  name: string;
  documentType?: string;
  documentNumber?: string | null;
  email?: string | null;
  phone?: string | null;
  validFrom: Date | string;
  validUntil: Date | string;
  status: "ACTIVA" | "VENCIDA" | "SUSPENDIDA";
  createdAt: Date | string;
  _count?: {
    history: number;
  };
}

function formatDateDisplay(val: string | Date | null | undefined): string {
  if (!val) return "";
  try {
    const str = typeof val === "string" ? val : val.toISOString();
    const dPart = str.split("T")[0];
    const parts = dPart.split("-");
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dPart;
  } catch {
    return "";
  }
}

function toTitleCase(str: string): string {
  if (!str) return "";
  return str
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function getRenewalWhatsAppUrl(m: Member): string | null {
  if (!m.phone) return null;
  const cleanPhone = m.phone.replace(/\D/g, "");
  const waPhone = cleanPhone.startsWith("51") ? cleanPhone : `51${cleanPhone}`;
  const now = new Date();
  const validUntilDate = new Date(m.validUntil);
  const diffDays = Math.ceil((validUntilDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  const isExpiringSoon = diffDays <= 2 && diffDays >= 0;
  const isExpired = diffDays < 0 || m.status === "VENCIDA";
  const formattedDate = formatDateDisplay(m.validUntil);

  // Datos personalizados del socio
  const clientName = toTitleCase(m.name);
  const firstName = clientName.split(" ")[0] || clientName;
  const docType = m.documentType || "DNI";
  const docNumber = m.documentNumber ? m.documentNumber.trim() : "";

  let message = "";
  if (isExpired) {
    message =
      `¡Hola ${firstName}! 🌹 Te saludamos de *Rosa Pasión Club*.\n\n` +
      `Te informamos con mucho cariño que tu membresía *${m.code}* (${clientName}) finalizó su vigencia el *${formattedDate}*.\n\n` +
      `Para que sigas disfrutando sin interrupciones de tus descuentos y beneficios exclusivos en cafeterías, pastelerías, salones, car wash y florería Rosa Pasión, puedes renovar al instante sin comisiones (S/ 29.00).\n\n` +
      `📲 *Pasos para renovar con Yape o Plin:*\n` +
      `1. Entra a nuestra web: 👉 https://rosapasionclub.com\n` +
      (docNumber ? `2. Digita tu ${docType}: *${docNumber}*\n` : `2. Ingresa con tu número de documento.\n`) +
      `3. Realiza tu pago por Yape o Plin de *S/ 29.00* al *952 226 282* (Rosa Pasión Flores y Detalles) y adjunta tu comprobante.\n\n` +
      `¡Tu membresía se reactivará al momento! 🌸 Si tienes alguna duda, escríbenos por este mismo chat. ¡Te esperamos!`;
  } else if (isExpiringSoon) {
    const timePhrase = diffDays === 0 ? "¡vence hoy!" : diffDays === 1 ? "vence mañana" : `vence en ${diffDays} días`;
    message =
      `¡Hola ${firstName}! 🌹 Te saludamos de *Rosa Pasión Club*.\n\n` +
      `Te recordamos que tu membresía *${m.code}* (${clientName}) está próxima a finalizar (${timePhrase}, el *${formattedDate}*).\n\n` +
      `Renueva con anticipación fácilmente para continuar gozando de todos tus beneficios y promociones exclusivas (S/ 29.00).\n\n` +
      `📲 *Renueva al instante sin comisiones:*\n` +
      `1. Entra a 👉 https://rosapasionclub.com\n` +
      (docNumber ? `2. Digita tu ${docType}: *${docNumber}*\n` : `2. Ingresa con tu número de documento.\n`) +
      `3. Selecciona Yape o Plin al *952 226 282* y sube tu voucher.\n\n` +
      `¡Muchas gracias por formar parte de nuestra comunidad Rosa Pasión! ✨`;
  } else {
    message =
      `¡Hola ${firstName}! 🌹 Te saludamos de *Rosa Pasión Club*.\n\n` +
      `Te confirmamos que tu membresía *${m.code}* (${clientName}) se encuentra totalmente *ACTIVA* con vigencia hasta el *${formattedDate}*.\n\n` +
      `Recuerda que puedes consultar tus convenios aliados y presentar tu carnet digital ingresando a nuestra web:\n` +
      `👉 https://rosapasionclub.com` +
      (docNumber ? ` (con tu ${docType}: *${docNumber}*)` : "") +
      `\n\n¡Que tengas un lindo día! 🌸`;
  }

  return `https://wa.me/${waPhone}?text=${encodeURIComponent(message)}`;
}

interface SubscriptionManagerProps {
  initialMembers: Member[];
}

export function SubscriptionManager({ initialMembers }: SubscriptionManagerProps) {
  const [members, setMembers] = useState<Member[]>(initialMembers);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);

  // Pagination (5 por página)
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  const [formData, setFormData] = useState<MemberData>({
    code: "",
    name: "",
    documentType: "DNI",
    documentNumber: "",
    email: "",
    phone: "",
    validFrom: new Date().toISOString().split("T")[0],
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    status: "ACTIVA",
  });

  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const filteredMembers = members.filter((m) => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return (
      m.code.toLowerCase().includes(q) ||
      m.name.toLowerCase().includes(q) ||
      (m.documentNumber && m.documentNumber.toLowerCase().includes(q)) ||
      (m.email && m.email.toLowerCase().includes(q)) ||
      (m.phone && m.phone.includes(q))
    );
  });

  const totalItems = filteredMembers.length;
  const paginatedMembers = filteredMembers.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handleOpenCreate = () => {
    setEditingMember(null);
    const nextNum = members.length + 1;
    const formattedCode = `RPC-${String(nextNum).padStart(4, "0")}`;
    setFormData({
      code: formattedCode,
      name: "",
      documentType: "DNI",
      documentNumber: "",
      email: "",
      phone: "+51",
      validFrom: new Date().toISOString().split("T")[0],
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      status: "ACTIVA",
    });
    setError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (m: Member) => {
    setEditingMember(m);
    setFormData({
      code: m.code,
      name: m.name,
      documentType: m.documentType || "DNI",
      documentNumber: m.documentNumber || "",
      email: m.email || "",
      phone: m.phone || "",
      validFrom: new Date(m.validFrom).toISOString().split("T")[0],
      validUntil: new Date(m.validUntil).toISOString().split("T")[0],
      status: m.status,
    });
    setError(null);
    setIsModalOpen(true);
  };

  const handleToggleStatus = (id: string, current: "ACTIVA" | "VENCIDA" | "SUSPENDIDA") => {
    const nextStatus = current === "ACTIVA" ? "VENCIDA" : "ACTIVA";
    setMembers((prev) =>
      prev.map((m) => (m.id === id ? { ...m, status: nextStatus } : m))
    );

    startTransition(async () => {
      const res = await toggleMemberStatus(id, nextStatus);
      if (!res.success) {
        setMembers((prev) =>
          prev.map((m) => (m.id === id ? { ...m, status: current } : m))
        );
        alert(res.message || "Error al actualizar estado");
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      if (editingMember) {
        const res = await updateMember(editingMember.id, formData);
        if (res.success && res.member) {
          setMembers((prev) =>
            prev.map((m) =>
              m.id === editingMember.id ? { ...m, ...res.member } : m
            )
          );
          setIsModalOpen(false);
        } else {
          setError(res.message || "Error al actualizar socio");
        }
      } else {
        const res = await createMember(formData);
        if (res.success && res.member) {
          setMembers((prev) => [{ ...res.member, _count: { history: 0 } }, ...prev]);
          setIsModalOpen(false);
        } else {
          setError(res.message || "Error al registrar socio");
        }
      }
    });
  };

  const handleDelete = async (id: string, code: string) => {
    if (!confirm(`¿Dar de baja al socio con carnet ${code}? Sus registros se conservarán de forma segura en el historial.`)) return;

    startTransition(async () => {
      const res = await deleteMember(id);
      if (res.success) {
        setMembers((prev) => prev.filter((m) => m.id !== id));
      } else {
        alert(res.message || "Error al eliminar socio");
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
        <div>
          <h2 className="text-2xl font-serif font-bold text-stone-900 tracking-tight">
            Suscripciones & Socios del Club
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Control de tarjetas de membresía activas, códigos RPC y fechas de vigencia
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#4A0A10] hover:bg-[#580A15] text-white text-xs font-semibold shadow-md transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Nuevo Socio</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-4 flex items-center gap-3">
        <Search className="w-4 h-4 text-stone-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setCurrentPage(1);
          }}
          placeholder="Buscar por código (RPC-0001), DNI / Carnet de Extranjería, nombre, correo o celular..."
          className="w-full text-xs text-stone-800 placeholder-stone-400 focus:outline-none"
        />
        {search && (
          <button
            onClick={() => {
              setSearch("");
              setCurrentPage(1);
            }}
            className="text-stone-400 hover:text-stone-600 text-xs font-medium cursor-pointer"
          >
            Limpiar
          </button>
        )}
      </div>

      {/* Members List: Responsive Mobile Cards + Desktop Table */}
      <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden" suppressHydrationWarning>
        
        {/* VISTA MÓVIL (Cards Verticales para Pantallas < 768px) */}
        <div className="block md:hidden divide-y divide-stone-100">
          {paginatedMembers.length > 0 ? (
            paginatedMembers.map((m) => (
              <div key={m.id} className="p-4 space-y-3 hover:bg-stone-50/50 transition-colors">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono font-bold text-xs bg-[#FAF2E8] border border-[#D4AF37]/40 px-2.5 py-1 rounded-lg text-[#4A0A10]">
                    {m.code}
                  </span>
                  <button
                    onClick={() => handleToggleStatus(m.id, m.status)}
                    className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase transition-colors cursor-pointer ${
                      m.status === "ACTIVA"
                        ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                        : m.status === "VENCIDA"
                        ? "bg-red-100 text-red-800 border border-red-300"
                        : "bg-amber-100 text-amber-800 border border-amber-300"
                    }`}
                    title="Toca para cambiar estado"
                  >
                    {m.status}
                  </button>
                </div>

                <div>
                  <h4 className="font-bold text-stone-900 text-sm">{m.name}</h4>
                  <div className="flex flex-wrap items-center gap-1.5 text-xs text-stone-500 mt-1">
                    {m.documentNumber && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-stone-100 text-stone-800 font-mono text-[10px] font-semibold border border-stone-200">
                        {m.documentType || "DNI"}: {m.documentNumber}
                      </span>
                    )}
                    {m.phone && (
                      <span className="flex items-center gap-1 text-[11px]">
                        <Phone className="w-3 h-3 text-stone-400" />
                        {m.phone}
                      </span>
                    )}
                  </div>
                </div>

                {/* Fecha y Estado de Vigencia */}
                <div className="flex flex-col gap-1.5 bg-stone-50 p-2.5 rounded-lg border border-stone-100 text-xs text-stone-600">
                  <div className="flex items-center justify-between" suppressHydrationWarning>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-stone-400" />
                      <span className="text-[11px]">
                        Vigencia:{" "}
                        <strong className="text-stone-900">
                          {formatDateDisplay(m.validUntil)}
                        </strong>
                      </span>
                    </div>

                    {/* Badge de vencimiento en 2 días o vencida */}
                    {(() => {
                      const now = new Date();
                      const vDate = new Date(m.validUntil);
                      const dDiff = Math.ceil((vDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                      if (dDiff <= 2 && dDiff >= 0 && m.status === "ACTIVA") {
                        return (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300 animate-pulse">
                            Vence {dDiff === 0 ? "hoy" : `en ${dDiff}d`}
                          </span>
                        );
                      }
                      if (dDiff < 0 || m.status === "VENCIDA") {
                        return (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800 border border-red-300">
                            Vencida
                          </span>
                        );
                      }
                      return (
                        <span className="px-2 py-0.5 rounded-full text-[10px] bg-white text-stone-700 border border-stone-200 font-medium">
                          {m._count?.history ?? 0} canjes
                        </span>
                      );
                    })()}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100">
                  {/* Botón WhatsApp Recordatorio si tiene teléfono */}
                  {(() => {
                    const waUrl = getRenewalWhatsAppUrl(m);
                    if (!waUrl) return null;
                    const now = new Date();
                    const vDate = new Date(m.validUntil);
                    const dDiff = Math.ceil((vDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                    const isExpiringSoon = dDiff <= 2 && dDiff >= 0 && m.status === "ACTIVA";
                    const isExpired = dDiff < 0 || m.status === "VENCIDA";

                    return (
                      <a
                        href={waUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`py-1.5 px-3 rounded-lg font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-xs border ${
                          isExpired
                            ? "bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-300"
                            : isExpiringSoon
                            ? "bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-300 animate-pulse"
                            : "bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200"
                        }`}
                        title={
                          isExpired
                            ? "Enviar aviso personalizado por WhatsApp (Membresía Vencida)"
                            : isExpiringSoon
                            ? `Enviar aviso personalizado por WhatsApp (Vence en ${dDiff} días)`
                            : "Enviar mensaje personalizado por WhatsApp"
                        }
                      >
                        <MessageCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>
                          {isExpired
                            ? "Aviso Vencida"
                            : isExpiringSoon
                            ? `Aviso ${dDiff}d`
                            : "WhatsApp"}
                        </span>
                      </a>
                    );
                  })()}

                  <button
                    onClick={() => handleOpenEdit(m)}
                    className="flex-1 py-1.5 px-3 rounded-lg bg-[#D4AF37] hover:bg-[#C59B27] text-white font-medium text-xs shadow-xs transition-colors cursor-pointer text-center"
                  >
                    Editar Datos
                  </button>
                  <button
                    onClick={() => handleDelete(m.id, m.code)}
                    className="p-1.5 rounded-lg border border-stone-200 text-stone-400 hover:text-red-600 hover:border-red-200 transition-colors cursor-pointer"
                    title="Eliminar socio"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="py-12 text-center text-stone-400 text-xs">
              No se encontraron socios registrados.
            </div>
          )}
        </div>

        {/* VISTA DESKTOP (Tabla Completa para Pantallas >= 768px) */}
        <div className="hidden md:block overflow-x-auto w-full">
          <table className="w-full text-left text-xs border-collapse min-w-[650px] sm:min-w-full" suppressHydrationWarning>
          <thead>
            <tr className="border-b border-stone-200 bg-stone-50/70 text-stone-700 font-semibold">
              <th className="py-3 px-4 text-stone-700 font-bold uppercase tracking-wider text-[11px]">
                Código
              </th>
              <th className="py-3 px-6 text-stone-700 font-bold uppercase tracking-wider text-[11px]">
                Socio
              </th>
              <th className="py-3 px-6 text-stone-700 font-bold uppercase tracking-wider text-[11px]">
                Vigencia
              </th>
              <th className="py-3 px-4 text-stone-700 font-bold uppercase tracking-wider text-[11px]">
                Canjes
              </th>
              <th className="py-3 px-4 text-stone-700 font-bold uppercase tracking-wider text-[11px]">
                Estado
              </th>
              <th className="py-3 px-4 text-right text-stone-700 font-bold uppercase tracking-wider text-[11px] whitespace-nowrap min-w-[220px]">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100 text-stone-800">
            {paginatedMembers.length > 0 ? (
              paginatedMembers.map((m) => (
                <tr key={m.id} className="hover:bg-stone-50/80 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-xs text-[#4A0A10]">
                    <span className="bg-[#FAF2E8] border border-[#D4AF37]/40 px-2 py-0.5 rounded text-[#4A0A10]">
                      {m.code}
                    </span>
                  </td>
                  <td className="py-3.5 px-6">
                    <p className="font-bold text-stone-900 text-sm leading-tight">{m.name}</p>
                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-stone-500 mt-1">
                      {m.documentNumber && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-stone-100 text-stone-800 font-mono text-[10px] font-semibold border border-stone-200">
                          {m.documentType || "DNI"}: {m.documentNumber}
                        </span>
                      )}
                      {m.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3 text-stone-400" />
                          {m.phone}
                        </span>
                      )}
                      {m.email && (
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3 text-stone-400" />
                          {m.email}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3.5 px-6 text-[11px] text-stone-600">
                    <div className="flex flex-col gap-1" suppressHydrationWarning>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-stone-400" />
                        <span>
                          {formatDateDisplay(m.validFrom)} —{" "}
                          <strong className="text-stone-900">
                            {formatDateDisplay(m.validUntil)}
                          </strong>
                        </span>
                      </div>

                      {/* Badge indicador si vence pronto */}
                      {(() => {
                        const now = new Date();
                        const vDate = new Date(m.validUntil);
                        const dDiff = Math.ceil((vDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                        if (dDiff <= 2 && dDiff >= 0 && m.status === "ACTIVA") {
                          return (
                            <span className="w-fit px-1.5 py-0.2 rounded font-bold text-[9px] bg-amber-100 text-amber-800 border border-amber-300 animate-pulse">
                              Vence {dDiff === 0 ? "hoy" : `en ${dDiff} días`}
                            </span>
                          );
                        }
                        return null;
                      })()}
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-stone-100 text-stone-700 border border-stone-200">
                      {m._count?.history ?? 0} canjes
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <button
                      onClick={() => handleToggleStatus(m.id, m.status)}
                      className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase transition-colors cursor-pointer ${
                        m.status === "ACTIVA"
                          ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                          : m.status === "VENCIDA"
                          ? "bg-red-100 text-red-800 border border-red-300"
                          : "bg-amber-100 text-amber-800 border border-amber-300"
                      }`}
                      title="Haz clic para cambiar estado"
                    >
                      {m.status}
                    </button>
                  </td>
                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    <div className="inline-flex items-center justify-end gap-1.5 flex-nowrap">
                      {/* Botón Recordatorio WhatsApp 2 días / Vencida */}
                      {(() => {
                        const waUrl = getRenewalWhatsAppUrl(m);
                        if (!waUrl) return null;
                        const now = new Date();
                        const vDate = new Date(m.validUntil);
                        const dDiff = Math.ceil((vDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                        const isExpiringSoon = dDiff <= 2 && dDiff >= 0 && m.status === "ACTIVA";
                        const isExpired = dDiff < 0 || m.status === "VENCIDA";

                        return (
                          <a
                            href={waUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold border transition-all cursor-pointer whitespace-nowrap shrink-0 shadow-2xs ${
                              isExpired
                                ? "bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-300"
                                : isExpiringSoon
                                ? "bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-300 animate-pulse"
                                : "bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200"
                            }`}
                            title={
                              isExpired
                                ? "Avisar por WhatsApp: membresía vencida"
                                : isExpiringSoon
                                ? `Avisar por WhatsApp: vence en ${dDiff} días`
                                : "Enviar mensaje WhatsApp"
                            }
                          >
                            <MessageCircle className="w-3.5 h-3.5 shrink-0" />
                            <span>
                              {isExpired
                                ? "Aviso Vencida"
                                : isExpiringSoon
                                ? `Aviso ${dDiff}d`
                                : "WhatsApp"}
                            </span>
                          </a>
                        );
                      })()}

                      <button
                        onClick={() => handleOpenEdit(m)}
                        className="px-3 py-1.5 rounded-md bg-[#D4AF37] hover:bg-[#C59B27] text-white font-medium text-xs shadow-2xs transition-colors cursor-pointer whitespace-nowrap shrink-0"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(m.id, m.code)}
                        className="p-1.5 rounded-md text-stone-400 hover:text-red-600 hover:bg-red-50 transition-colors inline-flex items-center justify-center cursor-pointer shrink-0"
                        title="Eliminar socio"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="py-12 text-center text-stone-400">
                  No se encontraron socios registrados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        </div>

        {/* Paginación */}
        <Pagination
          currentPage={currentPage}
          totalItems={totalItems}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
        />
      </div>

      {/* Modal Socio: Tamaño ergonómico y scroll interno */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop: No se cierra al hacer clic afuera */}
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs" />
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl p-6 sm:p-7 z-10 border border-stone-200 animate-in fade-in zoom-in-95 duration-200 max-h-[88vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 mb-4 flex-shrink-0">
              <h3 className="text-base font-bold text-stone-900">
                {editingMember ? "Editar Tarjeta de Socio" : "Registrar Nueva Membresía"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-full text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex-shrink-0">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto pr-1 flex-1">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Código de Tarjeta
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="RPC-0001"
                    className="w-full bg-white border border-stone-300 rounded-lg px-3.5 py-2 text-xs font-mono font-bold text-stone-900 focus:outline-none focus:ring-1 focus:ring-[#4A0A10]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Estado
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        status: e.target.value as "ACTIVA" | "VENCIDA" | "SUSPENDIDA",
                      })
                    }
                    className="w-full bg-white border border-stone-300 rounded-lg px-3 py-2 text-xs text-stone-900 focus:outline-none"
                  >
                    <option value="ACTIVA">ACTIVA</option>
                    <option value="VENCIDA">VENCIDA</option>
                    <option value="SUSPENDIDA">SUSPENDIDA</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Nombre Completo del Socio
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Orison David"
                  className="w-full bg-white border border-stone-300 rounded-lg px-3.5 py-2 text-xs text-stone-900 focus:outline-none focus:ring-1 focus:ring-[#4A0A10]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Tipo de Documento
                  </label>
                  <select
                    value={formData.documentType || "DNI"}
                    onChange={(e) => setFormData({ ...formData, documentType: e.target.value })}
                    className="w-full bg-white border border-stone-300 rounded-lg px-3 py-2 text-xs text-stone-900 focus:outline-none"
                  >
                    <option value="DNI">DNI (Perú)</option>
                    <option value="CE">Carnet de Extranjería (CE)</option>
                    <option value="PASAPORTE">Pasaporte</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    N° de Documento <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.documentNumber || ""}
                    onChange={(e) => setFormData({ ...formData, documentNumber: e.target.value.trim() })}
                    placeholder={formData.documentType === "DNI" ? "8 dígitos (ej. 71234567)" : "N° de documento"}
                    className="w-full bg-white border border-stone-300 rounded-lg px-3.5 py-2 text-xs font-mono text-stone-900 focus:outline-none focus:ring-1 focus:ring-[#4A0A10]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    WhatsApp / Celular
                  </label>
                  <input
                    type="text"
                    value={formData.phone || ""}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+51999999999"
                    className="w-full bg-white border border-stone-300 rounded-lg px-3.5 py-2 text-xs text-stone-900 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Correo Electrónico
                  </label>
                  <input
                    type="email"
                    value={formData.email || ""}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="socio@email.com"
                    className="w-full bg-white border border-stone-300 rounded-lg px-3.5 py-2 text-xs text-stone-900 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Fecha de Inicio
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.validFrom}
                    onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                    className="w-full bg-white border border-stone-300 rounded-lg px-3.5 py-2 text-xs text-stone-900 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Fecha de Vencimiento
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.validUntil}
                    onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                    className="w-full bg-white border border-stone-300 rounded-lg px-3.5 py-2 text-xs text-stone-900 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-stone-100 flex justify-end gap-2 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-stone-600 hover:bg-stone-100 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-6 py-2.5 rounded-full bg-gradient-to-r from-[#C59B27] via-[#E5C058] to-[#C59B27] text-[#2F070E] font-bold text-xs uppercase tracking-wider shadow-md cursor-pointer hover:brightness-105"
                >
                  {isPending ? "Guardando..." : "Guardar Socio"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
