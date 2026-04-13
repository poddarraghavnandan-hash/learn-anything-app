/**
 * Mind Map Visualization Component
 * Displays interactive knowledge graph with concepts, prerequisites, and mastery levels
 */

import React, { useState, useCallback } from "react";
import { View, Text, Pressable, ScrollView, Dimensions } from "react-native";
import Svg, { Circle, Line, Text as SvgText, G } from "react-native-svg";
import Animated, { FadeIn, ZoomIn } from "react-native-reanimated";
import { useColors } from "@/hooks/use-colors";

export interface ConceptNode {
  id: string;
  label: string;
  masteryPercentage: number;
  masteryLevel: 1 | 2 | 3 | 4 | 5;
  isLearned: boolean;
  isCurrentlyLearning: boolean;
  color: string;
  icon: string;
  x: number;
  y: number;
}

export interface PrerequisiteEdge {
  from: string;
  to: string;
  isCompleted: boolean;
}

export interface MindMapVisualizationProps {
  nodes: ConceptNode[];
  edges: PrerequisiteEdge[];
  onNodePress?: (nodeId: string) => void;
  selectedNodeId?: string;
  showMasteryFilter?: boolean;
  minMasteryLevel?: 1 | 2 | 3 | 4 | 5;
}

const MASTERYLEVELS = {
  1: { name: "Foundation", emoji: "🌱", color: "#94a3b8" },
  2: { name: "Understanding", emoji: "🌿", color: "#f59e0b" },
  3: { name: "Application", emoji: "🌳", color: "#3b82f6" },
  4: { name: "Deep Dive", emoji: "🏔️", color: "#8b5cf6" },
  5: { name: "Mastery", emoji: "🏆", color: "#10b981" },
};

export function MindMapVisualization({
  nodes,
  edges,
  onNodePress,
  selectedNodeId,
  showMasteryFilter = true,
  minMasteryLevel = 1,
}: MindMapVisualizationProps) {
  const colors = useColors();
  const screenWidth = Dimensions.get("window").width;
  const screenHeight = 600;

  const [selectedFilter, setSelectedFilter] = useState<1 | 2 | 3 | 4 | 5 | null>(null);

  // Filter nodes based on mastery level
  const filteredNodes = selectedFilter
    ? nodes.filter((n) => n.masteryLevel >= selectedFilter)
    : nodes.filter((n) => n.masteryLevel >= minMasteryLevel);

  const filteredNodeIds = new Set(filteredNodes.map((n) => n.id));

  // Filter edges to only show connections between visible nodes
  const filteredEdges = edges.filter(
    (e) => filteredNodeIds.has(e.from) && filteredNodeIds.has(e.to)
  );

  const handleNodePress = useCallback(
    (nodeId: string) => {
      onNodePress?.(nodeId);
    },
    [onNodePress]
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Mastery Filter */}
      {showMasteryFilter && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ paddingHorizontal: 16, paddingVertical: 12, borderBottomColor: colors.border, borderBottomWidth: 1 }}
          contentContainerStyle={{ gap: 8 }}
        >
          <Pressable
            onPress={() => setSelectedFilter(null)}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: 16,
              backgroundColor: !selectedFilter ? colors.primary : colors.surface,
              borderWidth: 1,
              borderColor: !selectedFilter ? colors.primary : colors.border,
            }}
          >
            <Text style={{ color: !selectedFilter ? "#fff" : colors.foreground, fontSize: 12, fontWeight: "600" }}>
              All Concepts
            </Text>
          </Pressable>

          {(Object.entries(MASTERYLEVELS) as [string, any][]).map(([level, info]) => (
            <Pressable
              key={level}
              onPress={() => setSelectedFilter(parseInt(level) as any)}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 16,
                backgroundColor: selectedFilter === parseInt(level) ? info.color : colors.surface,
                borderWidth: 1,
                borderColor: selectedFilter === parseInt(level) ? info.color : colors.border,
              }}
            >
              <Text
                style={{
                  color: selectedFilter === parseInt(level) ? "#fff" : colors.foreground,
                  fontSize: 12,
                  fontWeight: "600",
                }}
              >
                {info.emoji} {info.name}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      )}

      {/* Mind Map Canvas */}
      <ScrollView
        horizontal
        scrollEnabled={screenWidth < 800}
        style={{ flex: 1 }}
        contentContainerStyle={{ minWidth: screenWidth }}
      >
        <Svg width={Math.max(screenWidth, 800)} height={screenHeight} style={{ backgroundColor: colors.background }}>
          {/* Draw edges (prerequisite lines) */}
          {filteredEdges.map((edge, idx) => {
            const fromNode = filteredNodes.find((n) => n.id === edge.from);
            const toNode = filteredNodes.find((n) => n.id === edge.to);

            if (!fromNode || !toNode) return null;

            return (
              <Line
                key={`edge-${idx}`}
                x1={fromNode.x + 150}
                y1={fromNode.y + 150}
                x2={toNode.x + 150}
                y2={toNode.y + 150}
                stroke={edge.isCompleted ? colors.primary : colors.border}
                strokeWidth={edge.isCompleted ? 2 : 1}
                strokeDasharray={edge.isCompleted ? "0" : "5,5"}
                opacity={0.6}
              />
            );
          })}

          {/* Draw nodes */}
          {filteredNodes.map((node) => (
            <G key={`node-${node.id}`}>
              <Animated.View
                entering={ZoomIn.springify()}
                style={{
                  position: "absolute",
                  left: node.x + 100,
                  top: node.y + 100,
                }}
              >
                <Pressable
                  onPress={() => handleNodePress(node.id)}
                  style={{
                    alignItems: "center",
                    justifyContent: "center",
                    width: 100,
                    height: 100,
                    borderRadius: 50,
                    backgroundColor: node.color + "20",
                    borderWidth: selectedNodeId === node.id ? 3 : 2,
                    borderColor: selectedNodeId === node.id ? node.color : node.color + "80",
                    opacity: node.isCurrentlyLearning ? 1 : 0.8,
                  }}
                >
                  {/* Mastery Ring */}
                  <View
                    style={{
                      position: "absolute",
                      width: 100,
                      height: 100,
                      borderRadius: 50,
                      borderWidth: 3,
                      borderColor: node.color,
                      opacity: node.masteryPercentage / 100,
                    }}
                  />

                  {/* Node Content */}
                  <Text style={{ fontSize: 28, marginBottom: 4 }}>{node.icon}</Text>
                  <Text
                    style={{
                      fontSize: 10,
                      fontWeight: "700",
                      color: colors.foreground,
                      textAlign: "center",
                      maxWidth: 80,
                    }}
                    numberOfLines={2}
                  >
                    {node.label}
                  </Text>
                  <Text style={{ fontSize: 8, color: colors.muted, marginTop: 2 }}>
                    {Math.round(node.masteryPercentage)}%
                  </Text>
                </Pressable>
              </Animated.View>
            </G>
          ))}
        </Svg>
      </ScrollView>

      {/* Legend */}
      <View
        style={{
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          backgroundColor: colors.surface,
        }}
      >
        <Text style={{ fontSize: 12, fontWeight: "600", color: colors.foreground, marginBottom: 8 }}>
          Mastery Levels
        </Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
          {(Object.entries(MASTERYLEVELS) as [string, any][]).map(([level, info]) => (
            <View key={level} style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <View
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: 6,
                  backgroundColor: info.color,
                }}
              />
              <Text style={{ fontSize: 10, color: colors.muted }}>{info.name}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}
