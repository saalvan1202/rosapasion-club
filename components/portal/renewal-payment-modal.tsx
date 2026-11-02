"use client";

import React, { useState, useEffect, useMemo, useTransition } from "react";
import {
  X,
  CreditCard,
  QrCode,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Upload,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Smartphone,
  ExternalLink,
  Building2,
  ZoomIn,
  Gift,
} from "lucide-react";
import { submitRenewalPayment } from "@/actions/payment";
import { lookupMemberByDocOrCode } from "@/actions/redemption";

interface RenewalPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialMember?: {
    name: string;
    code: string;
    documentNumber?: string | null;
    phone?: string | null;
    status: string;
    validUntil?: string;
  } | null;
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
  bankAccounts?: Array<{
    id?: string;
    bankName: string;
    holderName: string;
    solesAccount?: string;
    dollarsAccount?: string;
    cci?: string;
  }> | null;
  membershipPrice?: number;
}

export function RenewalPaymentModal({
  isOpen,
  onClose,
  onSuccess,
  initialMember,
  yapePhone = "952 226 282",
  yapeName = "Rosa Pasión Flores y Detalles",
  yapeQrUrl = "/yape-qr.png",
  plinPhone = "952 226 282",
  plinQrUrl = "/plin-qr.png",
  bcpAccount = "355-98231456-0-12",
  bcpCci = "002-355-009823145601-28",
  interbankAccount = "200-3001234567",
  interbankCci = "003-200-003001234567-19",
  bbvaAccount = "0011-0175-0200987654",
  bbvaCci = "011-175-000200987654-88",
  bankBeneficiary = "Rosa Pasión Flores y Detalles",
  bankAccounts,
  membershipPrice = 29.0,
}: RenewalPaymentModalProps) {
  const activeBankAccounts = useMemo(() => {
    if (bankAccounts && bankAccounts.length > 0) {
      return bankAccounts;
    }
    return [
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
        solesAccount: bcpAccount || "550-95549542-0-21",
        dollarsAccount: "550-09325458188",
        cci: bcpCci || "00255010932545818821",
      },
      {
        id: "interbank",
        bankName: "Interbank",
        holderName: "Orison David Cometivos Rojas",
        solesAccount: interbankAccount || "8983150419001",
        dollarsAccount: "",
        cci: interbankCci || "",
      },
      {
        id: "bbva",
        bankName: "BBVA",
        holderName: "Liley Rojas Viena",
        solesAccount: bbvaAccount || "0011-0814-0203826899",
        dollarsAccount: "",
        cci: bbvaCci || "",
      },
    ];
  }, [bankAccounts, bcpAccount, bcpCci, interbankAccount, interbankCci, bbvaAccount, bbvaCci]);

  const [documentNumber, setDocumentNumber] = useState(
    initialMember?.documentNumber || initialMember?.code || ""
  );
  const [memberName, setMemberName] = useState(initialMember?.name || "");
  const [phone, setPhone] = useState(initialMember?.phone || "");
  const [paymentMethod, setPaymentMethod] = useState<"YAPE" | "PLIN" | "TRANSFERENCIA">("YAPE");
  const [selectedBankIndex, setSelectedBankIndex] = useState(0);

  // Datos de entrega y destinatario
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryReference, setDeliveryReference] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [senderName, setSenderName] = useState("");
  const [dedication, setDedication] = useState("");

  const [operationNumber, setOperationNumber] = useState("");
  const [voucherFile, setVoucherFile] = useState<File | null>(null);
  const [voucherPreview, setVoucherPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [zoomedQr, setZoomedQr] = useState<string | null>(null);
  const [dynamicQr, setDynamicQr] = useState<string | null>(null);
  const [imgError, setImgError] = useState(false);

  // Generar código QR dinámico de respaldo de alta fidelidad
  useEffect(() => {
    setImgError(false);
    const phoneToUse = paymentMethod === "YAPE" ? (yapePhone || "952 226 282") : (plinPhone || "952 226 282");
    const cleanDigits = phoneToUse.replace(/\D/g, "");
    const waOrPhone = cleanDigits.startsWith("51") ? cleanDigits : `51${cleanDigits}`;

    import("qrcode")
      .then((QRCode) => {
        QRCode.toDataURL(waOrPhone, {
          width: 320,
          margin: 1,
          color: {
            dark: paymentMethod === "YAPE" ? "#742384" : "#00B4D8",
            light: "#FFFFFF",
          },
        })
          .then(setDynamicQr)
          .catch(() => {});
      })
      .catch(() => {});
  }, [paymentMethod, yapePhone, plinPhone]);

  const [error, setError] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<{
    waDirectUrl: string;
    message: string;
    memberCode: string;
    memberName: string;
  } | null>(null);

  const [isPending, startTransition] = useTransition();

  // Autocompletar datos del socio al abrir el modal o cuando cambia initialMember
  useEffect(() => {
    if (isOpen && initialMember) {
      if (initialMember.documentNumber || initialMember.code) {
        setDocumentNumber(initialMember.documentNumber || initialMember.code);
      }
      if (initialMember.name) {
        setMemberName(initialMember.name);
      }
      if (initialMember.phone) {
        setPhone(initialMember.phone);
      }
    }
  }, [isOpen, initialMember]);

  if (!isOpen) return null;

  const handleCopy = (text: string, key: string) => {
    const clean = text.replace(/\s+/g, "");
    navigator.clipboard.writeText(clean);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Autocompletar dinámicamente si el socio tipea o cambia el DNI/Código
  const handleDocBlur = async () => {
    const doc = documentNumber.trim();
    if (!doc || doc.length < 5) return;
    if (memberName && phone) return; // ya completado

    try {
      setIsLookingUp(true);
      const res = await lookupMemberByDocOrCode(doc);
      if (res.found && res.member) {
        if (!memberName) setMemberName(res.member.name);
        if (!phone && res.member.phone) setPhone(res.member.phone);
      }
    } catch (err) {
      console.warn("Lookup silencioso no completado:", err);
    } finally {
      setIsLookingUp(false);
    }
  };

  const handleVoucherChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("La imagen no debe superar los 5MB.");
        return;
      }
      setVoucherFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setVoucherPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveVoucher = () => {
    setVoucherFile(null);
    setVoucherPreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!documentNumber.trim()) {
      setError("Por favor ingresa tu número de DNI o documento.");
      return;
    }

    if (!phone.trim()) {
      setError("Por favor ingresa tu número de celular para contactarte.");
      return;
    }

    if (!voucherFile && !operationNumber.trim()) {
      setError("Por favor adjunta la captura o foto del comprobante.");
      return;
    }

    startTransition(async () => {
      let uploadedVoucherUrl: string | undefined = undefined;

      // Subir archivo al endpoint público dedicado
      if (voucherFile && voucherPreview) {
        setIsUploading(true);
        try {
          const resUpload = await fetch("/api/upload-voucher", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              base64Data: voucherPreview,
              filename: `voucher-${documentNumber.trim()}-${paymentMethod.toLowerCase()}`,
            }),
          });
          const uploadJson = await resUpload.json();
          if (uploadJson.success && uploadJson.url) {
            uploadedVoucherUrl = uploadJson.url;
          }
        } catch (err) {
          console.warn("Error en subida de voucher a servidor:", err);
        } finally {
          setIsUploading(false);
        }
      }

      const currentBank = activeBankAccounts[selectedBankIndex];
      const selectedBankName = currentBank?.bankName || "BANCO";
      const paymentMethodName =
        paymentMethod === "TRANSFERENCIA"
          ? `TRANSFERENCIA (${selectedBankName})`
          : paymentMethod;

      const res = await submitRenewalPayment({
        documentNumber: documentNumber.trim(),
        memberName: memberName.trim() || initialMember?.name || "Socio Titular",
        phone: phone.trim(),
        paymentMethod: paymentMethodName,
        operationNumber: operationNumber.trim(),
        voucherUrl: uploadedVoucherUrl || voucherPreview || undefined,
        amount: membershipPrice,
        planName: "Membresía Mensual (30 Días)",
        deliveryAddress: deliveryAddress.trim() || undefined,
        deliveryReference: deliveryReference.trim() || undefined,
        recipientName: recipientName.trim() || undefined,
        recipientPhone: recipientPhone.trim() || undefined,
        senderName: senderName.trim() || undefined,
        dedication: dedication.trim() || undefined,
      });

      if (res.success && res.waDirectUrl) {
        setSuccessData({
          waDirectUrl: res.waDirectUrl,
          message: res.message,
          memberCode: res.memberCode,
          memberName: res.memberName,
        });
        // Notifica al portal para limpiar la búsqueda y proteger los datos del socio
        onSuccess?.();
      } else {
        setError(res.message || "Error al registrar el comprobante.");
      }
    });
  };

  const handleClose = () => {
    const wasSuccess = Boolean(successData);
    setError(null);
    setSuccessData(null);
    setVoucherFile(null);
    setVoucherPreview(null);
    setZoomedQr(null);
    onClose();
    if (wasSuccess) {
      onSuccess?.();
    }
  };

  const configuredQr = paymentMethod === "YAPE" ? yapeQrUrl : plinQrUrl;
  const currentQrImage =
    (!imgError && configuredQr && !configuredQr.includes("test"))
      ? configuredQr
      : (dynamicQr || (paymentMethod === "YAPE" ? "/yape-qr.png" : "/plin-qr.png"));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      {/* Backdrop: No se cierra al hacer clic afuera para evitar pérdida de datos */}
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity" />

      <div className="relative w-full max-w-xl bg-gradient-to-b from-[#1A0204] via-[#0D0D0D] to-[#0D0D0D] rounded-3xl shadow-2xl border-2 border-[#8C0303]/60 text-white z-10 my-auto animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header Fijo */}
        <div className="flex-shrink-0 flex items-center justify-between px-5 sm:px-6 py-4 border-b border-[#8C0303]/40 bg-[#0D0D0D]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-[#8C0303] border border-[#F20519]/50 flex items-center justify-center shadow-inner">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-serif font-bold text-white tracking-wide">
                Renovación Rosa Pasión Club
              </h3>
              <p className="text-[11px] text-[#F7EDC4]/80">
                Elige tu opción de pago • 0% de comisiones adicionales
              </p>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="p-1.5 rounded-full text-stone-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* PANTALLA DE ÉXITO */}
        {successData ? (
          <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-6 space-y-5 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-950/80 border-2 border-emerald-500/60 mx-auto flex items-center justify-center shadow-lg animate-in zoom-in-50">
              <CheckCircle2 className="w-9 h-9 text-emerald-400" />
            </div>

            <div className="space-y-1.5">
              <h4 className="text-xl font-serif font-bold text-white">
                ¡Comprobante Recibido con Éxito!
              </h4>
              <p className="text-xs text-stone-300 max-w-sm mx-auto leading-relaxed">
                Hemos registrado tu solicitud de renovación para{" "}
                <strong className="text-[#F7EDC4]">{successData.memberName}</strong>.
                La verificación toma usualmente menos de 15 minutos.
              </p>
            </div>

            {/* Tarjeta de Código */}
            <div className="bg-black/40 border border-[#D4AF37]/40 rounded-2xl p-3.5 max-w-xs mx-auto">
              <p className="text-[10px] uppercase tracking-wider text-[#D4AF37] font-semibold">
                Código de Solicitud
              </p>
              <p className="font-mono text-base font-bold text-white tracking-widest mt-0.5">
                {successData.memberCode}
              </p>
            </div>

            {/* Botón WhatsApp de Activación Inmediata */}
            <div className="space-y-2 pt-2">
              <a
                href={successData.waDirectUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => {
                  onSuccess?.();
                }}
                className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider shadow-xl transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Avisar por WhatsApp para Activación Inmediata ⚡</span>
                <ExternalLink className="w-4 h-4" />
              </a>

              <button
                onClick={handleClose}
                className="w-full py-2.5 text-xs text-stone-400 hover:text-white underline cursor-pointer"
              >
                Cerrar y volver al portal
              </button>
            </div>
          </div>
        ) : (
          /* FORMULARIO DE PAGO: 3 OPCIONES */
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-5 sm:px-6 py-4 space-y-4">
            {/* 3 OPCIONES DE PAGO */}
            <div className="bg-gradient-to-br from-[#3D0710] to-[#1E0306] border border-[#D4AF37]/50 rounded-2xl p-4 shadow-inner space-y-4">
              {/* SELECTOR DE 3 OPCIONES */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="grid grid-cols-3 gap-1.5 w-full sm:w-auto">
                  {/* Opción 1: Yape */}
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("YAPE")}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5 ${
                      paymentMethod === "YAPE"
                        ? "bg-[#742384] text-white shadow-md ring-2 ring-purple-300"
                        : "bg-white/10 text-stone-300 hover:bg-white/15"
                    }`}
                  >
                    <span>🟣 Yape</span>
                  </button>

                  {/* Opción 2: Plin */}
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("PLIN")}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5 ${
                      paymentMethod === "PLIN"
                        ? "bg-[#00B4D8] text-white shadow-md ring-2 ring-cyan-200"
                        : "bg-white/10 text-stone-300 hover:bg-white/15"
                    }`}
                  >
                    <span>🔵 Plin</span>
                  </button>

                  {/* Opción 3: Transferencia / Cuentas */}
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("TRANSFERENCIA")}
                    className={`px-2.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1 ${
                      paymentMethod === "TRANSFERENCIA"
                        ? "bg-gradient-to-r from-[#C59B27] to-[#D4AF37] text-[#230408] shadow-md ring-2 ring-amber-200 font-extrabold"
                        : "bg-white/10 text-stone-300 hover:bg-white/15"
                    }`}
                  >
                    <span>🏛️ Cuentas</span>
                  </button>
                </div>

                <div className="text-right flex items-center justify-between sm:block border-t sm:border-t-0 pt-1 sm:pt-0 border-white/10">
                  <span className="text-[10px] text-[#EEDC94] uppercase tracking-wider font-semibold block">
                    Monto Oficial
                  </span>
                  <span className="font-bold text-lg sm:text-xl text-white font-mono">
                    S/ {membershipPrice.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* DETALLES DE PAGO SEGÚN LA OPCIÓN SELECCIONADA */}

              {/* === OPCIÓN 1 & 2: YAPE O PLIN (CON QR Y NÚMERO) === */}
              {(paymentMethod === "YAPE" || paymentMethod === "PLIN") && (
                <div className="bg-black/50 border border-white/10 rounded-xl p-3.5 space-y-3.5">
                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    {/* QR Code */}
                    <div className="flex flex-col items-center flex-shrink-0">
                      <div
                        onClick={() => setZoomedQr(currentQrImage)}
                        className="relative group cursor-pointer bg-white p-2 rounded-2xl shadow-lg border-2 border-[#D4AF37]/60 hover:scale-105 transition-transform"
                        title="Toca para ampliar el código QR"
                      >
                        <img
                          src={currentQrImage}
                          alt={`QR ${paymentMethod}`}
                          onError={() => setImgError(true)}
                          className="w-28 h-28 object-contain rounded-lg"
                        />
                        <div className="absolute inset-0 bg-black/40 rounded-xl opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          <ZoomIn className="w-5 h-5 text-white" />
                        </div>
                      </div>
                      <span className="text-[10px] text-[#EEDC94] font-medium mt-1.5 flex items-center gap-1">
                        <QrCode className="w-3 h-3" />
                        <span>Escanear QR {paymentMethod}</span>
                      </span>
                    </div>

                    {/* Número y Titular */}
                    <div className="flex-1 min-w-0 space-y-2 text-center sm:text-left w-full">
                      <div>
                        <p className="text-[10px] text-stone-400 uppercase tracking-wider font-medium">
                          Número Oficial de {paymentMethod}
                        </p>
                        <div className="flex items-center justify-center sm:justify-start gap-2 mt-0.5">
                          <p className="font-mono font-bold text-xl sm:text-2xl text-white tracking-wider">
                            {paymentMethod === "YAPE" ? yapePhone : plinPhone}
                          </p>
                          <button
                            type="button"
                            onClick={() =>
                              handleCopy(
                                paymentMethod === "YAPE" ? yapePhone : plinPhone,
                                "phone"
                              )
                            }
                            className="px-2.5 py-1.5 rounded-lg bg-[#5A0C18] hover:bg-[#720E1E] text-white text-xs font-semibold flex items-center gap-1 transition border border-[#D4AF37]/40 cursor-pointer shadow-xs"
                            title="Copiar número"
                          >
                            {copiedKey === "phone" ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                                <span className="text-emerald-400 text-[11px]">¡Copiado!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5 text-[#EEDC94]" />
                                <span className="text-[11px]">Copiar</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                      <div className="bg-white/5 rounded-lg p-2 border border-white/5">
                        <p className="text-[10px] text-stone-400">Titular de la cuenta:</p>
                        <p className="text-xs font-bold text-[#F7EDC4] truncate">
                          {yapeName}
                        </p>
                      </div>
                    </div>
                  </div>

                  <p className="text-[11px] text-stone-300 flex items-center gap-1.5 leading-snug pt-1 border-t border-white/10">
                    <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span>
                      Escanea el QR o haz el {paymentMethod} de <strong>S/ {membershipPrice.toFixed(2)}</strong> al número y adjunta la captura abajo.
                    </span>
                  </p>
                </div>
              )}

              {/* === OPCIÓN 3: TRANSFERENCIA BANCARIA / CUENTAS === */}
              {paymentMethod === "TRANSFERENCIA" && (
                <div className="bg-black/50 border border-white/10 rounded-xl p-3.5 space-y-3">
                  {/* Selector de Bancos */}
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-semibold text-stone-400">Selecciona el Banco:</span>
                    <div className="flex gap-1.5 flex-wrap">
                      {activeBankAccounts.map((b: any, idx: number) => (
                        <button
                          key={b.id || idx}
                          type="button"
                          onClick={() => setSelectedBankIndex(idx)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                            selectedBankIndex === idx
                              ? "bg-gradient-to-r from-[#C59B27] via-[#E5C058] to-[#C59B27] text-[#2F070E] shadow-sm font-extrabold ring-1 ring-amber-300"
                              : "bg-white/10 text-stone-300 hover:bg-white/15"
                          }`}
                        >
                          <Building2 className="w-3.5 h-3.5" />
                          <span>{b.bankName}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Datos del Banco Seleccionado */}
                  {activeBankAccounts[selectedBankIndex] && (
                    <div className="bg-white/5 border border-white/10 rounded-xl p-3.5 space-y-3">
                      {/* Titular */}
                      <div className="pb-2 border-b border-white/10">
                        <p className="text-[10px] text-stone-400 uppercase tracking-wider">Titular de la Cuenta:</p>
                        <p className="text-sm font-bold text-[#F7EDC4] truncate">
                          {activeBankAccounts[selectedBankIndex].holderName || bankBeneficiary}
                        </p>
                      </div>

                      {/* Cuenta en Soles */}
                      {activeBankAccounts[selectedBankIndex].solesAccount && (
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-[10px] text-stone-400 uppercase tracking-wider">
                              N° de Cuenta en Soles (S/)
                            </p>
                            <p className="font-mono font-bold text-sm sm:text-base text-white tracking-wider truncate">
                              {activeBankAccounts[selectedBankIndex].solesAccount}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              handleCopy(activeBankAccounts[selectedBankIndex].solesAccount!, "bank-soles")
                            }
                            className="px-2.5 py-1 rounded-lg bg-[#5A0C18] hover:bg-[#720E1E] text-white text-xs font-semibold flex items-center gap-1 transition flex-shrink-0 border border-[#D4AF37]/40 cursor-pointer"
                          >
                            {copiedKey === "bank-soles" ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-400" />
                                <span className="text-emerald-400 text-[10px]">¡Copiado!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3 text-[#EEDC94]" />
                                <span className="text-[10px]">Copiar</span>
                              </>
                            )}
                          </button>
                        </div>
                      )}

                      {/* Cuenta en Dólares */}
                      {activeBankAccounts[selectedBankIndex].dollarsAccount && (
                        <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/10">
                          <div className="min-w-0">
                            <p className="text-[10px] text-stone-400 uppercase tracking-wider">
                              N° de Cuenta en Dólares ($)
                            </p>
                            <p className="font-mono font-bold text-sm sm:text-base text-emerald-300 tracking-wider truncate">
                              {activeBankAccounts[selectedBankIndex].dollarsAccount}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              handleCopy(activeBankAccounts[selectedBankIndex].dollarsAccount!, "bank-dollars")
                            }
                            className="px-2.5 py-1 rounded-lg bg-[#5A0C18] hover:bg-[#720E1E] text-white text-xs font-semibold flex items-center gap-1 transition flex-shrink-0 border border-[#D4AF37]/40 cursor-pointer"
                          >
                            {copiedKey === "bank-dollars" ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-400" />
                                <span className="text-emerald-400 text-[10px]">¡Copiado!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3 text-[#EEDC94]" />
                                <span className="text-[10px]">Copiar</span>
                              </>
                            )}
                          </button>
                        </div>
                      )}

                      {/* CCI */}
                      {activeBankAccounts[selectedBankIndex].cci && (
                        <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/10">
                          <div className="min-w-0">
                            <p className="text-[10px] text-stone-400 uppercase tracking-wider">
                              CCI (Código Interbancario)
                            </p>
                            <p className="font-mono font-bold text-xs sm:text-sm text-stone-200 tracking-wider truncate">
                              {activeBankAccounts[selectedBankIndex].cci}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleCopy(activeBankAccounts[selectedBankIndex].cci!, "bank-cci")}
                            className="px-2.5 py-1 rounded-lg bg-[#5A0C18] hover:bg-[#720E1E] text-white text-xs font-semibold flex items-center gap-1 transition flex-shrink-0 border border-[#D4AF37]/40 cursor-pointer"
                          >
                            {copiedKey === "bank-cci" ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-400" />
                                <span className="text-emerald-400 text-[10px]">¡Copiado!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3 text-[#EEDC94]" />
                                <span className="text-[10px]">Copiar</span>
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  <p className="text-[11px] text-stone-300 flex items-center gap-1.5 leading-snug">
                    <Building2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span>
                      Transfiere <strong>S/ {membershipPrice.toFixed(2)}</strong> desde tu banca móvil o agente y adjunta la captura o constancia abajo.
                    </span>
                  </p>
                </div>
              )}
            </div>

            {/* CAMPOS DEL SOCIO (AUTOCOMPLETADOS) */}
            <div className="space-y-3">
              {/* Badge indicando si es socio detectado */}
              {initialMember && (
                <div className="p-2.5 rounded-xl bg-emerald-950/70 border border-emerald-500/40 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span>
                      Socio identificado: <strong className="text-white">{initialMember.name}</strong> ({initialMember.code})
                    </span>
                  </div>
                  {initialMember.status === "VENCIDA" && (
                    <span className="px-2 py-0.5 rounded-full bg-red-900/80 text-red-200 text-[10px] font-bold uppercase tracking-wider">
                      Vencida
                    </span>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* DNI o Código de Socio */}
                <div>
                  <label className="block text-[11px] font-semibold text-[#EEDC94] uppercase tracking-wider mb-1">
                    DNI o Código de Socio *
                  </label>
                  <input
                    type="text"
                    required
                    value={documentNumber}
                    onChange={(e) => setDocumentNumber(e.target.value)}
                    onBlur={handleDocBlur}
                    placeholder=""
                    className="w-full bg-[#1A0306] border border-[#D4AF37]/40 rounded-xl px-3 py-2.5 text-xs text-white placeholder-stone-500 focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                  />
                  {isLookingUp && (
                    <span className="text-[10px] text-stone-400">Verificando socio...</span>
                  )}
                </div>

                {/* Celular / WhatsApp */}
                <div>
                  <label className="block text-[11px] font-semibold text-[#EEDC94] uppercase tracking-wider mb-1">
                    Tu Celular / WhatsApp *
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder=""
                    className="w-full bg-[#1A0306] border border-[#D4AF37]/40 rounded-xl px-3 py-2.5 text-xs text-white placeholder-stone-500 focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                  />
                </div>
              </div>

              {/* DATOS DE ENTREGA Y DESTINATARIO DE LA TARJETA */}
              <div className="bg-[#0D0D0D] border border-[#8C0303]/60 rounded-2xl p-3.5 space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-[#8C0303]/30">
                  <Gift className="w-4 h-4 text-[#F20519]" />
                  <span className="text-[11px] font-bold uppercase tracking-wider text-white">
                    Datos de Entrega y Destinatario de la Tarjeta
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[10px] font-semibold text-[#F7EDC4] mb-1">
                      🎁 Nombre de quien recibe *
                    </label>
                    <input
                      type="text"
                      value={recipientName}
                      onChange={(e) => setRecipientName(e.target.value)}
                      placeholder=""
                      className="w-full bg-black/60 border border-[#8C0303]/40 rounded-xl px-3 py-2 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-[#F20519]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-[#F7EDC4] mb-1">
                      📞 Celular de quien recibe
                    </label>
                    <input
                      type="tel"
                      value={recipientPhone}
                      onChange={(e) => setRecipientPhone(e.target.value)}
                      placeholder=""
                      className="w-full bg-black/60 border border-[#8C0303]/40 rounded-xl px-3 py-2 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-[#F20519]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[10px] font-semibold text-[#F7EDC4] mb-1">
                      📍 Dirección exacta
                    </label>
                    <input
                      type="text"
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      placeholder=""
                      className="w-full bg-black/60 border border-[#8C0303]/40 rounded-xl px-3 py-2 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-[#F20519]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-[#F7EDC4] mb-1">
                      🗺️ Referencia
                    </label>
                    <input
                      type="text"
                      value={deliveryReference}
                      onChange={(e) => setDeliveryReference(e.target.value)}
                      placeholder=""
                      className="w-full bg-black/60 border border-[#8C0303]/40 rounded-xl px-3 py-2 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-[#F20519]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[10px] font-semibold text-[#F7EDC4] mb-1">
                      💌 Nombre de quien envía
                    </label>
                    <input
                      type="text"
                      value={senderName}
                      onChange={(e) => setSenderName(e.target.value)}
                      placeholder=""
                      className="w-full bg-black/60 border border-[#8C0303]/40 rounded-xl px-3 py-2 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-[#F20519]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-[#F7EDC4] mb-1">
                      💖 Dedicatoria (opcional)
                    </label>
                    <input
                      type="text"
                      value={dedication}
                      onChange={(e) => setDedication(e.target.value)}
                      placeholder=""
                      className="w-full bg-black/60 border border-[#8C0303]/40 rounded-xl px-3 py-2 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-[#F20519]"
                    />
                  </div>
                </div>
              </div>

              {/* ADJUNTAR CAPTURA O FOTO DEL COMPROBANTE (LAS 3 OPCIONES LO USAN) */}
              <div>
                <label className="block text-[11px] font-semibold text-[#EEDC94] uppercase tracking-wider mb-1 flex items-center justify-between">
                  <span>Captura o Foto del Comprobante *</span>
                  <span className="text-[10px] text-stone-400 font-normal">
                    {paymentMethod === "TRANSFERENCIA" ? "Constancia de banco" : `Captura de ${paymentMethod}`}
                  </span>
                </label>

                <div className="relative border-2 border-dashed border-[#8C0303]/60 hover:border-[#F20519] rounded-2xl p-3.5 text-center transition bg-black/40">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleVoucherChange}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                  />

                  {voucherPreview ? (
                    <div className="flex items-center justify-between gap-3 relative z-20">
                      <div className="flex items-center gap-3">
                        <img
                          src={voucherPreview}
                          alt="Vista previa voucher"
                          className="w-14 h-14 object-cover rounded-xl border border-[#F20519]/60 shadow-md"
                        />
                        <div className="text-left text-xs">
                          <p className="font-bold text-emerald-400 flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" />
                            <span>Comprobante listo para enviar</span>
                          </p>
                          <p className="text-[10px] text-stone-400 truncate max-w-[200px]">
                            {voucherFile?.name || "Captura seleccionada"}
                          </p>
                          <p className="text-[10px] text-[#EEDC94] mt-0.5">Toca para cambiar imagen</p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveVoucher();
                        }}
                        className="p-1.5 rounded-lg bg-red-950/80 hover:bg-red-900 text-red-300 text-xs border border-red-500/40 cursor-pointer"
                        title="Quitar imagen"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-2 space-y-1">
                      <div className="w-10 h-10 rounded-full bg-[#8C0303]/60 border border-[#F20519]/50 flex items-center justify-center mb-1">
                        <Upload className="w-5 h-5 text-[#F20519]" />
                      </div>
                      <p className="text-xs text-stone-200 font-bold">
                        Toca aquí para subir la captura del comprobante
                      </p>
                      <p className="text-[10px] text-stone-400">
                        Acepta captura de pantalla o foto (JPG, PNG o WEBP hasta 5MB)
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Número de Operación (Complementario) */}
              <div>
                <label className="block text-[11px] font-semibold text-[#EEDC94] uppercase tracking-wider mb-1">
                  Número de Operación / Referencia (Opcional)
                </label>
                <input
                  type="text"
                  value={operationNumber}
                  onChange={(e) => setOperationNumber(e.target.value)}
                  placeholder=""
                  className="w-full bg-[#0D0D0D] border border-[#8C0303]/40 rounded-xl px-3 py-2 text-xs text-white placeholder-stone-500 font-mono focus:outline-none focus:ring-1 focus:ring-[#F20519]"
                />
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <p className="text-xs text-red-300 bg-red-950/80 border border-red-500/50 p-2.5 rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                <span>{error}</span>
              </p>
            )}

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isPending || isUploading}
                className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-[#8C0303] via-[#F20505] to-[#F20519] text-white font-bold text-xs uppercase tracking-wider shadow-xl hover:brightness-110 active:scale-95 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 border border-[#F20519]/50"
              >
                {isPending || isUploading ? (
                  <span>Subiendo Comprobante...</span>
                ) : (
                  <>
                    <span>Enviar Comprobante de Renovación</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* MODAL PARA AMPLIAR CÓDIGO QR */}
      {zoomedQr && (
        <div
          className="fixed inset-0 z-60 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setZoomedQr(null)}
        >
          <div className="relative bg-white p-4 rounded-3xl max-w-sm w-full text-center space-y-3 shadow-2xl animate-in zoom-in-95">
            <h4 className="font-serif font-bold text-stone-900 text-lg">
              Código QR {paymentMethod}
            </h4>
            <img
              src={zoomedQr}
              alt="QR ampliado"
              className="w-full max-w-[280px] h-auto mx-auto rounded-xl shadow-inner border border-stone-200"
            />
            <p className="text-xs text-stone-600 font-medium">
              Titular: {yapeName} • {paymentMethod === "YAPE" ? yapePhone : plinPhone}
            </p>
            <button
              onClick={() => setZoomedQr(null)}
              className="w-full py-2 bg-stone-900 text-white rounded-xl text-xs font-bold"
            >
              Cerrar QR
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
