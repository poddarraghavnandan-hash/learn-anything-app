import { router } from "expo-router";

/**
 * Open a video URL in the in-app video player.
 * Supports YouTube URLs (youtube.com, youtu.be).
 * Falls back to content detail screen if a content ID is available.
 */
export function openVideoInApp(url: string, title?: string) {
  const params: Record<string, string> = { url };
  if (title) params.title = title;
  router.push({ pathname: "/video-player", params } as any);
}
