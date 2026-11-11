"use client";

import React, { useEffect, useState, useMemo } from "react";
import { SocialButtons } from "@/components/social/social-buttons";
import { ExternalLink, Sparkles, RefreshCw } from "lucide-react";

export interface SocialFeedItem {
  id: string;
  platform: "TIKTOK" | "FACEBOOK" | "INSTAGRAM" | string;
  url: string;
  title?: string | null;
  caption?: string | null;
  isActive: boolean;
  createdAt?: string | Date;
}

interface SocialFeedProps {
  initialPosts?: SocialFeedItem[];
  facebookUrl?: string;
  instagramUrl?: string;
  tiktokUrl?: string;
}

// Extrae el código de Instagram de URLs como /p/CODE/ o /reel/CODE/
function getInstagramEmbedUrl(url: string): string | null {
  try {
    const match = url.match(/instagram\.com\/(?:p|reel|tv)\/([^/?#&]+)/i);
    if (match && match[1]) {
      return `https://www.instagram.com/p/${match[1]}/embed/captioned/`;
    }
  } catch {}
  return null;
}

// Extrae el ID de video de TikTok
function getTikTokVideoId(url: string): string | null {
  try {
    const match = url.match(/\/video\/(\d+)/i);
    if (match && match[1]) {
      return match[1];
    }
  } catch {}
  return null;
}

// Limpia parámetros de tracking de Facebook y resuelve URLs de Reels
function getCleanFacebookUrl(url: string): string {
  try {
    // Si contiene el ID de share conocido, convertir a reel canónico
    if (url.includes("18pPwFio9u")) {
      return "https://www.facebook.com/reel/1447245873529523/";
    }
    const u = new URL(url);
    u.searchParams.delete("mibextid");
    u.searchParams.delete("rdid");
    u.searchParams.delete("share_url");
    u.searchParams.delete("__tn__");
    u.searchParams.delete("fs");
    return u.toString();
  } catch {
    return url;
  }
}

// Genera la URL de embed adecuada para Facebook (video/reel vs post vs página)
function getFacebookEmbedUrl(
  rawUrl: string,
  officialPageUrl: string,
  mode: "post" | "page" = "post"
): string {
  if (mode === "page") {
    return `https://www.facebook.com/plugins/page.php?href=${encodeURIComponent(
      officialPageUrl
    )}&tabs=timeline&width=500&height=480&small_header=false&adapt_container_width=true&hide_cover=false&show_facepile=true`;
  }

  const clean = getCleanFacebookUrl(rawUrl);
  const lower = clean.toLowerCase();

  // Para Reels, Videos o enlaces móviles compartidos de reels (/share/r/ o /share/v/)
  const isVideoOrReel =
    lower.includes("/reel/") ||
    lower.includes("/share/r/") ||
    lower.includes("/share/v/") ||
    lower.includes("/videos/") ||
    lower.includes("/watch");

  if (isVideoOrReel) {
    return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(
      clean
    )}&show_text=false&width=500`;
  }

  // Para posts o fotos estándar
  if (lower.includes("/posts/") || lower.includes("/permalink.php") || lower.includes("/photos/")) {
    return `https://www.facebook.com/plugins/post.php?href=${encodeURIComponent(
      clean
    )}&show_text=true&width=500`;
  }

  // Fallback si es el enlace del perfil o la página: Page Plugin
  return `https://www.facebook.com/plugins/page.php?href=${encodeURIComponent(
    officialPageUrl
  )}&tabs=timeline&width=500&height=480&small_header=false&adapt_container_width=true&hide_cover=false&show_facepile=true`;
}

export function SocialFeed({
  initialPosts,
  facebookUrl = "https://www.facebook.com/Rosapasion",
  instagramUrl = "https://www.instagram.com/rosapasion_tarapoto",
  tiktokUrl = "https://www.tiktok.com/@rosapasion.tarapoto",
}: SocialFeedProps) {
  const [posts, setPosts] = useState<SocialFeedItem[]>(initialPosts || []);
  const [loading, setLoading] = useState(!initialPosts || initialPosts.length === 0);
  const [facebookMode, setFacebookMode] = useState<"post" | "page">("post");

  // Cargar publicaciones desde la API si no vienen en props
  useEffect(() => {
    async function fetchPosts() {
      try {
        const res = await fetch("/api/social-posts");
        const data = await res.json();
        if (data.success && Array.isArray(data.posts)) {
          setPosts(data.posts);
        }
      } catch (err) {
        console.error("Error cargando social posts:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchPosts();
  }, []);

  // Obtener la publicación activa más reciente para cada una de las 3 plataformas (Estricto 3x1)
  const latestPosts = useMemo(() => {
    const activePosts = posts.filter((p) => p.isActive);

    const fb = activePosts.find((p) => p.platform?.toUpperCase() === "FACEBOOK");
    const ig = activePosts.find((p) => p.platform?.toUpperCase() === "INSTAGRAM");
    const tt = activePosts.find((p) => p.platform?.toUpperCase() === "TIKTOK");

    return {
      facebook: fb?.url || facebookUrl,
      instagram: ig?.url || instagramUrl,
      tiktok: tt?.url || tiktokUrl,
      fbPost: fb,
      igPost: ig,
      ttPost: tt,
    };
  }, [posts, facebookUrl, instagramUrl, tiktokUrl]);

  // Inyección y recarga dinámica de scripts oficiales (TikTok & Instagram)
  useEffect(() => {
    if (typeof window === "undefined") return;

    // 1. Script TikTok: remover previo y añadir para forzar escaneo inmediato del DOM
    const oldTt = document.getElementById("tiktok-embed-script");
    if (oldTt) oldTt.remove();

    const ttScript = document.createElement("script");
    ttScript.id = "tiktok-embed-script";
    ttScript.src = "https://www.tiktok.com/embed.js";
    ttScript.async = true;
    document.body.appendChild(ttScript);

    // 2. Script Instagram
    if (!document.getElementById("instagram-embed-script")) {
      const igScript = document.createElement("script");
      igScript.id = "instagram-embed-script";
      igScript.src = "https://www.instagram.com/embed.js";
      igScript.async = true;
      igScript.onload = () => {
        if ((window as any).instgrm) {
          (window as any).instgrm.Embeds?.process();
        }
      };
      document.body.appendChild(igScript);
    } else if ((window as any).instgrm) {
      (window as any).instgrm.Embeds?.process();
    }
  }, [latestPosts.tiktok, latestPosts.instagram]);

  return (
    <section className="w-full py-16 bg-transparent border-t border-white/15 text-white relative overflow-hidden">
      {/* Fondo estético con glow carmesí y ámbar */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-red-600/10 blur-[140px] pointer-events-none rounded-full" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* ENCABEZADO DE LA SECCIÓN */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-gradient-to-r from-red-600 to-red-500 border border-red-400/40 text-white text-xs font-semibold tracking-wider uppercase mb-3 shadow-md shadow-red-600/25">
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            <span>Comunidad & Novedades en Vivo</span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif font-bold text-white tracking-tight">
            Síguenos en Nuestras Redes Oficiales
          </h2>
          <p className="text-slate-200 text-xs sm:text-sm mt-2 max-w-xl mx-auto">
            Descubre las últimas promociones, arreglos florales exclusivos y experiencias de nuestros socios en Tarapoto.
          </p>

          {/* Botones de squircle oficiales de Rosa Pasión */}
          <div className="flex justify-center items-center gap-3 mt-4">
            <SocialButtons
              facebookUrl={facebookUrl}
              instagramUrl={instagramUrl}
              tiktokUrl={tiktokUrl}
            />
          </div>
        </div>

        {/* GRID EXACTO 3 x 1 (1 Columna en Móvil, 3 Columnas en Desktop) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* ==================== COLUMNA 1: FACEBOOK ==================== */}
          <div className="flex flex-col bg-white/[0.06] backdrop-blur-xl border border-white/15 rounded-2xl overflow-hidden shadow-2xl hover:border-[#1877F2]/60 transition-all duration-300">
            {/* Header Red */}
            <div className="flex items-center justify-between p-3.5 border-b border-white/10 bg-white/[0.08]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#1877F2] flex items-center justify-center shadow-md">
                  <svg className="w-4 h-4 fill-current text-white" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white leading-tight">Facebook</h3>
                  <span className="text-[11px] text-stone-300">@Rosapasion</span>
                </div>
              </div>

              {/* Selector de modo Post / Muro en vivo */}
              <div className="flex items-center bg-black/40 border border-white/15 rounded-lg p-0.5 text-[10px]">
                <button
                  onClick={() => setFacebookMode("post")}
                  className={`px-2 py-0.5 rounded font-semibold transition-all cursor-pointer ${
                    facebookMode === "post"
                      ? "bg-[#1877F2] text-white shadow-xs"
                      : "text-stone-300 hover:text-white"
                  }`}
                >
                  Post
                </button>
                <button
                  onClick={() => setFacebookMode("page")}
                  className={`px-2 py-0.5 rounded font-semibold transition-all cursor-pointer ${
                    facebookMode === "page"
                      ? "bg-[#1877F2] text-white shadow-xs"
                      : "text-stone-300 hover:text-white"
                  }`}
                  title="Ver muro oficial de Facebook"
                >
                  Muro Oficial
                </button>
              </div>
            </div>

            {/* Contenido Embebido Oficial Facebook */}
            <div className="p-3 min-h-[480px] flex items-center justify-center bg-black/25 overflow-hidden">
              <iframe
                key={`${latestPosts.facebook}-${facebookMode}`}
                src={getFacebookEmbedUrl(latestPosts.facebook, facebookUrl, facebookMode)}
                width="100%"
                height="480"
                style={{ border: "none", overflow: "hidden" }}
                scrolling="no"
                frameBorder="0"
                allowFullScreen={true}
                allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                className="rounded-xl w-full"
                title="Facebook Post Embed"
              />
            </div>

            {/* Footer Botón */}
            <div className="p-3 border-t border-white/10 bg-white/[0.08]">
              <a
                href={latestPosts.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 px-4 rounded-xl bg-[#1877F2] hover:bg-[#166fe5] text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              >
                <span>Ver Publicación en Facebook</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* ==================== COLUMNA 2: INSTAGRAM ==================== */}
          <div className="flex flex-col bg-white/[0.06] backdrop-blur-xl border border-white/15 rounded-2xl overflow-hidden shadow-2xl hover:border-[#E4405F]/60 transition-all duration-300">
            {/* Header Red */}
            <div className="flex items-center justify-between p-3.5 border-b border-white/10 bg-white/[0.08]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#F58529] via-[#DD2A7B] to-[#8134AF] flex items-center justify-center shadow-md">
                  <svg className="w-4 h-4 fill-current text-white" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white leading-tight">Instagram</h3>
                  <span className="text-[11px] text-stone-300">@rosapasion_tarapoto</span>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#E4405F]/20 text-[#E4405F] border border-[#E4405F]/40">
                Último Post
              </span>
            </div>

            {/* Contenido Embebido Instagram */}
            <div className="p-3 min-h-[480px] flex items-center justify-center bg-black/25 overflow-hidden">
              {getInstagramEmbedUrl(latestPosts.instagram) ? (
                <iframe
                  key={latestPosts.instagram}
                  src={getInstagramEmbedUrl(latestPosts.instagram)!}
                  className="w-full h-[480px] rounded-xl border-0"
                  frameBorder="0"
                  scrolling="no"
                  allowFullScreen
                  title="Instagram Post Embed"
                />
              ) : (
                <blockquote
                  key={latestPosts.instagram}
                  className="instagram-media w-full"
                  data-instgrm-permalink={latestPosts.instagram}
                  data-instgrm-version="14"
                  style={{
                    background: "transparent",
                    border: 0,
                    margin: 0,
                    minWidth: "326px",
                    maxWidth: "540px",
                    width: "100%",
                  }}
                >
                  <div className="text-center p-6 text-stone-300 text-xs">
                    <a
                      href={latestPosts.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#E4405F] hover:underline"
                    >
                      Ver publicación en Instagram
                    </a>
                  </div>
                </blockquote>
              )}
            </div>

            {/* Footer Botón */}
            <div className="p-3 border-t border-white/10 bg-white/[0.08]">
              <a
                href={latestPosts.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#F58529] via-[#DD2A7B] to-[#8134AF] hover:opacity-90 text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              >
                <span>Ver en Instagram</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* ==================== COLUMNA 3: TIKTOK ==================== */}
          <div className="flex flex-col bg-white/[0.06] backdrop-blur-xl border border-white/15 rounded-2xl overflow-hidden shadow-2xl hover:border-cyan-400/60 transition-all duration-300">
            {/* Header Red */}
            <div className="flex items-center justify-between p-3.5 border-b border-white/10 bg-white/[0.08]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-black border border-white/20 flex items-center justify-center shadow-md">
                  <svg className="w-4 h-4 fill-current text-white" viewBox="0 0 24 24">
                    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.24 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white leading-tight">TikTok</h3>
                  <span className="text-[11px] text-stone-400">@rosapasion.tarapoto</span>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-stone-700/40 text-stone-300 border border-stone-600/50">
                Último Video
              </span>
            </div>

            {/* Contenido Embebido Oficial TikTok (Player v1 Oficial de Alta Velocidad) */}
            <div className="p-3 min-h-[480px] flex items-center justify-center bg-black/25 overflow-hidden">
              {getTikTokVideoId(latestPosts.tiktok) ? (
                <iframe
                  key={latestPosts.tiktok}
                  src={`https://www.tiktok.com/player/v1/${getTikTokVideoId(latestPosts.tiktok)}?embed_from=oembed&music_info=1&description=1`}
                  className="w-full h-[500px] rounded-xl border-0 shadow-lg"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; fullscreen; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  loading="lazy"
                  title="TikTok Video Player"
                />
              ) : (
                <blockquote
                  key={latestPosts.tiktok}
                  className="tiktok-embed w-full"
                  cite={latestPosts.tiktok}
                  style={{
                    maxWidth: "605px",
                    minWidth: "325px",
                    margin: "0 auto",
                    width: "100%",
                  }}
                >
                  <section className="text-center p-8 text-stone-300 text-xs">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-8 h-8 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
                      <span>Cargando video oficial de TikTok...</span>
                    </div>
                  </section>
                </blockquote>
              )}
            </div>

            {/* Footer Botón */}
            <div className="p-3 border-t border-white/10 bg-white/[0.08]">
              <a
                href={latestPosts.tiktok}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 px-4 rounded-xl bg-white/[0.08] hover:bg-white/[0.18] border border-white/20 text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              >
                <span>Ver en TikTok</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
