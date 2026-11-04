"use client";

import React from "react";
import { SocialFeed, SocialFeedItem } from "./SocialFeed";

interface SocialFeedSectionProps {
  posts: any[];
  facebookUrl?: string;
  instagramUrl?: string;
  tiktokUrl?: string;
}

export function SocialFeedSection({
  posts,
  facebookUrl,
  instagramUrl,
  tiktokUrl,
}: SocialFeedSectionProps) {
  return (
    <SocialFeed
      initialPosts={posts as SocialFeedItem[]}
      facebookUrl={facebookUrl}
      instagramUrl={instagramUrl}
      tiktokUrl={tiktokUrl}
    />
  );
}
