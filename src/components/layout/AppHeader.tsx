import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { useSession } from "@/features/auth/SessionProvider";
import { colors } from "@/theme/tokens";
import { fonts } from "@/theme/typography";
import type { AuthUser } from "@/types/auth";

const brandLogo = require("../../../assets/images/logo-tight.jpg");

function planLabel(user: AuthUser | null): string {
  if (!user) return "Free Plan";
  if (user.plan === "elite") return "Elite Plan";
  if (user.plan === "pro") return "Pro Plan";
  return "Free Plan";
}

function displayName(user: AuthUser | null): string {
  const name = user?.name?.trim();
  if (name) return name;
  const email = user?.email?.trim();
  if (email) return email.split("@")[0] || email;
  return "Account";
}

export function AppHeader() {
  const { user } = useSession();
  const name = displayName(user);
  const plan = planLabel(user);
  const showCrown = user?.plan === "pro" || user?.plan === "elite";

  return (
    <View style={styles.bar}>
      <Image
        accessibilityLabel="Clutch Odds"
        resizeMode="contain"
        source={brandLogo}
        style={styles.logo}
      />

      <Pressable
        accessibilityLabel={plan}
        onPress={() => router.push("/(app)/(tabs)/profile")}
        style={styles.planPill}
      >
        {showCrown ? (
          <MaterialCommunityIcons
            color={colors.primary}
            name="crown"
            size={12}
          />
        ) : null}
        <Text style={styles.planText} numberOfLines={1}>
          {plan}
        </Text>
        <Ionicons color={colors.textMuted} name="chevron-down" size={11} />
      </Pressable>

      <Pressable
        accessibilityLabel={name}
        hitSlop={6}
        onPress={() => router.push("/(app)/(tabs)/profile")}
        style={styles.namePress}
      >
        <Text style={styles.name} numberOfLines={1}>
          {name}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 10,
    backgroundColor: colors.background,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  logo: {
    width: 156,
    height: 27,
    flexShrink: 0,
  },
  planPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: colors.primaryMuted,
    borderWidth: 1,
    borderColor: "rgba(255,30,30,0.32)",
    flexShrink: 1,
    maxWidth: 118,
  },
  planText: {
    fontFamily: fonts.sansSemiBold,
    color: colors.text,
    fontSize: 12,
  },
  namePress: {
    flex: 1,
    minWidth: 48,
    alignItems: "flex-end",
    justifyContent: "center",
    paddingVertical: 2,
  },
  name: {
    fontFamily: fonts.sansSemiBold,
    color: colors.textMuted,
    fontSize: 12,
    letterSpacing: 0.3,
    textTransform: "uppercase",
    textAlign: "right",
  },
});
