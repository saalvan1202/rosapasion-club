import React from "react";
import prisma from "@/lib/prisma";
import { getSocialPosts } from "@/actions/social";
import { getClubSettings } from "@/actions/settings";
import { SocialManager } from "@/components/admin/social-manager";

export const dynamic = "force-dynamic";

export default async function AdminSocialPage() {
  const [posts, settings] = await Promise.all([
    getSocialPosts(),
    getClubSettings(),
  ]);

  return (
    <SocialManager
      initialPosts={posts}
      facebookUrl={settings.facebookUrl}
      instagramUrl={settings.instagramUrl}
      tiktokUrl={settings.tiktokUrl}
    />
  );
}

