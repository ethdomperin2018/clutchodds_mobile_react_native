import { Tabs } from "expo-router";
import { Platform, StyleSheet, View } from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import {
  NavIconArbitrage,
  NavIconDashboard,
  NavIconEdgeCenter,
  NavIconMore,
  NavIconPrediction,
} from "@/components/icons/appNavIcons";
import { AppHeader } from "@/components/layout/AppHeader";
import { MoreTabButton } from "@/features/more/MoreTabButton";
import { SEPARATOR_THICKNESS, separatorColor } from "@/theme/separator";
import { colors } from "@/theme/tokens";
import { fonts } from "@/theme/typography";

/** Default tab when opening /(app)/(tabs) without a specific screen. */
export const unstable_settings = {
  initialRouteName: "index",
};

/** Drawn as a View — CSS/border hairlines often disappear on iPhone Retina. */
function TabBarBackground() {
  return (
    <View style={styles.tabBarBackground}>
      <View style={styles.tabBarTopLine} />
    </View>
  );
}

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const bottomPad = Math.max(insets.bottom, Platform.OS === "web" ? 12 : 8);
  const contentHeight = 58;

  return (
    <View style={styles.root}>
      <SafeAreaView edges={["top"]} style={styles.headerSafe}>
        <AppHeader />
      </SafeAreaView>

      <View style={styles.tabsWrap}>
        <Tabs
          initialRouteName="index"
          screenOptions={{
            headerShown: false,
            tabBarActiveTintColor: colors.primary,
            tabBarInactiveTintColor: "#E8E8EC",
            tabBarLabelStyle: styles.tabLabel,
            tabBarItemStyle: styles.tabItem,
            tabBarIconStyle: styles.tabIcon,
            tabBarBackground: () => <TabBarBackground />,
            tabBarStyle: [
              styles.tabBar,
              {
                height: contentHeight + bottomPad,
                paddingBottom: bottomPad,
                paddingTop: 6,
              },
            ],
          }}
        >
          <Tabs.Screen
            name="index"
            options={{
              title: "Dashboard",
              tabBarIcon: ({ color, size }) => (
                <NavIconDashboard color={String(color)} size={size} />
              ),
            }}
          />
          <Tabs.Screen
            name="edge-center"
            options={{
              title: "Edge Center",
              tabBarIcon: ({ color, size }) => (
                <NavIconEdgeCenter color={String(color)} size={size} />
              ),
            }}
          />
          <Tabs.Screen
            name="arbitrage"
            options={{
              title: "Arbitrage",
              tabBarIcon: ({ color, size }) => (
                <NavIconArbitrage color={String(color)} size={size} />
              ),
            }}
          />
          <Tabs.Screen
            name="prediction"
            options={{
              title: "Prediction",
              tabBarIcon: ({ color, size }) => (
                <NavIconPrediction color={String(color)} size={size} />
              ),
            }}
          />
          <Tabs.Screen
            name="more"
            listeners={{
              tabPress: (event) => {
                event.preventDefault();
              },
            }}
            options={{
              title: "More",
              tabBarButton: (props) => <MoreTabButton {...props} />,
              tabBarIcon: ({ color, size }) => (
                <NavIconMore color={String(color)} size={size} />
              ),
            }}
          />
          <Tabs.Screen
            name="profile"
            options={{
              href: null,
            }}
          />
          <Tabs.Screen
            name="settings"
            options={{
              href: null,
            }}
          />
          <Tabs.Screen
            name="dashboard"
            options={{
              href: null,
            }}
          />
          <Tabs.Screen
            name="my-bets"
            options={{
              href: null,
            }}
          />
          <Tabs.Screen
            name="bookmakers"
            options={{
              href: null,
            }}
          />
          <Tabs.Screen
            name="alerts"
            options={{
              href: null,
            }}
          />
        </Tabs>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerSafe: {
    backgroundColor: colors.background,
  },
  tabsWrap: {
    flex: 1,
  },
  tabBar: {
    backgroundColor: "transparent",
    borderTopWidth: 0,
    elevation: 0,
    shadowOpacity: 0,
    overflow: "visible",
  },
  tabBarBackground: {
    flex: 1,
    backgroundColor: "#000000",
  },
  tabBarTopLine: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: SEPARATOR_THICKNESS,
    backgroundColor: separatorColor,
  },
  tabLabel: {
    fontFamily: fonts.sansMedium,
    fontSize: 10,
    lineHeight: 12,
    letterSpacing: 0.1,
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
