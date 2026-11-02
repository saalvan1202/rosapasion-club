"use client";

import React, { useState } from "react";
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
  const [city, setCity] = useState("Tacna");
  const [recipient, setRecipient] = useState("");
  const [address, setAddress] = useState("");
  const [reference, setReference] = useState("");
  const [specialDates, setSpecialDates] = useState<SpecialDate[]>([]);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

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
      "🌟 *SOLICITUD DE MEMBRESÍA - ROSA PASIÓN CLUB* 🌟",
      "",
      "¡Hola Rosa Pasión! Deseo unirme al club exclusivo de socios y solicitar mi tarjeta.",
      "",
      `👤 *Nombre y Apellidos:* ${name.trim()}`,
      `🪪 *Documento:* ${documentType} ${documentNumber.trim()}`,
      `📱 *Celular / WhatsApp:* ${phone.trim()}`,
      email.trim() ? `✉️ *Correo:* ${email.trim()}` : null,
      formattedBirthday ? `🎂 *Cumpleaños:* ${formattedBirthday}` : null,
      city.trim() ? `📍 *Ciudad / Distrito:* ${city.trim()}` : null,
      recipient.trim() ? `💐 *Destinatario de las Flores:* ${recipient.trim()}` : null,
      address.trim() ? `🏠 *Dirección de Entrega:* ${address.trim()}` : null,
      reference.trim() ? `🧭 *Referencia:* ${reference.trim()}` : null,
      validSpecialDates.length > 0 ? "" : null,
      validSpecialDates.length > 0 ? "📅 *Fechas Especiales Registradas:*" : null,
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
      "💳 *Por favor, confírmenme para la activación de mi membresía y tarjeta digital.* ¡Muchas gracias!",
    ].filter(Boolean);

    const fullMessage = messageLines.join("\n");
    const waUrl = `https://wa.me/${waNumber}?text=${encodeURIComponent(fullMessage)}`;

    setSubmitted(true);
    window.open(waUrl, "_blank");
  };

  return (
    <section id="solicitar-membresia" className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto scroll-mt-20">
      <div className="relative rounded-3xl overflow-hidden border-2 border-[#D4AF37]/40 bg-gradient-to-br from-[#3D0710] via-[#230408] to-[#160205] shadow-2xl p-6 sm:p-10 lg:p-12">
        {/* Glow & ambient circles */}
        <div className="absolute -top-32 -left-32 w-80 h-80 bg-red-950/40 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none" />

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

            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#5A0C18]/80 border border-[#D4AF37]/50 text-[#EEDC94] text-xs font-semibold tracking-wider uppercase">
              <Crown className="w-3.5 h-3.5 text-[#D4AF37]" />
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
                <div className="w-8 h-8 rounded-full bg-[#5A0C18] border border-[#D4AF37]/40 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Sparkles className="w-4 h-4 text-[#EEDC94]" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Descuentos Inmediatos</h4>
                  <p className="text-xs text-stone-300">
                    Ahorra en restaurantes, salones de belleza, cafeterías, moda y más.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3 text-left">
                <div className="w-8 h-8 rounded-full bg-[#5A0C18] border border-[#D4AF37]/40 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Gift className="w-4 h-4 text-[#EEDC94]" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Sorpresas y Detalles</h4>
                  <p className="text-xs text-stone-300">
                    Beneficios preferenciales en arreglos florales y regalos para tus ocasiones especiales.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3 text-left">
                <div className="w-8 h-8 rounded-full bg-[#5A0C18] border border-[#D4AF37]/40 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <ShieldCheck className="w-4 h-4 text-[#EEDC94]" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Tarjeta Digital Personal e Intransferible</h4>
                  <p className="text-xs text-stone-300">
                    Accede a tu código de socio en línea desde cualquier dispositivo con tu DNI.
                  </p>
                </div>
              </div>
            </div>

            {/* Nota de soporte directo */}
            <div className="p-3.5 rounded-2xl bg-[#230408]/80 border border-[#D4AF37]/30 text-xs text-stone-300 flex items-center justify-center lg:justify-start gap-2">
              <Phone className="w-4 h-4 text-[#D4AF37] flex-shrink-0" />
              <span>
                Atención vía WhatsApp: <strong className="text-[#EEDC94]">{supportPhone}</strong>
              </span>
            </div>
          </div>

          {/* COLUMNA DERECHA: FORMULARIO DE SOLICITUD */}
          <div className="lg:col-span-6">
            <div className="bg-gradient-to-b from-[#2E050B] via-[#230408] to-[#180306] rounded-3xl p-6 sm:p-8 border-2 border-[#D4AF37]/60 shadow-2xl text-white relative">
              <div className="mb-5 text-center lg:text-left">
                <h3 className="text-xl font-serif font-bold gold-gradient-text">
                  Solicitar Membresía de Socio
                </h3>
                <p className="text-xs text-stone-300 mt-1">
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
                <div className="mb-4 p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>
                    ¡Mensaje preparado! Se abrió WhatsApp para enviar tus datos a nuestro equipo.
                  </span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-3.5">
                {/* Nombre Completo */}
                <div>
                  <label className="block text-[11px] font-semibold text-[#EEDC94] uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-[#D4AF37]" />
                    Nombre y Apellidos *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ej: Valeria Mendoza Ríos"
                    className="w-full bg-[#1A0306] border border-[#D4AF37]/40 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-stone-500 focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                  />
                </div>

                {/* Documento (Tipo + Número) */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-1">
                    <label className="block text-[11px] font-semibold text-[#EEDC94] uppercase tracking-wider mb-1 flex items-center gap-1">
                      <CreditCard className="w-3.5 h-3.5 text-[#D4AF37]" />
                      Tipo
                    </label>
                    <select
                      value={documentType}
                      onChange={(e) => setDocumentType(e.target.value)}
                      className="w-full bg-[#1A0306] border border-[#D4AF37]/40 rounded-xl px-2.5 py-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                    >
                      <option value="DNI" className="bg-[#230408]">DNI</option>
                      <option value="CE" className="bg-[#230408]">Carnet Ext.</option>
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[11px] font-semibold text-[#EEDC94] uppercase tracking-wider mb-1">
                      N° de Documento *
                    </label>
                    <input
                      type="text"
                      required
                      value={documentNumber}
                      onChange={(e) => setDocumentNumber(e.target.value)}
                      placeholder="Ej: 71234567"
                      className="w-full bg-[#1A0306] border border-[#D4AF37]/40 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-stone-500 focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                    />
                  </div>
                </div>

                {/* Teléfono / WhatsApp y Correo */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-semibold text-[#EEDC94] uppercase tracking-wider mb-1 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-[#D4AF37]" />
                      Celular / WhatsApp *
                    </label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Ej: 952 123 456"
                      className="w-full bg-[#1A0306] border border-[#D4AF37]/40 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-stone-500 focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-[#EEDC94] uppercase tracking-wider mb-1 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-[#D4AF37]" />
                      Correo Electrónico (Opcional)
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="tu@correo.com"
                      className="w-full bg-[#1A0306] border border-[#D4AF37]/40 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-stone-500 focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                    />
                  </div>
                </div>

                {/* Fecha Cumpleaños y Ciudad */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-semibold text-[#EEDC94] uppercase tracking-wider mb-1 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-[#D4AF37]" />
                      Fecha de Cumpleaños (Opcional)
                    </label>
                    <input
                      type="date"
                      value={birthday}
                      onChange={(e) => setBirthday(e.target.value)}
                      className="w-full bg-[#1A0306] border border-[#D4AF37]/40 rounded-xl px-3.5 py-2 text-xs text-white placeholder-stone-500 focus:outline-none focus:ring-1 focus:ring-[#D4AF37] [color-scheme:dark]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-[#EEDC94] uppercase tracking-wider mb-1 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#D4AF37]" />
                      Ciudad / Distrito
                    </label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Ej: Tacna, Cercado"
                      className="w-full bg-[#1A0306] border border-[#D4AF37]/40 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-stone-500 focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                    />
                  </div>
                </div>

                {/* Destinatario de las Flores */}
                <div>
                  <label className="block text-[11px] font-semibold text-[#EEDC94] uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <Heart className="w-3.5 h-3.5 text-[#D4AF37]" />
                    ¿A quién van dirigidas las flores? (Opcional)
                  </label>
                  <input
                    type="text"
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    placeholder="Ej: Mi esposa Valeria, Mi mamá, Pareja, etc."
                    className="w-full bg-[#1A0306] border border-[#D4AF37]/40 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-stone-500 focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                  />
                </div>

                {/* Dirección de Entrega y Referencia */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-semibold text-[#EEDC94] uppercase tracking-wider mb-1 flex items-center gap-1.5">
                      <Home className="w-3.5 h-3.5 text-[#D4AF37]" />
                      Dirección de Entrega (Opcional)
                    </label>
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Ej: Av. Bolognesi 1234, Dpto 301"
                      className="w-full bg-[#1A0306] border border-[#D4AF37]/40 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-stone-500 focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-[#EEDC94] uppercase tracking-wider mb-1 flex items-center gap-1.5">
                      <Compass className="w-3.5 h-3.5 text-[#D4AF37]" />
                      Referencia (Opcional)
                    </label>
                    <input
                      type="text"
                      value={reference}
                      onChange={(e) => setReference(e.target.value)}
                      placeholder="Ej: Frente al parque, reja blanca"
                      className="w-full bg-[#1A0306] border border-[#D4AF37]/40 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-stone-500 focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                    />
                  </div>
                </div>

                {/* Fechas Especiales dinámicas (N veces) */}
                <div className="bg-[#140205]/70 border border-[#D4AF37]/30 rounded-2xl p-3 sm:p-3.5 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-semibold text-[#EEDC94] uppercase tracking-wider flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-[#D4AF37]" />
                      Fechas Especiales (Opcional)
                    </label>
                    <button
                      type="button"
                      onClick={handleAddSpecialDate}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#5A0C18] hover:bg-[#720E1E] text-[#EEDC94] border border-[#D4AF37]/40 text-[10px] font-semibold transition-all cursor-pointer shadow-xs"
                    >
                      <Plus className="w-3 h-3" />
                      <span>+ Agregar Fecha</span>
                    </button>
                  </div>
                  <p className="text-[10px] text-stone-400">
                    Añade aniversarios o fechas importantes para preparar tus pedidos y sorpresas con anticipación.
                  </p>

                  {specialDates.length > 0 && (
                    <div className="space-y-2 pt-1">
                      {specialDates.map((item) => (
                        <div
                          key={item.id}
                          className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-2 rounded-xl bg-[#1A0306] border border-[#D4AF37]/25 animate-in fade-in"
                        >
                          <div className="w-full sm:w-40 flex-shrink-0">
                            <input
                              type="date"
                              value={item.date}
                              onChange={(e) => handleUpdateSpecialDate(item.id, "date", e.target.value)}
                              className="w-full bg-[#230408] border border-[#D4AF37]/30 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#D4AF37] [color-scheme:dark]"
                            />
                          </div>
                          <div className="flex-1">
                            <input
                              type="text"
                              value={item.occasion}
                              onChange={(e) => handleUpdateSpecialDate(item.id, "occasion", e.target.value)}
                              placeholder="Motivo: Ej. Aniversario, Cumpleaños mamá"
                              className="w-full bg-[#230408] border border-[#D4AF37]/30 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-stone-500 focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveSpecialDate(item.id)}
                            className="p-1.5 text-stone-400 hover:text-red-400 self-end sm:self-auto transition-colors cursor-pointer"
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
                      className="w-full py-2 px-3 rounded-xl border border-dashed border-[#D4AF37]/40 text-stone-400 hover:text-[#EEDC94] hover:border-[#D4AF37] text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5 text-[#D4AF37]" />
                      <span>Haz clic para añadir una fecha especial</span>
                    </button>
                  )}
                </div>

                {/* Comentarios o Mensaje */}
                <div>
                  <label className="block text-[11px] font-semibold text-[#EEDC94] uppercase tracking-wider mb-1">
                    Mensaje o Consulta adicional (Opcional)
                  </label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="¿Alguna consulta sobre los beneficios o convenios?"
                    className="w-full bg-[#1A0306] border border-[#D4AF37]/40 rounded-xl px-3.5 py-2 text-xs text-white placeholder-stone-500 focus:outline-none focus:ring-1 focus:ring-[#D4AF37] resize-none"
                  />
                </div>

                {/* Botón de Envío Directo a WhatsApp */}
                <button
                  type="submit"
                  className="w-full mt-2 py-3.5 px-6 rounded-2xl gold-gradient-bg text-[#230408] font-bold text-xs uppercase tracking-wider shadow-xl hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer border border-[#D4AF37]/60"
                >
                  <Send className="w-4 h-4 text-[#230408]" />
                  <span>Enviar Solicitud a WhatsApp</span>
                </button>

                <p className="text-[10px] text-center text-stone-400 mt-2">
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
