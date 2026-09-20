import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { useSession } from "@/features/auth/SessionProvider";
import { isEliteUser, isProUser } from "@/lib/planAccess";
import { colors } from "@/theme/tokens";
import { fonts } from "@/theme/typography";
import type { AuthUser } from "@/types/auth";

const brandLogo = require("../../../assets/images/logo-tight.jpg");

function planLabel(user: AuthUser | null): string {
  if (isEliteUser(user)) return "Elite Plan";
  if (isProUser(user)) return "Pro Plan";
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
  const showCrown = isProUser(user);

  return (
    <View style={styles.bar}>
      <Image
        accessibilityLabel="Clutch Odds"
        resizeMode="contain"
        source={brandLogo}
        style={styles.logo}
      />

      <View
        accessibilityLabel={plan}
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
      </View>

      <Pressable
        accessibilityLabel={name}
        hitSlop={6}
        onPress={() => router.push("/(app)/(tabs)/profile")}
        style={styles.namePress}
      >
        <Text ellipsizeMode="tail" numberOfLines={1} style={styles.name}>
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
    paddingHorizontal: 12,
    paddingTop: 14,
    paddingBottom: 14,
    backgroundColor: colors.background,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  logo: {
    width: 148,
    height: 26,
    flexShrink: 0,
  },
  planPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: colors.primaryMuted,
    borderWidth: 1,
    borderColor: "rgba(255,30,30,0.32)",
    flexShrink: 0,
  },
  planText: {
    fontFamily: fonts.sansSemiBold,
    color: colors.text,
    fontSize: 12,
  },
  namePress: {
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
    alignItems: "flex-end",
    justifyContent: "center",
    paddingVertical: 4,
  },
  name: {
    fontFamily: fonts.sansSemiBold,
    color: colors.textMuted,
    fontSize: 12,
    letterSpacing: 0.3,
    textTransform: "uppercase",
    textAlign: "right",
    width: "100%",
  },
});
