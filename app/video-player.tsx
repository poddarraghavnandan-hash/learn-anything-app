import { useLocalSearchParams, useRouter } from "expo-router";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Platform,
  Dimensions,
  ScrollView,
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import * as Haptics from "expo-haptics";
import { useCallback, useState, useMemo, useRef } from "react";
import { WebView } from "react-native-webview";

/**
 * Extracts YouTube video ID from various URL formats:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID
 * - https://m.youtube.com/watch?v=VIDEO_ID
 */
function extractYouTubeId(url: string): string | null {
  if (!url) return null;
  const shortMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
  if (shortMatch) return shortMatch[1];
  const standardMatch = url.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
  if (standardMatch) return standardMatch[1];
  const embedMatch = url.match(/\/embed\/([a-zA-Z0-9_-]{11})/);
  if (embedMatch) return embedMatch[1];
  return null;
}

/**
 * Build the HTML page that embeds a YouTube iframe.
 * Using source={{ html, baseUrl }} is the confirmed fix for Error 153.
 * YouTube requires a valid origin — baseUrl provides that.
 */
function buildYouTubeHTML(videoId: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; height: 100%; overflow: hidden; background: #000; }
    .video-wrapper {
      position: relative;
      width: 100%;
      padding-bottom: 56.25%; /* 16:9 aspect ratio */
      height: 0;
    }
    .video-wrapper iframe {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      border: none;
    }
  </style>
</head>
<body>
  <div class="video-wrapper">
    <iframe
      src="https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&playsinline=1&enablejsapi=1"
      allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
      allowfullscreen
      frameborder="0"
    ></iframe>
  </div>
</body>
</html>`;
}

export default function VideoPlayerScreen() {
  const { url, title } = useLocalSearchParams<{ url: string; title?: string }>();
  const router = useRouter();
  const colors = useColors();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const webViewRef = useRef<WebView>(null);
  const [retryKey, setRetryKey] = useState(0);

  const videoId = useMemo(() => (url ? extractYouTubeId(url) : null), [url]);
  const screenWidth = Dimensions.get("window").width;
  const videoHeight = Math.round(screenWidth * (9 / 16));

  const handleBack = useCallback(() => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  }, [router]);

  const handleRetry = useCallback(() => {
    setError(false);
    setLoading(true);
    setRetryKey((k) => k + 1);
  }, []);

  const youtubeHTML = useMemo(() => {
    if (!videoId) return null;
    return buildYouTubeHTML(videoId);
  }, [videoId]);

  if (!url || !videoId || !youtubeHTML) {
    return (
      <ScreenContainer edges={["top", "bottom", "left", "right"]} className="flex-1">
        <View style={styles.center}>
          <Text style={{ fontSize: 48, marginBottom: 16 }}>{"\u{1F3AC}"}</Text>
          <Text style={[styles.errorText, { color: colors.muted }]}>
            Unable to play this video
          </Text>
          <Pressable
            onPress={handleBack}
            style={({ pressed }) => [
              styles.backBtn,
              { backgroundColor: colors.primary, opacity: pressed ? 0.9 : 1 },
            ]}
          >
            <Text style={styles.backBtnText}>Go Back</Text>
          </Pressable>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer edges={["top", "left", "right"]} className="flex-1">
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable
          onPress={handleBack}
          style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1, padding: 8 }]}
        >
          <Text style={[styles.backArrow, { color: colors.primary }]}>{"< Back"}</Text>
        </Pressable>
        <View style={{ flex: 1, marginLeft: 8 }}>
          <Text
            style={[styles.headerTitle, { color: colors.foreground }]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {title || "Video"}
          </Text>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1 }}>
        {/* Video Player */}
        <View style={[styles.videoContainer, { height: videoHeight, backgroundColor: "#000" }]}>
          {loading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="#FFF" />
              <Text style={styles.loadingText}>Loading video...</Text>
            </View>
          )}
          {error ? (
            <View style={styles.loadingOverlay}>
              <Text style={{ fontSize: 48, marginBottom: 12 }}>{"\u{26A0}\u{FE0F}"}</Text>
              <Text style={styles.loadingText}>Failed to load video</Text>
              <Pressable
                onPress={handleRetry}
                style={({ pressed }) => [
                  styles.retryBtn,
                  { opacity: pressed ? 0.8 : 1 },
                ]}
              >
                <Text style={styles.retryText}>Retry</Text>
              </Pressable>
            </View>
          ) : (
            <WebView
              key={retryKey}
              ref={webViewRef}
              // Use HTML source with baseUrl — this is the confirmed fix for Error 153
              // YouTube requires a valid origin, and baseUrl provides that context
              source={{
                html: youtubeHTML,
                baseUrl: "https://learnapp.local",
              }}
              style={{ flex: 1, backgroundColor: "#000" }}
              allowsInlineMediaPlayback
              mediaPlaybackRequiresUserAction={false}
              javaScriptEnabled
              domStorageEnabled
              allowsFullscreenVideo
              onLoadEnd={() => setLoading(false)}
              onError={() => { setLoading(false); setError(true); }}
              onHttpError={(syntheticEvent) => {
                const { nativeEvent } = syntheticEvent;
                if (nativeEvent.statusCode >= 400) {
                  setLoading(false);
                  setError(true);
                }
              }}
              scrollEnabled={false}
              // Allow third-party cookies for YouTube
              thirdPartyCookiesEnabled
              sharedCookiesEnabled
              // Prevent navigation away from the embed
              onShouldStartLoadWithRequest={(request) => {
                // Allow the initial HTML load and YouTube embed
                if (
                  request.url === "about:blank" ||
                  request.url.startsWith("https://learnapp.local") ||
                  request.url.includes("youtube.com") ||
                  request.url.includes("youtube-nocookie.com") ||
                  request.url.includes("googlevideo.com") ||
                  request.url.includes("google.com") ||
                  request.url.includes("gstatic.com") ||
                  request.url.includes("ytimg.com")
                ) {
                  return true;
                }
                return false;
              }}
            />
          )}
        </View>

        {/* Video Info */}
        <View style={styles.infoSection}>
          {title && (
            <Text style={[styles.videoTitle, { color: colors.foreground }]}>
              {title}
            </Text>
          )}
          <Text style={[styles.videoMeta, { color: colors.muted }]}>
            Playing in-app
          </Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24 },
  errorText: { fontSize: 16, marginBottom: 16, textAlign: "center" },
  backBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10 },
  backBtnText: { color: "#FFF", fontWeight: "600", fontSize: 15 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 0.5,
  },
  backArrow: { fontSize: 16, fontWeight: "600" },
  headerTitle: { fontSize: 15, fontWeight: "600" },
  videoContainer: {
    width: "100%",
    position: "relative",
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
    zIndex: 10,
  },
  loadingText: { color: "#FFF", fontSize: 14, marginTop: 12 },
  retryBtn: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 10,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 8,
  },
  retryText: { color: "#FFF", fontWeight: "600" },
  infoSection: { padding: 16 },
  videoTitle: { fontSize: 18, fontWeight: "700", lineHeight: 26, marginBottom: 4 },
  videoMeta: { fontSize: 13 },
});
