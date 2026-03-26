/**
 * Knowledge Graph Visualization Component
 * Displays interactive mind map of concept relationships
 */

import React, { useState, useCallback } from "react";
import { View, Text, Pressable, ScrollView, Dimensions } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { cn } from "@/lib/utils";
import { useColors } from "@/hooks/use-colors";
import { getResponsiveFontSize, getResponsiveSpacing } from "@/lib/responsive";

interface ConceptNode {
  id: number;
  name: string;
  slug: string;
  confidence: number; // 0-1
  isPrerequisite: boolean;
  isRelated: boolean;
}

interface ConceptRelationship {
  sourceId: number;
  targetId: number;
  type: "prerequisite" | "related" | "extends" | "opposite";
  strength: number; // 0-1
}

interface KnowledgeGraphVisualizationProps {
  centralConcept: ConceptNode;
  nodes: ConceptNode[];
  relationships: ConceptRelationship[];
  onNodePress?: (node: ConceptNode) => void;
  onRelationshipPress?: (relationship: ConceptRelationship) => void;
}

export function KnowledgeGraphVisualization({
  centralConcept,
  nodes,
  relationships,
  onNodePress,
  onRelationshipPress,
}: KnowledgeGraphVisualizationProps) {
  const colors = useColors();
  const [selectedNode, setSelectedNode] = useState<number | null>(null);
  const screenWidth = Dimensions.get("window").width;

  const handleNodePress = useCallback(
    (node: ConceptNode) => {
      setSelectedNode(node.id);
      onNodePress?.(node);
    },
    [onNodePress]
  );

  // Calculate node positions in a circular layout
  const calculateNodePosition = (index: number, total: number, radius: number) => {
    const angle = (index / total) * 2 * Math.PI;
    return {
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
    };
  };

  const nodeRadius = Math.min(screenWidth * 0.35, 120);
  const layoutRadius = Math.min(screenWidth * 0.3, 100);

  // Get prerequisites and related concepts
  const prerequisites = nodes.filter((n) => n.isPrerequisite);
  const relatedConcepts = nodes.filter((n) => n.isRelated && !n.isPrerequisite);

  return (
    <ScrollView
      contentContainerStyle={{ flexGrow: 1 }}
      className="flex-1 bg-background"
      scrollEnabled
    >
      <View className="flex-1 p-4 items-center justify-center">
        {/* Title */}
        <Text
          className="text-foreground font-bold mb-4"
          style={{ fontSize: getResponsiveFontSize(18) }}
        >
          Knowledge Map
        </Text>

        {/* Central Concept */}
        <Animated.View entering={FadeIn.duration(300)}>
          <Pressable
            onPress={() => handleNodePress(centralConcept)}
            className={cn(
              "rounded-full items-center justify-center border-2",
              selectedNode === centralConcept.id
                ? "bg-primary border-primary"
                : "bg-surface border-primary"
            )}
            style={{
              width: nodeRadius * 2,
              height: nodeRadius * 2,
            }}
          >
            <Text
              className={cn(
                "font-bold text-center px-3",
                selectedNode === centralConcept.id ? "text-background" : "text-foreground"
              )}
              style={{ fontSize: getResponsiveFontSize(14) }}
              numberOfLines={2}
            >
              {centralConcept.name}
            </Text>
          </Pressable>
        </Animated.View>

        {/* Prerequisites Section */}
        {prerequisites.length > 0 && (
          <View className="mt-8 w-full">
            <Text
              className="text-muted font-semibold mb-3 text-center"
              style={{ fontSize: getResponsiveFontSize(12) }}
            >
              Prerequisites
            </Text>
            <View className="flex-row flex-wrap justify-center gap-2">
              {prerequisites.map((node, idx) => (
                <Animated.View key={node.id} entering={FadeIn.delay(100 + idx * 50)}>
                  <Pressable
                    onPress={() => handleNodePress(node)}
                    className={cn(
                      "rounded-lg px-3 py-2 border border-border",
                      selectedNode === node.id
                        ? "bg-primary"
                        : node.confidence > 0.7
                          ? "bg-success/20"
                          : "bg-warning/20"
                    )}
                  >
                    <Text
                      className={cn(
                        "font-medium text-center",
                        selectedNode === node.id ? "text-background" : "text-foreground"
                      )}
                      style={{ fontSize: getResponsiveFontSize(11) }}
                      numberOfLines={1}
                    >
                      {node.name}
                    </Text>
                    <Text
                      className={cn(
                        "text-xs text-center mt-1",
                        selectedNode === node.id ? "text-background/80" : "text-muted"
                      )}
                    >
                      {Math.round(node.confidence * 100)}%
                    </Text>
                  </Pressable>
                </Animated.View>
              ))}
            </View>
          </View>
        )}

        {/* Related Concepts Section */}
        {relatedConcepts.length > 0 && (
          <View className="mt-8 w-full">
            <Text
              className="text-muted font-semibold mb-3 text-center"
              style={{ fontSize: getResponsiveFontSize(12) }}
            >
              Related Topics
            </Text>
            <View className="flex-row flex-wrap justify-center gap-2">
              {relatedConcepts.map((node, idx) => (
                <Animated.View key={node.id} entering={FadeIn.delay(100 + idx * 50)}>
                  <Pressable
                    onPress={() => handleNodePress(node)}
                    className={cn(
                      "rounded-lg px-3 py-2 border border-border",
                      selectedNode === node.id ? "bg-primary" : "bg-surface"
                    )}
                  >
                    <Text
                      className={cn(
                        "font-medium text-center",
                        selectedNode === node.id ? "text-background" : "text-foreground"
                      )}
                      style={{ fontSize: getResponsiveFontSize(11) }}
                      numberOfLines={1}
                    >
                      {node.name}
                    </Text>
                  </Pressable>
                </Animated.View>
              ))}
            </View>
          </View>
        )}

        {/* Selected Node Details */}
        {selectedNode && selectedNode !== centralConcept.id && (
          <Animated.View
            entering={FadeIn}
            className="mt-8 w-full bg-surface rounded-lg p-4 border border-border"
          >
            {(() => {
              const selected = nodes.find((n) => n.id === selectedNode);
              return selected ? (
                <>
                  <Text
                    className="text-foreground font-bold mb-2"
                    style={{ fontSize: getResponsiveFontSize(14) }}
                  >
                    {selected.name}
                  </Text>
                  <View className="flex-row items-center gap-2 mb-3">
                    <Text className="text-muted text-sm">Confidence:</Text>
                    <View className="flex-1 h-2 bg-border rounded-full overflow-hidden">
                      <View
                        className="h-full bg-primary"
                        style={{ width: `${selected.confidence * 100}%` }}
                      />
                    </View>
                    <Text className="text-muted text-sm font-semibold">
                      {Math.round(selected.confidence * 100)}%
                    </Text>
                  </View>
                  <View className="flex-row gap-2">
                    {selected.isPrerequisite && (
                      <View className="bg-warning/20 rounded px-2 py-1">
                        <Text className="text-warning text-xs font-semibold">Prerequisite</Text>
                      </View>
                    )}
                    {selected.isRelated && (
                      <View className="bg-primary/20 rounded px-2 py-1">
                        <Text className="text-primary text-xs font-semibold">Related</Text>
                      </View>
                    )}
                  </View>
                </>
              ) : null;
            })()}
          </Animated.View>
        )}

        {/* Empty State */}
        {nodes.length === 0 && (
          <View className="mt-8 items-center">
            <Text className="text-muted text-center" style={{ fontSize: getResponsiveFontSize(12) }}>
              No related concepts yet. Learn more to expand your knowledge map!
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}
