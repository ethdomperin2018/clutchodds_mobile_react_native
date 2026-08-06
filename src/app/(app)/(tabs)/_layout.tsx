import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { colors } from "@/theme/tokens";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <Ionicons color={color} name="grid-outline" size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="arbitrage"
        options={{
          title: "Arbs",
          tabBarIcon: ({ color, size }) => (
            <Ionicons color={color} name="flash-outline" size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="edge-center"
        options={{
          title: "Edge",
          tabBarIcon: ({ color, size }) => (
            <Ionicons color={color} name="analytics-outline" size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="my-bets"
        options={{
          title: "Bets",
          tabBarIcon: ({ color, size }) => (
            <Ionicons color={color} name="receipt-outline" size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="bookmakers"
        options={{
          title: "Books",
          tabBarIcon: ({ color, size }) => (
            <Ionicons color={color} name="business-outline" size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color, size }) => (
            <Ionicons color={color} name="settings-outline" size={size} />
          ),
        }}
      />
    </Tabs>
  );
}
