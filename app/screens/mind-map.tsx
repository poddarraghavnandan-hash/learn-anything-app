/**
 * Mind Map Screen
 * Displays user's knowledge graph with all learned concepts and prerequisites
 */

import React, { useEffect, useState } from "react";
import { View, Text, ActivityIndicator, Pressable } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { MindMapVisualization, type ConceptNode, type PrerequisiteEdge } from "@/components/mind-map-visualization";
import { useColors } from "@/hooks/use-colors";
import { useRouter } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

interface MindMapData {
  nodes: ConceptNode[];
  edges: PrerequisiteEdge[];
  stats: {
    totalConcepts: number;
    masteredConcepts: number;
    learningConcepts: number;
    averageMastery: number;
  };
}

export default function MindMapScreen() {
  const colors = useColors();
  const router = useRouter();
  const [mindMapData, setMindMapData] = useState<MindMapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedNodeId, setSelectedNodeId] = useState<string | undefined>(undefined);

  useEffect(() => {
    loadMindMap();
  }, []);

  const loadMindMap = async () => {
    try {
      setLoading(true);
      // TODO: Fetch mind map data from API
      // const response = await fetch('/api/trpc/mindMap.getUserMindMap');
      // const data = await response.json();
      // setMindMapData(data);

      // Placeholder data for now
      setMindMapData({
        nodes: [
          {
            id: "1",
            label: "Quantum Mechanics",
            masteryPercentage: 85,
            masteryLevel: 4,
            isLearned: true,
            isCurrentlyLearning: false,
            color: "#8b5cf6",
            icon: "⚛️",
            x: 0,
            y: 0,
          },
          {
            id: "2",
            label: "Wave-Particle Duality",
            masteryPercentage: 70,
            masteryLevel: 3,
            isLearned: true,
            isCurrentlyLearning: true,
            color: "#3b82f6",
            icon: "🌊",
            x: 150,
            y: -100,
          },
          {
            id: "3",
            label: "Schrödinger Equation",
            masteryPercentage: 60,
            masteryLevel: 2,
            isLearned: true,
            isCurrentlyLearning: true,
            color: "#f59e0b",
            icon: "📐",
            x: -150,
            y: -100,
          },
        ],
        edges: [
          { from: "1", to: "2", isCompleted: true },
          { from: "1", to: "3", isCompleted: true },
        ],
        stats: {
          totalConcepts: 3,
          masteredConcepts: 1,
          learningConcepts: 2,
          averageMastery: 71.67,
        },
      });
    } catch (error) {
      console.error("Error loading mind map:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleNodePress = (nodeId: string) => {
    setSelectedNodeId(nodeId);
    // TODO: Navigate to concept detail screen
  };

  if (loading) {
    return (
      <ScreenContainer className="items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ color: colors.muted, marginTop: 12 }}>Loading your knowledge map...</Text>
      </ScreenContainer>
    );
  }

  if (!mindMapData) {
    return (
      <ScreenContainer className="items-center justify-center">
        <Text style={{ color: colors.foreground, fontSize: 16, fontWeight: "600" }}>No concepts learned yet</Text>
        <Text style={{ color: colors.muted, marginTop: 8 }}>Start learning to build your knowledge graph</Text>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="p-0">
      {/* Header */}
      <View
        style={{
          paddingHorizontal: 16,
          paddingVertical: 12,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottomColor: colors.border,
          borderBottomWidth: 1,
        }}
      >
        <View>
          <Text style={{ fontSize: 18, fontWeight: "700", color: colors.foreground }}>Your Knowledge Map</Text>
          <Text style={{ fontSize: 12, color: colors.muted, marginTop: 2 }}>
            {mindMapData.stats.totalConcepts} concepts • {Math.round(mindMapData.stats.averageMastery)}% average mastery
          </Text>
        </View>
        <Pressable onPress={() => router.back()} style={{ padding: 8 }}>
          <MaterialIcons name="close" size={24} color={colors.foreground} />
        </Pressable>
      </View>

      {/* Stats Cards */}
      <View
        style={{
          paddingHorizontal: 16,
          paddingVertical: 12,
          flexDirection: "row",
          gap: 8,
        }}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: colors.surface,
            borderRadius: 12,
            padding: 12,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <Text style={{ fontSize: 11, color: colors.muted, fontWeight: "600" }}>Mastered</Text>
          <Text style={{ fontSize: 20, fontWeight: "700", color: "#10b981", marginTop: 4 }}>
            {mindMapData.stats.masteredConcepts}
          </Text>
        </View>
        <View
          style={{
            flex: 1,
            backgroundColor: colors.surface,
            borderRadius: 12,
            padding: 12,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <Text style={{ fontSize: 11, color: colors.muted, fontWeight: "600" }}>Learning</Text>
          <Text style={{ fontSize: 20, fontWeight: "700", color: colors.primary, marginTop: 4 }}>
            {mindMapData.stats.learningConcepts}
          </Text>
        </View>
        <View
          style={{
            flex: 1,
            backgroundColor: colors.surface,
            borderRadius: 12,
            padding: 12,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <Text style={{ fontSize: 11, color: colors.muted, fontWeight: "600" }}>Average</Text>
          <Text style={{ fontSize: 20, fontWeight: "700", color: colors.foreground, marginTop: 4 }}>
            {Math.round(mindMapData.stats.averageMastery)}%
          </Text>
        </View>
      </View>

      {/* Mind Map Visualization */}
      <MindMapVisualization
        nodes={mindMapData.nodes}
        edges={mindMapData.edges}
        onNodePress={handleNodePress}
        selectedNodeId={selectedNodeId}
        showMasteryFilter={true}
      />
    </ScreenContainer>
  );
}
