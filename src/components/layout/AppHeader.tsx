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
            size={13}
          />
        ) : null}
        <Text style={styles.planText} numberOfLines={1}>
          {plan}
        </Text>
        <Ionicons color={colors.textMuted} name="chevron-down" size={12} />
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
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 14,
    backgroundColor: colors.background,
  },
  logo: {
    width: 190,
    height: 33,
    flexShrink: 0,
  },
  planPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: colors.primaryMuted,
    borderWidth: 1,
    borderColor: "rgba(255,30,30,0.32)",
    flexShrink: 1,
    maxWidth: 128,
  },
  planText: {
    fontFamily: fonts.sansSemiBold,
    color: colors.text,
    fontSize: 12,
  },
  namePress: {
    flex: 1,
    minWidth: 56,
    alignItems: "flex-end",
    justifyContent: "center",
    paddingVertical: 4,
  },
  name: {
    fontFamily: fonts.sansSemiBold,
    color: colors.textMuted,
    fontSize: 12,
    letterSpacing: 0.4,
    textTransform: "uppercase",
    textAlign: "right",
  },
});
