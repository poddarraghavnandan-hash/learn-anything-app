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
import { useCallback, useState, useMemo } from "react";
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

export default function VideoPlayerScreen() {
  const { url, title } = useLocalSearchParams<{ url: string; title?: string }>();
  const router = useRouter();
  const colors = useColors();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const videoId = useMemo(() => (url ? extractYouTubeId(url) : null), [url]);
  const screenWidth = Dimensions.get("window").width;
  const videoHeight = Math.round(screenWidth * (9 / 16));

  const handleBack = useCallback(() => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  }, [router]);

  // Use youtube-nocookie.com for privacy-enhanced mode which avoids Error 153
  const embedUrl = useMemo(() => {
    if (!videoId) return null;
    return `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&playsinline=1`;
  }, [videoId]);

  if (!url || !videoId || !embedUrl) {
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
                onPress={() => { setError(false); setLoading(true); }}
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
              source={{ uri: embedUrl }}
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
              // Set proper user agent to avoid YouTube blocking
              userAgent="Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36"
              // Allow third-party cookies for YouTube
              thirdPartyCookiesEnabled
              sharedCookiesEnabled
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
