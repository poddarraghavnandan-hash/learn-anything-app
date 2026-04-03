import { z } from "zod";
import { publicProcedure, router } from "./_core/trpc";
import ytdl from "@distube/ytdl-core";

export const videoRouter = router({
  /**
   * Day 0 Implementation: Layer B Proxy
   * Extracts the raw .mp4 stream URL from a YouTube URL.
   * This guarantees 60fps scrolling inside `expo-video` on all Android devices
   * without the massive overhead of standard WebViews.
   */
  getRawStreamUrl: publicProcedure
    .input(z.object({
      youtubeUrl: z.string().url(),
    }))
    .query(async ({ input }) => {
      try {
        console.log(`[Video Layer B] Extracting stream for ${input.youtubeUrl}...`);
        
        // Use quality 'highest' or specifically target modern mp4 formats
        const info = await ytdl.getInfo(input.youtubeUrl);
        const format = ytdl.chooseFormat(info.formats, { quality: 'highestvideo', filter: 'videoandaudio' }) 
                       || ytdl.chooseFormat(info.formats, { filter: 'audioandvideo' });
        
        if (!format || !format.url) {
          throw new Error("Could not extract a valid mp4 stream from YouTube.");
        }

        console.log(`[Video Layer B] Stream acquired successfully.`);
        return {
          streamUrl: format.url,
          title: info.videoDetails.title
        };
      } catch (error: any) {
        console.error(`[Video Layer B] Proxy extraction failed:`, error.message);
        throw new Error(`Failed to extract proxy stream: ${error.message}`);
      }
    }),
});
