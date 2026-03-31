import React, { useMemo } from "react";
import { View, ScrollView, useWindowDimensions, ViewProps } from "react-native";
import { cn } from "@/lib/utils";

/**
 * ResponsiveLayout Component
 *
 * Automatically handles:
 * - Dynamic text sizing based on screen width
 * - Responsive padding/margins
 * - Automatic scrolling for overflow content
 * - Works seamlessly across all device sizes
 *
 * Usage:
 * ```tsx
 * <ResponsiveLayout>
 *   <ResponsiveText size="lg">Large Title</ResponsiveText>
 *   <ResponsiveText size="base">Body text</ResponsiveText>
 * </ResponsiveLayout>
 * ```
 */

interface ResponsiveLayoutProps extends ViewProps {
  children: React.ReactNode;
  scrollable?: boolean;
  className?: string;
  contentContainerClassName?: string;
}

/**
 * Main responsive container that handles scrolling and responsive spacing
 */
export function ResponsiveLayout({
  children,
  scrollable = true,
  className,
  contentContainerClassName,
  ...props
}: ResponsiveLayoutProps) {
  const { width, height } = useWindowDimensions();

  // Calculate responsive padding based on screen width
  const responsivePadding = useMemo(() => {
    if (width < 360) return "px-3 py-3"; // Small phones
    if (width < 480) return "px-4 py-4"; // Regular phones
    if (width < 768) return "px-5 py-5"; // Large phones
    return "px-6 py-6"; // Tablets
  }, [width]);

  const Container = scrollable ? ScrollView : View;

  const scrollProps = scrollable
    ? {
        contentContainerStyle: { flexGrow: 1 },
        scrollEnabled: true,
        showsVerticalScrollIndicator: true,
      }
    : {};

  return (
    <Container
      className={cn(responsivePadding, "flex-1", className)}
      {...scrollProps}
      {...props}
    >
      <View className={cn("flex-1", contentContainerClassName)}>
        {children}
      </View>
    </Container>
  );
}

/**
 * Responsive text component that scales based on screen width
 * Sizes: xs, sm, base, lg, xl, 2xl, 3xl
 */
interface ResponsiveTextProps {
  size?: "xs" | "sm" | "base" | "lg" | "xl" | "2xl" | "3xl";
  weight?: "normal" | "semibold" | "bold";
  color?: string;
  className?: string;
  children: React.ReactNode;
}

export function ResponsiveText({
  size = "base",
  weight = "normal",
  color = "text-foreground",
  className,
  children,
}: ResponsiveTextProps) {
  const { width } = useWindowDimensions();

  // Scale text sizes based on screen width
  // These are Tailwind class names that will be applied
  const sizeMap = useMemo(() => {
    if (width < 360) {
      // Extra small phones - reduce sizes by 1 step
      return {
        xs: "text-xs",
        sm: "text-xs",
        base: "text-sm",
        lg: "text-base",
        xl: "text-lg",
        "2xl": "text-xl",
        "3xl": "text-2xl",
      };
    }
    if (width < 480) {
      // Small phones
      return {
        xs: "text-xs",
        sm: "text-sm",
        base: "text-base",
        lg: "text-lg",
        xl: "text-xl",
        "2xl": "text-2xl",
        "3xl": "text-3xl",
      };
    }
    if (width < 768) {
      // Large phones - increase sizes by 0.5 step
      return {
        xs: "text-sm",
        sm: "text-base",
        base: "text-lg",
        lg: "text-xl",
        xl: "text-2xl",
        "2xl": "text-3xl",
        "3xl": "text-4xl",
      };
    }
    // Tablets - increase sizes by 1 step
    return {
      xs: "text-sm",
      sm: "text-base",
      base: "text-lg",
      lg: "text-2xl",
      xl: "text-3xl",
      "2xl": "text-4xl",
      "3xl": "text-5xl",
    };
  }, [width]);

  const weightMap = {
    normal: "font-normal",
    semibold: "font-semibold",
    bold: "font-bold",
  };

  return (
    <Text
      className={cn(
        sizeMap[size],
        weightMap[weight],
        color,
        "leading-relaxed",
        className
      )}
    >
      {children}
    </Text>
  );
}

/**
 * Responsive spacing component
 * Automatically scales gaps/margins based on screen width
 */
interface ResponsiveSpacerProps extends ViewProps {
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  direction?: "vertical" | "horizontal";
}

export function ResponsiveSpacer({
  size = "md",
  direction = "vertical",
  ...props
}: ResponsiveSpacerProps) {
  const { width } = useWindowDimensions();

  const spacingMap = useMemo(() => {
    if (width < 360) {
      return { xs: 4, sm: 6, md: 8, lg: 12, xl: 16 };
    }
    if (width < 480) {
      return { xs: 6, sm: 8, md: 12, lg: 16, xl: 20 };
    }
    if (width < 768) {
      return { xs: 8, sm: 12, md: 16, lg: 20, xl: 24 };
    }
    return { xs: 12, sm: 16, md: 20, lg: 24, xl: 32 };
  }, [width]);

  const spacing = spacingMap[size];

  return (
    <View
      {...props}
      style={[
        direction === "vertical"
          ? { height: spacing }
          : { width: spacing },
        props.style,
      ]}
    />
  );
}

/**
 * Responsive grid/row component for flexible layouts
 */
interface ResponsiveRowProps extends ViewProps {
  gap?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
}

export function ResponsiveRow({
  gap = "md",
  className,
  ...props
}: ResponsiveRowProps) {
  const { width } = useWindowDimensions();

  const gapMap = useMemo(() => {
    if (width < 360) {
      return { xs: "gap-1", sm: "gap-2", md: "gap-3", lg: "gap-4", xl: "gap-6" };
    }
    if (width < 480) {
      return { xs: "gap-2", sm: "gap-3", md: "gap-4", lg: "gap-6", xl: "gap-8" };
    }
    if (width < 768) {
      return { xs: "gap-3", sm: "gap-4", md: "gap-6", lg: "gap-8", xl: "gap-10" };
    }
    return { xs: "gap-4", sm: "gap-6", md: "gap-8", lg: "gap-10", xl: "gap-12" };
  }, [width]);

  return (
    <View
      className={cn("flex-row", gapMap[gap], className)}
      {...props}
    />
  );
}

// Re-export Text for convenience
import { Text } from "react-native";
