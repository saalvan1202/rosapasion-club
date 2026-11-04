"use client";

import React, { useState } from "react";
import { SocialPostItem } from "@/actions/social";
import { SocialButtons } from "@/components/social/social-buttons";
import {
  Sparkles,
  Heart,
  MessageCircle,
  Eye,
  ExternalLink,
  Share2,
  Calendar,
} from "lucide-react";

interface SocialFeedSectionProps {
  posts: SocialPostItem[];
  facebookUrl?: string;
  instagramUrl?: string;
  tiktokUrl?: string;
}

export function SocialFeedSection({
  posts,
  facebookUrl = "https://www.facebook.com/rosapasiontarapoto",
  instagramUrl = "https://www.instagram.com/rosapasiontarapoto",
  tiktokUrl = "https://www.tiktok.com/@rosapasiontarapoto",
}: SocialFeedSectionProps) {
  const [selectedPlatform, setSelectedPlatform] = useState<string>("ALL");

  const filteredPosts = posts.filter((post) => {
    if (selectedPlatform === "ALL") return true;
    return post.platform.toUpperCase() === selectedPlatform.toUpperCase();
  });

  const getPlatformBadge = (platform: string) => {
    switch (platform.toUpperCase()) {
      case "INSTAGRAM":
        return {
          name: "Instagram",
          badgeClass: "bg-gradient-to-r from-[#833AB4] via-[#FD1D1D] to-[#F77737] text-white",
          btnClass: "bg-gradient-to-r from-[#833AB4] via-[#FD1D1D] to-[#F77737] text-white hover:brightness-110",
          iconColor: "text-[#E4405F]",
        };
      case "TIKTOK":
        return {
          name: "TikTok",
          badgeClass: "bg-black text-white border border-cyan-400/50 shadow-[0_0_8px_rgba(34,211,238,0.2)]",
          btnClass: "bg-black hover:bg-neutral-900 text-white border border-cyan-400/40 hover:border-cyan-400",
          iconColor: "text-cyan-400",
        };
      case "FACEBOOK":
      default:
        return {
          name: "Facebook",
          badgeClass: "bg-[#1877F2] text-white",
          btnClass: "bg-[#1877F2] hover:bg-[#166fe5] text-white",
          iconColor: "text-[#1877F2]",
        };
    }
  };

  return (
    <section id="redes-sociales" className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full scroll-mt-20">
      {/* Header Container */}
      <div className="bg-gradient-to-b from-[#140508] via-[#1A0204] to-[#0D0D0D] border border-[#8C0303]/40 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden mb-8">
        {/* Glow ambient background */}
        <div className="absolute top-0 right-1/4 w-80 h-80 bg-[#F20519]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#8C0303]/40 border border-[#F20519]/40 text-[#F7EDC4] text-[11px] font-bold uppercase tracking-wider mb-2.5 shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-[#F20519]" />
              <span>Comunidad & Redes Sociales</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-white tracking-tight">
              Síguenos en nuestras <span className="gold-gradient-text">Redes Oficiales</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1.5 max-w-xl leading-relaxed">
              Descubre las últimas entregas, arreglos florales exclusivos, detrás de cámaras y promociones especiales del Club en Facebook, Instagram y TikTok.
            </p>
          </div>

          {/* Botones de Redes Sociales con diseño exacto de referencia */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <span className="text-xs text-stone-300 font-medium">Perfiles Oficiales:</span>
            <SocialButtons
              facebookUrl={facebookUrl}
              instagramUrl={instagramUrl}
              tiktokUrl={tiktokUrl}
              size="lg"
            />
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-6 mt-6 border-t border-[#8C0303]/30">
          <button
            type="button"
            onClick={() => setSelectedPlatform("ALL")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 flex-shrink-0 cursor-pointer ${
              selectedPlatform === "ALL"
                ? "bg-gradient-to-r from-[#8C0303] via-[#F20505] to-[#F20519] text-white shadow-md ring-2 ring-[#F20519]/50"
                : "bg-[#1A0204] border border-[#8C0303]/40 text-slate-300 hover:text-white hover:bg-[#8C0303]/30"
            }`}
          >
            <span>Todas las publicaciones</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/40 text-stone-300">
              {posts.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedPlatform("INSTAGRAM")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 flex-shrink-0 cursor-pointer ${
              selectedPlatform === "INSTAGRAM"
                ? "bg-gradient-to-r from-[#833AB4] via-[#FD1D1D] to-[#F77737] text-white shadow-md ring-2 ring-[#FD1D1D]/50"
                : "bg-[#1A0204] border border-[#8C0303]/40 text-slate-300 hover:text-white hover:bg-[#8C0303]/30"
            }`}
          >
            <span>Instagram</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/40 text-stone-300">
              {posts.filter((p) => p.platform.toUpperCase() === "INSTAGRAM").length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedPlatform("TIKTOK")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 flex-shrink-0 cursor-pointer ${
              selectedPlatform === "TIKTOK"
                ? "bg-black text-white border border-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.4)]"
                : "bg-[#1A0204] border border-[#8C0303]/40 text-slate-300 hover:text-white hover:bg-[#8C0303]/30"
            }`}
          >
            <span>TikTok</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/40 text-stone-300">
              {posts.filter((p) => p.platform.toUpperCase() === "TIKTOK").length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedPlatform("FACEBOOK")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 flex-shrink-0 cursor-pointer ${
              selectedPlatform === "FACEBOOK"
                ? "bg-[#1877F2] text-white shadow-md ring-2 ring-[#1877F2]/50"
                : "bg-[#1A0204] border border-[#8C0303]/40 text-slate-300 hover:text-white hover:bg-[#8C0303]/30"
            }`}
          >
            <span>Facebook</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/40 text-stone-300">
              {posts.filter((p) => p.platform.toUpperCase() === "FACEBOOK").length}
            </span>
          </button>
        </div>
      </div>

      {/* Grid of Social Posts */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPosts.map((post) => {
          const badge = getPlatformBadge(post.platform);
          return (
            <div
              key={post.id}
              className="rounded-3xl bg-gradient-to-b from-[#140508] via-[#1A0204] to-[#0D0D0D] border border-[#8C0303]/40 overflow-hidden flex flex-col justify-between hover:border-[#F20519] transition-all duration-300 shadow-xl group hover:shadow-[0_10px_30px_rgba(242,5,25,0.2)]"
            >
              <div>
                {/* Header of the post */}
                <div className="p-4 sm:p-5 flex items-center justify-between border-b border-[#8C0303]/30">
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={post.authorAvatar || "/logo.png"}
                      alt={post.authorName}
                      className="w-10 h-10 rounded-full object-cover border border-[#D4AF37]/50 shadow-xs flex-shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white truncate group-hover:text-[#F7EDC4] transition">
                        {post.authorName}
                      </p>
                      <p className="text-[11px] text-stone-400 truncate">
                        {post.authorHandle || "@rosapasiontarapoto"}
                      </p>
                    </div>
                  </div>

                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-xs flex-shrink-0 ${badge.badgeClass}`}>
                    {badge.name}
                  </span>
                </div>

                {/* Media Container (16:10 or 4:3 Aspect Ratio) */}
                <a
                  href={post.postUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block relative aspect-[4/3] bg-black overflow-hidden group/media cursor-pointer"
                >
                  <img
                    src={post.mediaUrl}
                    alt={post.title || post.caption.slice(0, 40)}
                    className="w-full h-full object-cover group-hover/media:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover/media:opacity-30 transition-opacity" />

                  {/* Icon badge floating on top right of image */}
                  <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/70 backdrop-blur-md flex items-center justify-center border border-white/20 text-white shadow-md">
                    <ExternalLink className="w-4 h-4" />
                  </div>
                </a>

                {/* Caption / Content */}
                <div className="p-4 sm:p-5 space-y-3">
                  {post.title && (
                    <h3 className="font-serif font-bold text-white text-base leading-snug">
                      {post.title}
                    </h3>
                  )}
                  <p className="text-xs text-slate-300 leading-relaxed line-clamp-3">
                    {post.caption}
                  </p>
                </div>
              </div>

              {/* Footer with Engagement Stats and CTA */}
              <div className="p-4 sm:p-5 pt-0 border-t border-[#8C0303]/20 mt-2 space-y-3">
                {/* Stats */}
                <div className="flex items-center justify-between text-[11px] text-stone-400 pt-3">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1.5 hover:text-rose-400 transition">
                      <Heart className="w-3.5 h-3.5 text-rose-500" />
                      <span>{post.likesCount || 0}</span>
                    </span>
                    <span className="flex items-center gap-1.5 hover:text-sky-400 transition">
                      <MessageCircle className="w-3.5 h-3.5 text-sky-400" />
                      <span>{post.commentsCount || 0}</span>
                    </span>
                    {post.viewsCount && post.viewsCount > 0 && (
                      <span className="flex items-center gap-1.5 hover:text-amber-400 transition">
                        <Eye className="w-3.5 h-3.5 text-amber-400" />
                        <span>{post.viewsCount}</span>
                      </span>
                    )}
                  </div>

                  <span className="flex items-center gap-1 text-[10px] text-stone-500">
                    <Calendar className="w-3 h-3" />
                    <span>
                      {new Date(post.publishedAt).toLocaleDateString("es-PE", {
                        day: "2-digit",
                        month: "short",
                      })}
                    </span>
                  </span>
                </div>

                {/* Direct CTA Button */}
                <a
                  href={post.postUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`w-full py-2.5 px-3 rounded-xl font-bold text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 shadow-md ${badge.btnClass} active:scale-98 cursor-pointer`}
                >
                  <span>Ver en {badge.name}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
