"use client";

import React, { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

export function PwaRegister() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // 1. Registrar Service Worker para PWA
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch((err) => {
        console.log("Service Worker registro opcional:", err);
      });
    }

    // 2. Detectar si ya está en modo standalone (instalado)
    if (typeof window !== "undefined") {
      const isStandalone =
        window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as any).standalone;
      if (isStandalone) return;

      // 3. Comprobar si ya se mostró alguna vez anteriormente (solo mostrar 1 vez al abrir por primera vez)
      const hasShownPrompt = localStorage.getItem("rosapasion_pwa_prompt_shown");
      if (hasShownPrompt) return;

      // 4. Detectar iOS
      const userAgent = window.navigator.userAgent.toLowerCase();
      const isAppleDevice = /iphone|ipad|ipod/.test(userAgent);
      setIsIOS(isAppleDevice);

      // 5. Capturar evento de instalación en Android / Chrome
      const handler = (e: Event) => {
        e.preventDefault();
        if (localStorage.getItem("rosapasion_pwa_prompt_shown")) return;

        setDeferredPrompt(e);
        setShowInstallBanner(true);
        // Marcar inmediatamente para que solo se muestre en esta primera apertura
        localStorage.setItem("rosapasion_pwa_prompt_shown", "true");
      };

      window.addEventListener("beforeinstallprompt", handler);
      return () => window.removeEventListener("beforeinstallprompt", handler);
    }
  }, []);

  const handleInstallClick = async () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("rosapasion_pwa_prompt_shown", "true");
    }

    if (!deferredPrompt) {
      if (isIOS) {
        alert(
          "Para instalar en iPhone: presiona el botón Compartir de Safari (⎋) y selecciona 'Agregar a Inicio'."
        );
      }
      setShowInstallBanner(false);
      return;
    }

    deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === "accepted") {
      setShowInstallBanner(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowInstallBanner(false);
    if (typeof window !== "undefined") {
      localStorage.setItem("rosapasion_pwa_prompt_shown", "true");
    }
  };

  if (!showInstallBanner) return null;

  return (
    <div className="fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom))] sm:bottom-4 left-3 right-3 sm:left-auto sm:right-4 sm:max-w-md z-50 animate-in slide-in-from-bottom-4 duration-300">
      <div className="p-3 sm:p-3.5 rounded-2xl bg-gradient-to-r from-[#3D0710] to-[#230408] border-2 border-[#D4AF37]/70 shadow-2xl text-white flex items-center justify-between gap-3 backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-white p-1 border border-[#D4AF37]/50 flex items-center justify-center flex-shrink-0 shadow-sm">
            <img src="/icon-192.png" alt="Rosa Pasión" className="w-full h-full object-contain" />
          </div>
          <div>
            <p className="text-xs font-bold text-white leading-tight">Instalar Rosa Pasión Club</p>
            <p className="text-[10px] text-[#EEDC94]">Accede con 1 toque en tu celular</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            onClick={handleInstallClick}
            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#AA820A] text-[#230408] font-bold text-xs shadow-md hover:brightness-110 active:scale-95 transition flex items-center gap-1 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Instalar</span>
          </button>
          <button
            onClick={handleDismiss}
            className="p-1 rounded-full text-stone-400 hover:text-white transition cursor-pointer"
            title="Cerrar"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
