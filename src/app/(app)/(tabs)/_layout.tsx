import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { Platform, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "@/theme/tokens";
import { fonts } from "@/theme/typography";

type TabIconProps = {
  color: string;
  size: number;
  focused: boolean;
  name: keyof typeof Ionicons.glyphMap;
  nameFocused: keyof typeof Ionicons.glyphMap;
};

function TabIcon({ color, size, focused, name, nameFocused }: TabIconProps) {
  return (
    <Ionicons
      color={color}
      name={focused ? nameFocused : name}
      size={size}
    />
  );
}

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  // Web often reports 0 inset — keep room so labels aren't clipped.
  const bottomPad = Math.max(insets.bottom, Platform.OS === "web" ? 12 : 8);
  const contentHeight = 62;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: "#6B7280",
        tabBarLabelStyle: styles.tabLabel,
        tabBarItemStyle: styles.tabItem,
        tabBarIconStyle: styles.tabIcon,
        tabBarStyle: [
          styles.tabBar,
          {
            height: contentHeight + bottomPad,
            paddingBottom: bottomPad,
            paddingTop: 8,
          },
        ],
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon
              color={String(color)}
              focused={focused}
              name="grid-outline"
              nameFocused="grid"
              size={size}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="arbitrage"
        options={{
          title: "Arbs",
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon
              color={String(color)}
              focused={focused}
              name="flash-outline"
              nameFocused="flash"
              size={size}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="edge-center"
        options={{
          title: "Edge",
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon
              color={String(color)}
              focused={focused}
              name="analytics-outline"
              nameFocused="analytics"
              size={size}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="my-bets"
        options={{
          title: "Bets",
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon
              color={String(color)}
              focused={focused}
              name="receipt-outline"
              nameFocused="receipt"
              size={size}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="bookmakers"
        options={{
          title: "Books",
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon
              color={String(color)}
              focused={focused}
              name="business-outline"
              nameFocused="business"
              size={size}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon
              color={String(color)}
              focused={focused}
              name="settings-outline"
              nameFocused="settings"
              size={size}
            />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: "#0A0A0A",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(255,255,255,0.10)",
    elevation: 0,
    shadowOpacity: 0,
    overflow: "visible",
  },
  tabLabel: {
    fontFamily: fonts.sansMedium,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 0.2,
    marginTop: 2,
    marginBottom: 0,
  },
  tabItem: {
    paddingTop: 0,
    paddingBottom: 0,
    height: "100%",
    justifyContent: "center",
  },
  tabIcon: {
    marginTop: 0,
  },
});
