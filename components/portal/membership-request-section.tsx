"use client";

import React, { useState, useEffect } from "react";
import {
  User,
  CreditCard,
  Phone,
  Mail,
  Calendar,
  MapPin,
  Sparkles,
  Crown,
  CheckCircle2,
  Gift,
  ShieldCheck,
  Send,
  AlertCircle,
  Heart,
  Home,
  Compass,
  Plus,
  Trash2,
  X,
} from "lucide-react";

interface SpecialDate {
  id: string;
  date: string;
  occasion: string;
}

interface MembershipRequestSectionProps {
  supportPhone?: string;
}

export function MembershipRequestSection({
  supportPhone = "952 226 282",
}: MembershipRequestSectionProps) {
  const [name, setName] = useState("");
  const [documentType, setDocumentType] = useState("DNI");
  const [documentNumber, setDocumentNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [birthday, setBirthday] = useState("");
  const [city, setCity] = useState("Tarapoto");
  const [recipient, setRecipient] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [address, setAddress] = useState("");
  const [reference, setReference] = useState("");
  const [dedication, setDedication] = useState("");
  const [specialDates, setSpecialDates] = useState<SpecialDate[]>([]);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!submitted) return;
    const timer = setTimeout(() => {
      setSubmitted(false);
    }, 6000);
    return () => clearTimeout(timer);
  }, [submitted]);

  // Normalizar número de teléfono para WhatsApp (añade prefijo 51 si es número peruano de 9 dígitos)
  const cleanPhone = (supportPhone || "952226282").replace(/\D/g, "");
  const waNumber = cleanPhone.startsWith("51") ? cleanPhone : `51${cleanPhone}`;

  const handleAddSpecialDate = () => {
    setSpecialDates((prev) => [
      ...prev,
      { id: Math.random().toString(36).substring(2, 9), date: "", occasion: "" },
    ]);
  };

  const handleUpdateSpecialDate = (id: string, field: "date" | "occasion", value: string) => {
    setSpecialDates((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const handleRemoveSpecialDate = (id: string) => {
    setSpecialDates((prev) => prev.filter((item) => item.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Por favor ingresa tu nombre completo.");
      return;
    }
    if (!documentNumber.trim()) {
      setError("Por favor ingresa tu número de documento.");
      return;
    }
    if (!phone.trim()) {
      setError("Por favor ingresa tu número de celular o WhatsApp.");
      return;
    }

    let formattedBirthday = "";
    if (birthday.trim()) {
      try {
        const parts = birthday.split("-");
        if (parts.length === 3) {
          formattedBirthday = `${parts[2]}/${parts[1]}/${parts[0]}`;
        } else {
          formattedBirthday = birthday.trim();
        }
      } catch {
        formattedBirthday = birthday.trim();
      }
    }

    const validSpecialDates = specialDates.filter(
      (sd) => sd.date.trim() || sd.occasion.trim()
    );

    const messageLines = [
      "🌹 *SOLICITUD DE MEMBRESÍA - ROSA PASIÓN CLUB* 🌹",
      "",
      "¡Hola Rosa Pasión! Deseo afiliarme a la membresía exclusiva y solicitar la entrega de la tarjeta.",
      "",
      `💌 Nombre de quien envía: ${name.trim()}`,
      `📋 Documento: ${documentType} ${documentNumber.trim()}`,
      `📱 Celular de quien envía: ${phone.trim()}`,
      email.trim() ? `📧 Correo: ${email.trim()}` : null,
      "",
      `🎁 Nombre de quien recibe: ${recipient.trim() || name.trim()}`,
      recipientPhone.trim() ? `📱 Celular de quien recibe: ${recipientPhone.trim()}` : null,
      address.trim() ? `📍 Dirección exacta: ${address.trim()}` : null,
      reference.trim() ? `📌 Referencia: ${reference.trim()}` : null,
      dedication.trim() ? `💖 Dedicatoria: ${dedication.trim()}` : null,
      city.trim() ? `📍 Ciudad / Distrito: ${city.trim()}` : null,
      formattedBirthday ? `🎂 Cumpleaños: ${formattedBirthday}` : null,
      validSpecialDates.length > 0 ? "" : null,
      validSpecialDates.length > 0 ? "🗓️ *Fechas Especiales:*" : null,
      ...validSpecialDates.map((item, idx) => {
        let dateLabel = "";
        if (item.date) {
          const parts = item.date.split("-");
          dateLabel = parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : item.date;
        }
        const desc = item.occasion.trim();
        return `   ${idx + 1}. ${dateLabel ? `${dateLabel}` : ""} ${desc ? `(${desc})` : ""}`.trim();
      }),
      notes.trim() ? `💬 *Mensaje Adicional:* ${notes.trim()}` : null,
      "",
      "💳 *Por favor, confírmenme para la activación y entrega de la tarjeta.* ¡Muchas gracias!",
    ].filter(Boolean);

    const fullMessage = messageLines.join("\n");
    const cleanPhone = waNumber.replace(/\D/g, "");
    const phoneFormatted = cleanPhone.startsWith("51") ? cleanPhone : `51${cleanPhone}`;
    const encodedText = encodeURIComponent(fullMessage);
    // api.whatsapp.com preserva la codificación UTF-8 en navegadores de PC y abre la app en celulares sin corromper emojis
    const waUrl = `https://api.whatsapp.com/send?phone=${phoneFormatted}&text=${encodedText}`;

    // Abrir WhatsApp con la solicitud preparada
    window.open(waUrl, "_blank");

    // Limpiar todos los campos del formulario como si estuviera refrescado
    setName("");
    setDocumentType("DNI");
    setDocumentNumber("");
    setPhone("");
    setEmail("");
    setBirthday("");
    setCity("Tarapoto");
    setRecipient("");
    setRecipientPhone("");
    setAddress("");
    setReference("");
    setDedication("");
    setSpecialDates([]);
    setNotes("");
    setError(null);
    setSubmitted(true);
  };

  return (
    <section id="solicitar-membresia" className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto scroll-mt-20 relative z-10">
      <div className="relative rounded-3xl overflow-hidden border border-white/20 bg-white/[0.08] backdrop-blur-xl shadow-2xl p-6 sm:p-10 lg:p-12">
        {/* Glow & ambient circles */}
        <div className="absolute -top-32 -left-32 w-80 h-80 bg-red-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-rose-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center relative z-10">
          {/* COLUMNA IZQUIERDA: PROPUESTA DE VALOR / PREVIEW TARJETA */}
          <div className="lg:col-span-6 space-y-6 text-center lg:text-left">
            {/* Logo Oficial Vertical */}
            <div className="w-24 sm:w-28 p-2.5 rounded-2xl bg-white shadow-xl border-2 border-[#D4AF37]/50 mx-auto lg:mx-0 flex items-center justify-center">
              <img
                src="/logo-vertical.png"
                alt="Rosa Pasión Club"
                className="w-full h-auto object-contain"
              />
            </div>

            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-red-600 border border-red-400/40 text-white text-xs font-semibold tracking-wider uppercase shadow-md shadow-red-600/30">
              <Crown className="w-3.5 h-3.5 text-[#F7EDC4]" />
              <span>Membresía Exclusiva</span>
            </div>

            <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif font-bold text-white leading-tight">
              Obtén tu Tarjeta Virtual y{" "}
              <span className="gold-gradient-text italic block sm:inline">
                Únete a Rosa Pasión Club
              </span>
            </h2>

            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              Solicita tu membresía para disfrutar de descuentos de hasta 25% en comercios aliados,
              atención prioritaria en flores y detalles, y cortesías especiales en tus fechas memorables.
            </p>

            {/* Lista de beneficios destacados */}
            <div className="space-y-3.5 pt-2">
              <div className="flex items-start space-x-3 text-left">
                <div className="w-8 h-8 rounded-full bg-red-600/80 border border-red-400/40 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-md shadow-red-600/20">
                  <Sparkles className="w-4 h-4 text-[#F7EDC4]" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Descuentos Inmediatos</h4>
                  <p className="text-xs text-stone-300">
                    Ahorra en restaurantes, salones de belleza, cafeterías, moda y más.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3 text-left">
                <div className="w-8 h-8 rounded-full bg-red-600/80 border border-red-400/40 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-md shadow-red-600/20">
                  <Gift className="w-4 h-4 text-[#F7EDC4]" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Sorpresas y Detalles</h4>
                  <p className="text-xs text-stone-300">
                    Beneficios preferenciales en arreglos florales y regalos para tus ocasiones especiales.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3 text-left">
                <div className="w-8 h-8 rounded-full bg-red-600/80 border border-red-400/40 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-md shadow-red-600/20">
                  <ShieldCheck className="w-4 h-4 text-[#F7EDC4]" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Tarjeta Digital y Física</h4>
                  <p className="text-xs text-stone-300">
                    Accede a tu código de socio en línea desde cualquier dispositivo con tu número de tarjeta.
                  </p>
                </div>
              </div>
            </div>

            {/* Nota de soporte directo */}
            <div className="p-3.5 rounded-2xl bg-black/35 border border-white/10 text-xs text-stone-300 flex items-center justify-center lg:justify-start gap-2 backdrop-blur-sm">
              <Phone className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>
                Atención vía WhatsApp: <strong className="text-white">{supportPhone}</strong>
              </span>
            </div>
          </div>

          {/* COLUMNA DERECHA: FORMULARIO DE SOLICITUD */}
          <div className="lg:col-span-6">
            <div className="bg-white/[0.08] backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-white/20 shadow-2xl text-white relative">
              <div className="mb-5 text-center lg:text-left">
                <h3 className="text-xl font-serif font-bold text-white">
                  Formulario de Afiliación & Envío
                </h3>
                <p className="text-xs text-slate-200 mt-1">
                  Completa tus datos y la solicitud se enviará de inmediato a nuestro WhatsApp oficial.
                </p>
              </div>

              {error && (
                <div className="mb-4 p-3 rounded-xl bg-red-950/80 border border-red-500/50 text-red-200 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {submitted && (
                <div className="mb-4 p-3.5 rounded-2xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 text-xs flex items-center justify-between gap-2 shadow-lg">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                    <div>
                      <p className="font-bold text-white text-xs">¡Solicitud enviada a WhatsApp con éxito!</p>
                      <p className="text-[11px] text-emerald-300">El formulario ha sido restablecido y está listo para un nuevo registro.</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSubmitted(false)}
                    className="text-emerald-400 hover:text-white p-1 rounded-md cursor-pointer"
                    title="Cerrar aviso"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-3.5">
                {/* 💌 Nombre de quien envía */}
                <div>
                  <label className="block text-[11px] font-semibold text-[#F7EDC4] uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-red-400" />
                    💌 Nombre de quien envía *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder=""
                    className="w-full bg-white/[0.10] border border-white/25 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-300 focus:outline-none focus:ring-1 focus:ring-red-400 focus:border-red-400 focus:bg-white/[0.15]"
                  />
                </div>

                {/* Documento (Tipo + Número) */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-1">
                    <label className="block text-[11px] font-semibold text-[#F7EDC4] uppercase tracking-wider mb-1 flex items-center gap-1">
                      <CreditCard className="w-3.5 h-3.5 text-red-400" />
                      Tipo
                    </label>
                    <select
                      value={documentType}
                      onChange={(e) => setDocumentType(e.target.value)}
                      className="w-full bg-[#25151a] border border-white/25 rounded-xl px-2.5 py-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-red-400 focus:border-red-400"
                    >
                      <option value="DNI" className="bg-[#25151a]">DNI</option>
                      <option value="CE" className="bg-[#25151a]">Carnet Ext.</option>
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[11px] font-semibold text-[#F7EDC4] uppercase tracking-wider mb-1">
                      N° de Documento de quien envía *
                    </label>
                    <input
                      type="text"
                      required
                      value={documentNumber}
                      onChange={(e) => setDocumentNumber(e.target.value)}
                      placeholder=""
                      className="w-full bg-white/[0.10] border border-white/25 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-300 focus:outline-none focus:ring-1 focus:ring-red-400 focus:border-red-400 focus:bg-white/[0.15]"
                    />
                  </div>
                </div>

                {/* Teléfono / WhatsApp y Correo */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-semibold text-[#F7EDC4] uppercase tracking-wider mb-1 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-red-400" />
                      Celular de quien envía *
                    </label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder=""
                      className="w-full bg-white/[0.10] border border-white/25 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-300 focus:outline-none focus:ring-1 focus:ring-red-400 focus:border-red-400 focus:bg-white/[0.15]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-[#F7EDC4] uppercase tracking-wider mb-1 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-red-400" />
                      Correo Electrónico (Opcional)
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder=""
                      className="w-full bg-white/[0.10] border border-white/25 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-300 focus:outline-none focus:ring-1 focus:ring-red-400 focus:border-red-400 focus:bg-white/[0.15]"
                    />
                  </div>
                </div>

                {/* BLOQUE: DATOS DE ENTREGA Y DESTINATARIO */}
                <div className="bg-white/[0.06] border border-white/15 rounded-2xl p-3.5 space-y-3">
                  <div className="flex items-center gap-2 pb-1 border-b border-white/15">
                    <Gift className="w-4 h-4 text-red-400" />
                    <span className="text-[11px] font-bold uppercase tracking-wider text-white">
                      Destinatario y Lugar de Entrega
                    </span>
                  </div>

                  {/* 🎁 Nombre de quien recibe y 📞 Celular de quien recibe */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-semibold text-[#F7EDC4] mb-1">
                        🎁 Nombre de quien recibe *
                      </label>
                      <input
                        type="text"
                        required
                        value={recipient}
                        onChange={(e) => setRecipient(e.target.value)}
                        placeholder=""
                        className="w-full bg-white/[0.10] border border-white/25 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-300 focus:outline-none focus:ring-1 focus:ring-red-400 focus:border-red-400 focus:bg-white/[0.15]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-[#F7EDC4] mb-1">
                        📞 Celular de quien recibe
                      </label>
                      <input
                        type="tel"
                        value={recipientPhone}
                        onChange={(e) => setRecipientPhone(e.target.value)}
                        placeholder=""
                        className="w-full bg-white/[0.10] border border-white/25 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-300 focus:outline-none focus:ring-1 focus:ring-red-400 focus:border-red-400 focus:bg-white/[0.15]"
                      />
                    </div>
                  </div>

                  {/* 📍 Dirección exacta y 🗺️ Referencia */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-semibold text-[#F7EDC4] mb-1 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-red-400" />
                        📍 Dirección exacta
                      </label>
                      <input
                        type="text"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder=""
                        className="w-full bg-white/[0.10] border border-white/25 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-300 focus:outline-none focus:ring-1 focus:ring-red-400 focus:border-red-400 focus:bg-white/[0.15]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-[#F7EDC4] mb-1 flex items-center gap-1">
                        <Compass className="w-3.5 h-3.5 text-red-400" />
                        🗺️ Referencia
                      </label>
                      <input
                        type="text"
                        value={reference}
                        onChange={(e) => setReference(e.target.value)}
                        placeholder=""
                        className="w-full bg-white/[0.10] border border-white/25 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-300 focus:outline-none focus:ring-1 focus:ring-red-400 focus:border-red-400 focus:bg-white/[0.15]"
                      />
                    </div>
                  </div>

                  {/* 💖 Dedicatoria (opcional) */}
                  <div>
                    <label className="block text-[11px] font-semibold text-[#F7EDC4] mb-1 flex items-center gap-1">
                      <Heart className="w-3.5 h-3.5 text-red-400" />
                      💖 Dedicatoria (opcional)
                    </label>
                    <input
                      type="text"
                      value={dedication}
                      onChange={(e) => setDedication(e.target.value)}
                      placeholder=""
                      className="w-full bg-white/[0.10] border border-white/25 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-300 focus:outline-none focus:ring-1 focus:ring-red-400 focus:border-red-400 focus:bg-white/[0.15]"
                    />
                  </div>
                </div>

                {/* Fecha Cumpleaños y Ciudad */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-semibold text-[#F7EDC4] uppercase tracking-wider mb-1 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-red-400" />
                      Fecha de Cumpleaños
                    </label>
                    <input
                      type="date"
                      value={birthday}
                      onChange={(e) => setBirthday(e.target.value)}
                      className="w-full bg-white/[0.10] border border-white/25 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-300 focus:outline-none focus:ring-1 focus:ring-red-400 focus:border-red-400 [color-scheme:dark]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-[#F7EDC4] uppercase tracking-wider mb-1 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-red-400" />
                      Ciudad / Distrito
                    </label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder=""
                      className="w-full bg-white/[0.10] border border-white/25 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-300 focus:outline-none focus:ring-1 focus:ring-red-400 focus:border-red-400 focus:bg-white/[0.15]"
                    />
                  </div>
                </div>

                {/* Fechas Especiales dinámicas (N veces) */}
                <div className="bg-white/[0.06] border border-white/15 rounded-2xl p-3 sm:p-3.5 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-semibold text-[#F7EDC4] uppercase tracking-wider flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-red-400" />
                      Fechas Especiales (Opcional)
                    </label>
                    <button
                      type="button"
                      onClick={handleAddSpecialDate}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-600 hover:bg-red-500 text-white border border-red-400/40 text-[10px] font-semibold transition-all cursor-pointer shadow-xs"
                    >
                      <Plus className="w-3 h-3" />
                      <span>+ Agregar Fecha</span>
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-300">
                    Añade aniversarios o fechas importantes para preparar tus pedidos y sorpresas con anticipación.
                  </p>

                  {specialDates.length > 0 && (
                    <div className="space-y-2 pt-1">
                      {specialDates.map((item) => (
                        <div
                          key={item.id}
                          className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-2 rounded-xl bg-white/[0.08] border border-white/15 animate-in fade-in"
                        >
                          <div className="w-full sm:w-40 flex-shrink-0">
                            <input
                              type="date"
                              value={item.date}
                              onChange={(e) => handleUpdateSpecialDate(item.id, "date", e.target.value)}
                              className="w-full bg-white/[0.10] border border-white/20 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-red-400 [color-scheme:dark]"
                            />
                          </div>
                          <div className="flex-1">
                            <input
                              type="text"
                              value={item.occasion}
                              onChange={(e) => handleUpdateSpecialDate(item.id, "occasion", e.target.value)}
                              placeholder=""
                              className="w-full bg-white/[0.10] border border-white/20 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-300 focus:outline-none focus:ring-1 focus:ring-red-400"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveSpecialDate(item.id)}
                            className="p-1.5 text-slate-300 hover:text-red-400 self-end sm:self-auto transition-colors cursor-pointer"
                            title="Eliminar fecha"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {specialDates.length === 0 && (
                    <button
                      type="button"
                      onClick={handleAddSpecialDate}
                      className="w-full py-2 px-3 rounded-xl border border-dashed border-white/25 text-slate-300 hover:text-white hover:border-red-400 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5 text-red-400" />
                      <span>Haz clic para añadir una fecha especial</span>
                    </button>
                  )}
                </div>

                {/* Comentarios o Mensaje */}
                <div>
                  <label className="block text-[11px] font-semibold text-[#F7EDC4] uppercase tracking-wider mb-1">
                    Mensaje o Consulta adicional (Opcional)
                  </label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder=""
                    className="w-full bg-white/[0.10] border border-white/25 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-300 focus:outline-none focus:ring-1 focus:ring-red-400 resize-none"
                  />
                </div>

                {/* Botón de Envío Directo a WhatsApp */}
                <button
                  type="submit"
                  className="w-full mt-2 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white font-bold text-xs uppercase tracking-wider shadow-xl shadow-red-600/35 hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer border border-red-400/40"
                >
                  <Send className="w-4 h-4 text-white" />
                  <span>Enviar Solicitud a WhatsApp</span>
                </button>

                <p className="text-[10px] text-center text-slate-300 mt-2">
                  Al enviar la solicitud se abrirá una conversación en WhatsApp con nuestros asesores para formalizar tu registro.
                </p>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
