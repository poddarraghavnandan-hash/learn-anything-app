import React from "react";
import { View, ScrollView, useWindowDimensions, ViewProps } from "react-native";
import { Text } from "react-native";
import { cn } from "@/lib/utils";

/**
 * Responsive patterns for common layout scenarios
 * These components handle responsive behavior automatically
 */

/**
 * Card component that scales responsively
 */
interface ResponsiveCardProps extends ViewProps {
  children: React.ReactNode;
  className?: string;
}

export function ResponsiveCard({
  children,
  className,
  ...props
}: ResponsiveCardProps) {
  const { width } = useWindowDimensions();

  const paddingClass = width < 360 ? "p-3" : width < 480 ? "p-4" : "p-5";

  return (
    <View
      className={cn(
        paddingClass,
        "rounded-lg border border-border bg-surface",
        className
      )}
      {...props}
    >
      {children}
    </View>
  );
}

/**
 * Section component with responsive heading and content
 */
interface ResponsiveSectionProps extends ViewProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}

export function ResponsiveSection({
  title,
  subtitle,
  children,
  className,
  ...props
}: ResponsiveSectionProps) {
  const { width } = useWindowDimensions();

  const titleSize = width < 360 ? "text-lg" : width < 480 ? "text-xl" : "text-2xl";
  const subtitleSize = width < 360 ? "text-xs" : width < 480 ? "text-sm" : "text-base";
  const spacing = width < 360 ? "gap-2" : width < 480 ? "gap-3" : "gap-4";

  return (
    <View className={cn(spacing, className)} {...props}>
      {title && (
        <View>
          <Text className={cn(titleSize, "font-bold text-foreground")}>
            {title}
          </Text>
          {subtitle && (
            <Text className={cn(subtitleSize, "text-muted mt-1")}>
              {subtitle}
            </Text>
          )}
        </View>
      )}
      {children}
    </View>
  );
}

/**
 * Responsive button group (stacks on small screens, rows on large)
 */
interface ResponsiveButtonGroupProps extends ViewProps {
  children: React.ReactNode;
  className?: string;
}

export function ResponsiveButtonGroup({
  children,
  className,
  ...props
}: ResponsiveButtonGroupProps) {
  const { width } = useWindowDimensions();

  // Stack on very small screens, row on larger screens
  const layout = width < 480 ? "flex-col" : "flex-row";
  const gap = width < 360 ? "gap-2" : width < 480 ? "gap-3" : "gap-4";

  return (
    <View className={cn(layout, gap, className)} {...props}>
      {children}
    </View>
  );
}

/**
 * Responsive list item with automatic text sizing
 */
interface ResponsiveListItemProps extends ViewProps {
  title: string;
  subtitle?: string;
  leftElement?: React.ReactNode;
  rightElement?: React.ReactNode;
  className?: string;
}

export function ResponsiveListItem({
  title,
  subtitle,
  leftElement,
  rightElement,
  className,
  ...props
}: ResponsiveListItemProps) {
  const { width } = useWindowDimensions();

  const titleSize = width < 360 ? "text-sm" : width < 480 ? "text-base" : "text-lg";
  const subtitleSize = width < 360 ? "text-xs" : width < 480 ? "text-xs" : "text-sm";
  const padding = width < 360 ? "p-3" : width < 480 ? "p-4" : "p-5";

  return (
    <View
      className={cn(
        "flex-row items-center justify-between",
        padding,
        "border-b border-border",
        className
      )}
      {...props}
    >
      {leftElement && <View className="mr-3">{leftElement}</View>}

      <View className="flex-1">
        <Text className={cn(titleSize, "font-semibold text-foreground")}>
          {title}
        </Text>
        {subtitle && (
          <Text className={cn(subtitleSize, "text-muted mt-1")}>
            {subtitle}
          </Text>
        )}
      </View>

      {rightElement && <View className="ml-3">{rightElement}</View>}
    </View>
  );
}

/**
 * Responsive content wrapper for lesson/article content
 * Handles text overflow and proper line height
 */
interface ResponsiveContentProps extends ViewProps {
  children: React.ReactNode;
  className?: string;
}

export function ResponsiveContent({
  children,
  className,
  ...props
}: ResponsiveContentProps) {
  const { width } = useWindowDimensions();

  // Adjust line height and letter spacing based on screen width
  const textSize = width < 360 ? "text-sm" : width < 480 ? "text-base" : "text-lg";
  const lineHeight = width < 360 ? "leading-relaxed" : "leading-loose";

  return (
    <View className={cn(className)} {...props}>
      <Text className={cn(textSize, lineHeight, "text-foreground")}>
        {children}
      </Text>
    </View>
  );
}

/**
 * Responsive grid for displaying items in columns
 * Automatically adjusts column count based on screen width
 */
interface ResponsiveGridProps extends ViewProps {
  children: React.ReactNode;
  minColumnWidth?: number; // Minimum width per column in pixels
  className?: string;
}

export function ResponsiveGrid({
  children,
  minColumnWidth = 150,
  className,
  ...props
}: ResponsiveGridProps) {
  const { width } = useWindowDimensions();

  // Calculate number of columns based on available width
  const columns = Math.max(1, Math.floor(width / minColumnWidth));
  const gap = width < 360 ? "gap-2" : width < 480 ? "gap-3" : "gap-4";

  return (
    <View
      className={cn("flex-wrap flex-row", gap, className)}
      {...props}
      style={[
        {
          justifyContent: "space-between",
        },
        props.style,
      ]}
    >
      {React.Children.map(children, (child) => (
        <View style={{ width: `${100 / columns}%`, paddingHorizontal: 4 }}>
          {child}
        </View>
      ))}
    </View>
  );
}

/**
 * Responsive header component for screens
 */
interface ResponsiveHeaderProps extends ViewProps {
  title: string;
  subtitle?: string;
  rightElement?: React.ReactNode;
  className?: string;
}

export function ResponsiveHeader({
  title,
  subtitle,
  rightElement,
  className,
  ...props
}: ResponsiveHeaderProps) {
  const { width } = useWindowDimensions();

  const titleSize = width < 360 ? "text-2xl" : width < 480 ? "text-3xl" : "text-4xl";
  const subtitleSize = width < 360 ? "text-xs" : width < 480 ? "text-sm" : "text-base";
  const padding = width < 360 ? "px-3 py-4" : width < 480 ? "px-4 py-5" : "px-5 py-6";

  return (
    <View
      className={cn(
        padding,
        "border-b border-border flex-row items-center justify-between",
        className
      )}
      {...props}
    >
      <View className="flex-1">
        <Text className={cn(titleSize, "font-bold text-foreground")}>
          {title}
        </Text>
        {subtitle && (
          <Text className={cn(subtitleSize, "text-muted mt-1")}>
            {subtitle}
          </Text>
        )}
      </View>
      {rightElement && <View className="ml-4">{rightElement}</View>}
    </View>
  );
}
