"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateClubSettings } from "@/actions/settings";
import {
  QrCode,
  ExternalLink,
  Phone,
  CheckCircle2,
  DollarSign,
  Wallet,
  Building2,
  Upload,
  Image as ImageIcon,
  X,
  Loader2,
  Plus,
  Trash2,
} from "lucide-react";

export interface BankAccountItem {
  id?: string;
  bankName: string;
  holderName: string;
  solesAccount?: string;
  dollarsAccount?: string;
  cci?: string;
}

const DEFAULT_BANKS: BankAccountItem[] = [
  {
    id: "bn",
    bankName: "Banco de la Nación",
    holderName: "Orison David Cometivos Rojas",
    solesAccount: "04-581-449904",
    dollarsAccount: "",
    cci: "",
  },
  {
    id: "bcp",
    bankName: "BCP",
    holderName: "Orison David Cometivos Rojas",
    solesAccount: "550-95549542-0-21",
    dollarsAccount: "550-09325458188",
    cci: "00255010932545818821",
  },
  {
    id: "interbank",
    bankName: "Interbank",
    holderName: "Orison David Cometivos Rojas",
    solesAccount: "8983150419001",
    dollarsAccount: "",
    cci: "",
  },
  {
    id: "bbva",
    bankName: "BBVA",
    holderName: "Liley Rojas Viena",
    solesAccount: "0011-0814-0203826899",
    dollarsAccount: "",
    cci: "",
  },
];

interface ClubSetting {
  id: string;
  qrRedirectUrl: string;
  catalogUrl: string;
  supportPhone: string;
  yapePhone?: string;
  yapeName?: string;
  yapeQrUrl?: string | null;
  plinPhone?: string;
  plinQrUrl?: string | null;
  bcpAccount?: string | null;
  bcpCci?: string | null;
  interbankAccount?: string | null;
  interbankCci?: string | null;
  bbvaAccount?: string | null;
  bbvaCci?: string | null;
  bankBeneficiary?: string | null;
  bankAccounts?: BankAccountItem[] | null;
  membershipPrice?: number;
}

interface SettingsFormProps {
  initialSettings: ClubSetting;
}

