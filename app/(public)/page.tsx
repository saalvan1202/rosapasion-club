import React from "react";
import prisma from "@/lib/prisma";
import { PortalView } from "@/components/portal/portal-view";
import { getSocialPosts } from "@/actions/social";

export const dynamic = "force-dynamic";

export default async function SocioPortalPage() {
  let categories: Array<{ id: string; name: string; slug: string; iconName: string }> = [];
  let businesses: any[] = [];
  let socialPosts: any[] = [];
  let catalogUrl = "https://rosapasion.com/rosa-pasion-principal";
  let supportPhone = "51952226282";
  let dbSettings: any = null;

  try {
    const [fetchedCategories, fetchedBusinesses, fetchedSettings, fetchedSocialPosts] = await Promise.all([
      prisma.category.findMany({
        orderBy: { order: "asc" },
      }),
      prisma.business.findMany({
        where: { isActive: true, deletedAt: null },
        orderBy: [{ order: "asc" }, { createdAt: "desc" }],
        include: {
          category: {
            select: { id: true, name: true, slug: true },
          },
          terms: {
            orderBy: { order: "asc" },
          },
        },
      }),
      prisma.clubSetting.findUnique({
        where: { id: "default" },
      }),
      getSocialPosts(),
    ]);

    if (fetchedCategories && fetchedCategories.length > 0) {
      categories = fetchedCategories;
    }
    if (fetchedBusinesses && fetchedBusinesses.length > 0) {
      businesses = fetchedBusinesses;
    }
    if (fetchedSocialPosts && fetchedSocialPosts.length > 0) {
      socialPosts = fetchedSocialPosts;
    }
    if (fetchedSettings) {
      dbSettings = fetchedSettings;
      if (fetchedSettings.catalogUrl && !fetchedSettings.catalogUrl.includes("wa.me")) {
        catalogUrl = fetchedSettings.catalogUrl;
      } else {
        catalogUrl = "https://rosapasion.com/rosa-pasion-principal";
      }
      if (fetchedSettings.supportPhone) supportPhone = fetchedSettings.supportPhone;
    }
  } catch (error) {
    console.error("Error al cargar datos del portal de socio desde DB:", error);
  }

  return (
    <PortalView
      categories={categories}
      businesses={businesses}
      socialPosts={socialPosts}
      catalogUrl={catalogUrl}
      supportPhone={supportPhone}
      facebookUrl={dbSettings?.facebookUrl || "https://www.facebook.com/rosapasiontarapoto"}
      instagramUrl={dbSettings?.instagramUrl || "https://www.instagram.com/rosapasiontarapoto"}
      tiktokUrl={dbSettings?.tiktokUrl || "https://www.tiktok.com/@rosapasiontarapoto"}
      clubSettings={dbSettings ? {
        yapePhone: dbSettings.yapePhone,
        yapeName: dbSettings.yapeName,
        yapeQrUrl: dbSettings.yapeQrUrl || "/yape-qr.png",
        plinPhone: dbSettings.plinPhone || "952 226 282",
        plinQrUrl: dbSettings.plinQrUrl || "/plin-qr.png",
        bcpAccount: dbSettings.bcpAccount || "550-95549542-0-21",
        bcpCci: dbSettings.bcpCci || "00255010932545818821",
        interbankAccount: dbSettings.interbankAccount || "8983150419001",
        interbankCci: dbSettings.interbankCci || "",
        bbvaAccount: dbSettings.bbvaAccount || "0011-0814-0203826899",
        bbvaCci: dbSettings.bbvaCci || "",
        bankBeneficiary: dbSettings.bankBeneficiary || "Orison David Cometivos Rojas",
        bankAccounts: (dbSettings as any).bankAccounts,
        membershipPrice: dbSettings.membershipPrice ? Number(dbSettings.membershipPrice) : 29.0,
      } : undefined}
    />
  );
}
