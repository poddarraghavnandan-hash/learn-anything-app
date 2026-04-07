/**
 * Responsive Design Utilities
 * Provides functions to scale typography, spacing, and layout based on screen size
 */

import { Dimensions, Platform } from "react-native";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

// Screen size breakpoints (width in pixels)
export const BREAKPOINTS = {
  xs: 320,      // Small phones (iPhone SE, older Android)
  sm: 375,      // Standard phones (iPhone 12 mini, Pixel 4a)
  md: 414,      // Large phones (iPhone 12, Pixel 5)
  lg: 600,      // Tablets, landscape phones
  xl: 768,      // iPad, large tablets
};

// Determine current breakpoint
export function getCurrentBreakpoint(): keyof typeof BREAKPOINTS {
  if (screenWidth < 375) return "xs";
  if (screenWidth < 414) return "sm";
  if (screenWidth < 600) return "md";
  if (screenWidth < 768) return "lg";
  return "xl";
}

// Scale font size based on screen width
export function getResponsiveFontSize(baseSize: number): number {
  const scale = screenWidth / 375; // Base scale on iPhone 12 mini
  const scaledSize = baseSize * scale;
  
  // Clamp between min and max to prevent extreme sizes
  const minSize = baseSize * 0.8;
  const maxSize = baseSize * 1.4;
  
  return Math.max(minSize, Math.min(maxSize, scaledSize));
}

// Scale spacing/padding based on screen width
export function getResponsiveSpacing(baseSpacing: number): number {
  const scale = screenWidth / 375;
  const scaledSpacing = baseSpacing * scale;
  
  // Clamp between min and max
  const minSpacing = baseSpacing * 0.7;
  const maxSpacing = baseSpacing * 1.3;
  
  return Math.max(minSpacing, Math.min(maxSpacing, scaledSpacing));
}

// Get responsive padding object
export function getResponsivePadding(horizontal: number, vertical: number) {
  return {
    paddingHorizontal: getResponsiveSpacing(horizontal),
    paddingVertical: getResponsiveSpacing(vertical),
  };
}

// Get responsive margin object
export function getResponsiveMargin(horizontal: number, vertical: number) {
  return {
    marginHorizontal: getResponsiveSpacing(horizontal),
    marginVertical: getResponsiveSpacing(vertical),
  };
}

// Check if screen is small (< 375px width)
export function isSmallScreen(): boolean {
  return screenWidth < 375;
}

// Check if screen is medium (375-414px width)
export function isMediumScreen(): boolean {
  return screenWidth >= 375 && screenWidth < 600;
}

// Check if screen is large (600px+ width)
export function isLargeScreen(): boolean {
  return screenWidth >= 600;
}

// Check if in landscape orientation
export function isLandscape(): boolean {
  return screenWidth > screenHeight;
}

// Get responsive container width (with max-width for tablets)
export function getResponsiveContainerWidth(): number {
  if (isLargeScreen()) {
    return Math.min(screenWidth - 40, 700); // Max 700px on tablets
  }
  return screenWidth - 32; // 16px padding on each side for phones
}

// Get responsive card height (for card-based layouts)
export function getResponsiveCardHeight(): number {
  const availableHeight = screenHeight - 200; // Subtract header, nav, spacing
  
  if (isSmallScreen()) {
    return Math.max(availableHeight * 0.7, 300); // At least 300px
  }
  if (isMediumScreen()) {
    return Math.max(availableHeight * 0.75, 350);
  }
  return Math.max(availableHeight * 0.8, 400);
}

// Get responsive grid columns
export function getResponsiveGridColumns(): number {
  if (isSmallScreen()) return 1;
  if (isMediumScreen()) return 1;
  if (isLargeScreen() && !isLandscape()) return 2;
  return 3; // Landscape or very large screens
}

// Responsive typography presets
export const RESPONSIVE_TYPOGRAPHY = {
  h1: {
    xs: getResponsiveFontSize(28),
    sm: getResponsiveFontSize(32),
    md: getResponsiveFontSize(36),
    lg: getResponsiveFontSize(40),
  },
  h2: {
    xs: getResponsiveFontSize(22),
    sm: getResponsiveFontSize(24),
    md: getResponsiveFontSize(28),
    lg: getResponsiveFontSize(32),
  },
  h3: {
    xs: getResponsiveFontSize(18),
    sm: getResponsiveFontSize(20),
    md: getResponsiveFontSize(22),
    lg: getResponsiveFontSize(24),
  },
  body: {
    xs: getResponsiveFontSize(14),
    sm: getResponsiveFontSize(15),
    md: getResponsiveFontSize(16),
    lg: getResponsiveFontSize(17),
  },
  caption: {
    xs: getResponsiveFontSize(12),
    sm: getResponsiveFontSize(13),
    md: getResponsiveFontSize(14),
    lg: getResponsiveFontSize(15),
  },
};

// Get current font size for a typography level
export function getResponsiveTypography(level: keyof typeof RESPONSIVE_TYPOGRAPHY): number {
  const breakpoint = getCurrentBreakpoint();
  const sizes = RESPONSIVE_TYPOGRAPHY[level];
  
  if (breakpoint === "xs") return sizes.xs;
  if (breakpoint === "sm") return sizes.sm;
  if (breakpoint === "md") return sizes.md;
  return sizes.lg;
}


// Get responsive input height
export function getResponsiveInputHeight(): number {
  if (isSmallScreen()) return 36;
  if (isMediumScreen()) return 40;
  return 44;
}

// Get responsive button height
export function getResponsiveButtonHeight(): number {
  if (isSmallScreen()) return 40;
  if (isMediumScreen()) return 44;
  return 48;
}

// Get keyboard vertical offset for iOS
export function getKeyboardVerticalOffset(): number {
  if (Platform.OS !== "ios") return 0;
  if (isSmallScreen()) return 50;
  if (isMediumScreen()) return 70;
  return 90;
}

// Get max input height for multiline inputs
export function getMaxInputHeight(): number {
  if (isSmallScreen()) return 60;
  if (isMediumScreen()) return 80;
  return 100;
}

// Get responsive icon size
export function getResponsiveIconSize(baseSize: number = 24): number {
  return getResponsiveFontSize(baseSize);
}

// Get responsive border radius
export function getResponsiveBorderRadius(baseRadius: number = 12): number {
  return getResponsiveSpacing(baseRadius);
}

// Get responsive line height for text
export function getResponsiveLineHeight(fontSize: number): number {
  return fontSize * 1.4;
}
