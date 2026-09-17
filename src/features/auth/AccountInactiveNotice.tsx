import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSession } from "@/features/auth/SessionProvider";
import {
  getAccountStatusLabel,
  getAccountStatusMessage,
} from "@/lib/accountStatus";
import { fonts } from "@/theme/typography";

/** Matches web `AccountInactiveNotice`. */
export function AccountInactiveNotice() {
  const { user, logout } = useSession();
  if (!user) return null;

  return (
    <View style={styles.card}>
      <View style={styles.iconWrap}>
        <Ionicons color="#FBBF24" name="warning-outline" size={24} />
      </View>
      <Text style={styles.eyebrow}>
        Account {getAccountStatusLabel(user.accountStatus)}
      </Text>
      <Text style={styles.title}>Access paused</Text>
      <Text style={styles.copy}>
        {getAccountStatusMessage(user.accountStatus)}
      </Text>
      <Pressable
        onPress={() => void logout()}
        style={({ pressed }) => [
          styles.logoutBtn,
          pressed ? styles.pressed : null,
        ]}
      >
        <Text style={styles.logoutText}>Log out</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(120,53,15,0.4)",
    backgroundColor: "rgba(69,26,3,0.25)",
    paddingHorizontal: 24,
    paddingVertical: 40,
    alignItems: "center",
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(146,64,14,0.5)",
    backgroundColor: "rgba(69,26,3,0.6)",
    alignItems: "center",
    justifyContent: "center",
  },
  eyebrow: {
    marginTop: 16,
    fontFamily: fonts.sansBold,
    color: "#FCD34D",
    fontSize: 11,
    letterSpacing: 1.6,
    textTransform: "uppercase",
  },
  title: {
    marginTop: 8,
    fontFamily: fonts.displaySemiBold,
    color: "#FFFFFF",
    fontSize: 20,
    textAlign: "center",
  },
  copy: {
    marginTop: 12,
    maxWidth: 360,
    fontFamily: fonts.sansRegular,
    color: "#A1A1AA",
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
  logoutBtn: {
    marginTop: 32,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  logoutText: {
    fontFamily: fonts.sansBold,
    color: "#E4E4E7",
    fontSize: 12,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  pressed: {
    opacity: 0.85,
  },
});