export function SettingsForm({ initialSettings }: SettingsFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    qrRedirectUrl: initialSettings.qrRedirectUrl || "https://rosapasionclub.com",
    catalogUrl: initialSettings.catalogUrl || "https://wa.me/51952226282",
    supportPhone: initialSettings.supportPhone || "51952226282",
    yapePhone: initialSettings.yapePhone || "952 226 282",
    yapeName: initialSettings.yapeName || "Rosa Pasión Flores y Detalles",
    yapeQrUrl: initialSettings.yapeQrUrl || "/yape-qr.png",
    plinPhone: initialSettings.plinPhone || "952 226 282",
    plinQrUrl: initialSettings.plinQrUrl || "/plin-qr.png",
    bcpAccount: initialSettings.bcpAccount || "550-95549542-0-21",
    bcpCci: initialSettings.bcpCci || "00255010932545818821",
    interbankAccount: initialSettings.interbankAccount || "8983150419001",
    interbankCci: initialSettings.interbankCci || "",
    bbvaAccount: initialSettings.bbvaAccount || "0011-0814-0203826899",
    bbvaCci: initialSettings.bbvaCci || "",
    bankBeneficiary: initialSettings.bankBeneficiary || "Orison David Cometivos Rojas",
    bankAccounts:
      initialSettings.bankAccounts && initialSettings.bankAccounts.length > 0
        ? initialSettings.bankAccounts
        : DEFAULT_BANKS,
    membershipPrice: initialSettings.membershipPrice ?? 29.0,
  });

  const handleBankChange = (index: number, field: keyof BankAccountItem, value: string) => {
    const updated = [...formData.bankAccounts];
    updated[index] = { ...updated[index], [field]: value };
    setFormData((prev) => ({ ...prev, bankAccounts: updated }));
  };

  const handleAddBank = () => {
    setFormData((prev) => ({
      ...prev,
      bankAccounts: [
        ...prev.bankAccounts,
        {
          id: `bank-${Date.now()}`,
          bankName: "",
          holderName: "",
          solesAccount: "",
          dollarsAccount: "",
          cci: "",
        },
      ],
    }));
  };

  const handleRemoveBank = (index: number) => {
    if (formData.bankAccounts.length <= 1) {
      alert("Debe mantener al menos una cuenta bancaria registrada.");
      return;
    }
    const updated = formData.bankAccounts.filter((_, i) => i !== index);
    setFormData((prev) => ({ ...prev, bankAccounts: updated }));
  };

  const [uploadingQr, setUploadingQr] = useState<"YAPE" | "PLIN" | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleUploadQrFile = (type: "YAPE" | "PLIN", e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("La imagen no debe superar los 5MB.");
      return;
    }

    setUploadingQr(type);
    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const base64Data = reader.result as string;
        const res = await fetch("/api/upload-voucher", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            base64Data,
            filename: `qr-${type.toLowerCase()}`,
          }),
        });
        const json = await res.json();
        if (json.success && json.url) {
          if (type === "YAPE") {
            setFormData((prev) => ({ ...prev, yapeQrUrl: json.url }));
          } else {
            setFormData((prev) => ({ ...prev, plinQrUrl: json.url }));
          }
        } else {
          alert(json.error || "Error al subir imagen");
        }
      } catch (err) {
        console.error("Error al subir QR:", err);
        alert("Ocurrió un error al subir la imagen del QR.");
      } finally {
        setUploadingQr(null);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);
    setIsError(false);

    startTransition(async () => {
      const res = await updateClubSettings(formData as any);
      if (res.success) {
        setStatusMessage("Configuraciones guardadas y sincronizadas exitosamente.");
        setIsError(false);
        router.refresh();
      } else {
        setStatusMessage(res.message || "Error al actualizar configuraciones.");
        setIsError(true);
      }
    });
  };

  return (
    <div className="w-full space-y-6">
      {/* Cabecera con Botón de Guardar Rápido */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <h2 className="text-2xl font-serif font-bold text-stone-900 tracking-tight">
            Configuración General & 3 Opciones de Pago
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Sube los códigos QR de Yape y Plin directamente como imagen, edita cuentas bancarias y precio de membresía
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            const form = document.querySelector("form");
            if (form) form.requestSubmit();
          }}
          disabled={isPending || uploadingQr !== null}
          className="self-start sm:self-auto px-6 py-2.5 rounded-full bg-gradient-to-r from-[#C59B27] via-[#E5C058] to-[#C59B27] hover:brightness-105 text-[#2F070E] font-bold text-xs uppercase tracking-wider shadow-md transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
        >
          {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
          <span>{isPending ? "Guardando..." : "Guardar Cambios"}</span>
        </button>
      </div>

      {statusMessage && (
        <div
          className={`p-4 rounded-xl text-xs flex items-center gap-2.5 shadow-sm ${
            isError
              ? "bg-red-50 border border-red-200 text-red-700"
              : "bg-emerald-50 border border-emerald-200 text-emerald-800"
          }`}
        >
          {!isError && <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />}
          <span>{statusMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* === COLUMNA 1: BILLETERAS DIGITALES (YAPE Y PLIN) === */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-6 space-y-5">
              <div className="border-b border-stone-100 pb-3 flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-stone-700 flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-[#8C0303]" />
                  Opciones 1 & 2: Yape y Plin (Subida de QR)
                </h3>
                <span className="text-[11px] text-stone-400">Imágenes QR Oficiales</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* === SUBIDA QR YAPE === */}
                <div className="bg-purple-50/50 border border-purple-200/80 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-purple-900 flex items-center gap-1.5">
                      <span>🟣</span> Código QR de Yape
                    </span>
                    {uploadingQr === "YAPE" && (
                      <span className="text-[10px] text-purple-700 font-semibold flex items-center gap-1">
                        <Loader2 className="w-3 h-3 animate-spin" /> Subiendo...
                      </span>
                    )}
                  </div>

                  {/* Previsualización del QR Yape */}
                  <div className="flex items-center gap-3">
                    <div className="w-24 h-24 bg-white border-2 border-purple-300 rounded-xl p-1 shadow-sm flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {formData.yapeQrUrl ? (
                        <img
                          src={formData.yapeQrUrl}
                          alt="QR Yape"
                          className="w-full h-full object-contain rounded-lg"
                        />
                      ) : (
                        <ImageIcon className="w-8 h-8 text-stone-300" />
                      )}
                    </div>

                    <div className="space-y-1.5 flex-1 min-w-0">
                      <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#742384] hover:bg-[#5E1A6B] text-white text-xs font-bold shadow-xs cursor-pointer transition">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Subir Imagen QR</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleUploadQrFile("YAPE", e)}
                          className="hidden"
                        />
                      </label>
                      <p className="text-[10px] text-stone-500 leading-tight">
                        Captura o foto del QR oficial (PNG, JPG o WEBP).
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-800 mb-1">
                      Número Oficial Yape
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.yapePhone}
                      onChange={(e) => setFormData({ ...formData, yapePhone: e.target.value })}
                      className="w-full bg-white border border-stone-300 rounded-lg px-3.5 py-2 text-xs text-stone-900 focus:outline-none focus:ring-1 focus:ring-[#742384]"
                    />
                  </div>
                </div>

                {/* === SUBIDA QR PLIN === */}
                <div className="bg-cyan-50/50 border border-cyan-200/80 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-cyan-900 flex items-center gap-1.5">
                      <span>🔵</span> Código QR de Plin
                    </span>
                    {uploadingQr === "PLIN" && (
                      <span className="text-[10px] text-cyan-700 font-semibold flex items-center gap-1">
                        <Loader2 className="w-3 h-3 animate-spin" /> Subiendo...
                      </span>
                    )}
                  </div>

                  {/* Previsualización del QR Plin */}
                  <div className="flex items-center gap-3">
                    <div className="w-24 h-24 bg-white border-2 border-cyan-300 rounded-xl p-1 shadow-sm flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {formData.plinQrUrl ? (
                        <img
                          src={formData.plinQrUrl}
                          alt="QR Plin"
                          className="w-full h-full object-contain rounded-lg"
                        />
                      ) : (
                        <ImageIcon className="w-8 h-8 text-stone-300" />
                      )}
                    </div>

                    <div className="space-y-1.5 flex-1 min-w-0">
                      <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#00B4D8] hover:bg-[#0096B4] text-white text-xs font-bold shadow-xs cursor-pointer transition">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Subir Imagen QR</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleUploadQrFile("PLIN", e)}
                          className="hidden"
                        />
                      </label>
                      <p className="text-[10px] text-stone-500 leading-tight">
                        Captura o foto del QR oficial (PNG, JPG o WEBP).
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-800 mb-1">
                      Número Oficial Plin
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.plinPhone}
                      onChange={(e) => setFormData({ ...formData, plinPhone: e.target.value })}
                      className="w-full bg-white border border-stone-300 rounded-lg px-3.5 py-2 text-xs text-stone-900 focus:outline-none focus:ring-1 focus:ring-[#00B4D8]"
                    />
                  </div>
                </div>

                {/* Titular Yape / Plin */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-stone-800 mb-1">
                    Titular de Yape / Plin (Nombre del Negocio o Titular)
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.yapeName}
                    onChange={(e) => setFormData({ ...formData, yapeName: e.target.value })}
                    className="w-full bg-white border border-stone-300 rounded-lg px-3.5 py-2 text-xs text-stone-900 focus:outline-none focus:ring-1 focus:ring-[#8C0303]"
                  />
                </div>
              </div>
            </div>

            {/* SECCIÓN 4: PRECIO DE MEMBRESÍA */}
            <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-6">
              <div className="border-b border-stone-100 pb-3 mb-4 flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-stone-700 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-emerald-700" />
                  Precio Oficial de Membresía
                </h3>
                <span className="text-[11px] text-stone-400">Renovación Mensual</span>
              </div>
              <div className="max-w-md">
                <label className="block text-xs font-bold text-stone-800 mb-1">
                  Monto a Pagar en Soles (S/)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-stone-400">
                    S/
                  </span>
                  <input
                    type="number"
                    step="0.5"
                    required
                    value={formData.membershipPrice}
                    onChange={(e) => setFormData({ ...formData, membershipPrice: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-white border border-stone-300 rounded-lg pl-9 pr-3.5 py-2 text-sm text-stone-900 font-mono font-bold focus:outline-none focus:ring-1 focus:ring-[#8C0303]"
                  />
                </div>
                <p className="text-[11px] text-stone-500 mt-1">
                  Este precio se sincroniza en vivo en el modal de renovación de la web pública.
                </p>
              </div>
            </div>
          </div>

          {/* === COLUMNA 2: ENLACES GENERALES & CUENTAS BANCARIAS === */}
          <div className="space-y-6">
            {/* SECCIÓN 1: QR & ENLACES */}
            <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-6 space-y-4">
              <div className="border-b border-stone-100 pb-3 flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-stone-700 flex items-center gap-2">
                  <QrCode className="w-4 h-4 text-[#8C0303]" />
                  Redirección QR & Enlaces Oficiales
                </h3>
                <span className="text-[11px] text-stone-400">Parámetros Globales</span>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <QrCode className="w-3.5 h-3.5 text-[#8C0303]" />
                    <label className="text-xs font-bold text-stone-800">
                      Destino del Código QR Maestro
                    </label>
                  </div>
                  <input
                    type="url"
                    required
                    value={formData.qrRedirectUrl}
                    onChange={(e) => setFormData({ ...formData, qrRedirectUrl: e.target.value })}
                    className="w-full bg-white border border-stone-300 rounded-lg px-3.5 py-2 text-xs text-stone-900 focus:outline-none focus:ring-1 focus:ring-[#8C0303]"
                  />
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <ExternalLink className="w-3.5 h-3.5 text-[#8C0303]" />
                    <label className="text-xs font-bold text-stone-800">
                      URL del Catálogo Oficial
                    </label>
                  </div>
                  <input
                    type="url"
                    required
                    value={formData.catalogUrl}
                    onChange={(e) => setFormData({ ...formData, catalogUrl: e.target.value })}
                    className="w-full bg-white border border-stone-300 rounded-lg px-3.5 py-2 text-xs text-stone-900 focus:outline-none focus:ring-1 focus:ring-[#8C0303]"
                  />
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Phone className="w-3.5 h-3.5 text-[#8C0303]" />
                    <label className="text-xs font-bold text-stone-800">
                      Teléfono WhatsApp de Soporte
                    </label>
                  </div>
                  <input
                    type="text"
                    required
                    value={formData.supportPhone}
                    onChange={(e) => setFormData({ ...formData, supportPhone: e.target.value })}
                    className="w-full bg-white border border-stone-300 rounded-lg px-3.5 py-2 text-xs text-stone-900 focus:outline-none focus:ring-1 focus:ring-[#8C0303]"
                  />
                </div>
              </div>
            </div>

            {/* SECCIÓN 3: CUENTAS BANCARIAS PARA TRANSFERENCIAS */}
            <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-6 space-y-4">
              <div className="border-b border-stone-100 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-stone-700 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-[#8C0303]" />
                    Opción 3: Cuentas Bancarias para Transferencias
                  </h3>
                  <p className="text-[11px] text-stone-500 mt-0.5">
                    Configura las cuentas en soles, dólares y el titular específico de cada banco.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddBank}
                  className="self-start sm:self-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FAF2E8] hover:bg-[#F3E5D0] text-[#800C1B] text-xs font-bold border border-[#D4AF37]/40 shadow-xs cursor-pointer transition"
                >
                  <Plus className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>+ Agregar Cuenta Bancaria</span>
                </button>
              </div>

              {/* Lista dinámica de cuentas bancarias */}
              <div className="space-y-4">
                {formData.bankAccounts.map((bank, index) => (
                  <div
                    key={bank.id || index}
                    className="p-4 rounded-xl border border-stone-200 bg-stone-50/50 hover:bg-stone-50 transition-colors space-y-3"
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-stone-200/60">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-[#8C0303] text-[#F3E5AB] text-xs font-bold flex items-center justify-center">
                          {index + 1}
                        </span>
                        <input
                          type="text"
                          required
                          value={bank.bankName}
                          onChange={(e) => handleBankChange(index, "bankName", e.target.value)}
                          placeholder=""
                          className="font-bold text-xs text-stone-900 bg-white border border-stone-300 rounded-md px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-[#8C0303]"
                        />
                      </div>

                      {formData.bankAccounts.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveBank(index)}
                          className="text-stone-400 hover:text-red-600 p-1 rounded-md hover:bg-red-50 transition cursor-pointer"
                          title="Eliminar esta cuenta"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {/* Titular */}
                      <div className="md:col-span-2">
                        <label className="block text-[11px] font-bold text-stone-700 mb-1">
                          Titular de la Cuenta (Nombre de a quién pertenece) *
                        </label>
                        <input
                          type="text"
                          required
                          value={bank.holderName}
                          onChange={(e) => handleBankChange(index, "holderName", e.target.value)}
                          placeholder=""
                          className="w-full bg-white border border-stone-300 rounded-lg px-3 py-1.5 text-xs text-stone-900 focus:outline-none focus:ring-1 focus:ring-[#8C0303]"
                        />
                      </div>

                      {/* Cuenta en Soles */}
                      <div>
                        <label className="block text-[11px] font-bold text-stone-700 mb-1">
                          N° de Cuenta en Soles (S/) *
                        </label>
                        <input
                          type="text"
                          value={bank.solesAccount || ""}
                          onChange={(e) => handleBankChange(index, "solesAccount", e.target.value)}
                          placeholder=""
                          className="w-full bg-white border border-stone-300 rounded-lg px-3 py-1.5 text-xs font-mono text-stone-900 focus:outline-none focus:ring-1 focus:ring-[#8C0303]"
                        />
                      </div>

                      {/* Cuenta en Dólares */}
                      <div>
                        <label className="block text-[11px] font-bold text-stone-700 mb-1">
                          N° de Cuenta en Dólares ($) (Opcional)
                        </label>
                        <input
                          type="text"
                          value={bank.dollarsAccount || ""}
                          onChange={(e) => handleBankChange(index, "dollarsAccount", e.target.value)}
                          placeholder=""
                          className="w-full bg-white border border-stone-300 rounded-lg px-3 py-1.5 text-xs font-mono text-stone-900 focus:outline-none focus:ring-1 focus:ring-[#8C0303]"
                        />
                      </div>

                      {/* CCI */}
                      <div className="md:col-span-2">
                        <label className="block text-[11px] font-bold text-stone-700 mb-1">
                          CCI (Código de Cuenta Interbancario) (Opcional)
                        </label>
                        <input
                          type="text"
                          value={bank.cci || ""}
                          onChange={(e) => handleBankChange(index, "cci", e.target.value)}
                          placeholder=""
                          className="w-full bg-white border border-stone-300 rounded-lg px-3 py-1.5 text-xs font-mono text-stone-900 focus:outline-none focus:ring-1 focus:ring-[#8C0303]"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* BARRA INFERIOR DE ACCIÓN */}
        <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-stone-500">
            Los cambios guardados se reflejan inmediatamente en la web pública y en el modal de renovación.
          </p>
          <button
            type="submit"
            disabled={isPending || uploadingQr !== null}
            className="w-full sm:w-auto px-8 py-3 rounded-full bg-gradient-to-r from-[#C59B27] via-[#E5C058] to-[#C59B27] hover:brightness-105 text-[#2F070E] font-bold text-xs uppercase tracking-wider shadow-md transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>{isPending ? "Guardando..." : "Guardar y Publicar Cambios"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
