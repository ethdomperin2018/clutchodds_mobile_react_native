import { Redirect, useLocalSearchParams, useRouter, type Href } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { useSession } from "@/features/auth/SessionProvider";
import { fonts } from "@/theme/typography";

/**
 * Landing for Google OAuth redirects after same-tab (web) or deep-link (native)
 * completion: `/auth/google?token=…` or `clutchodds://auth/google?token=…`.
 */
export default function GoogleAuthCallbackScreen() {
  const router = useRouter();
  const { completeGoogleSignIn } = useSession();
  const params = useLocalSearchParams<{ token?: string; error?: string }>();
  const [message, setMessage] = useState("Finishing Google sign-in…");
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    const run = async () => {
      const error = typeof params.error === "string" ? params.error : null;
      const token = typeof params.token === "string" ? params.token : null;

      if (error || !token) {
        setMessage("Google sign-in failed.");
        router.replace("/");
        return;
      }

      try {
        await completeGoogleSignIn(token);
        router.replace("/(app)/(tabs)/" as Href);
      } catch {
        setMessage("Google sign-in failed.");
        router.replace("/");
      }
    };

    void run();
  }, [completeGoogleSignIn, params.error, params.token, router]);

  if (!params.token && !params.error) {
    return <Redirect href="/" />;
  }

  return (
    <View style={styles.screen}>
      <ActivityIndicator color="#F5F5F7" />
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#050505",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: 24,
  },
  text: {
    color: "#C8C8D0",
    fontFamily: fonts.sansMedium,
    fontSize: 15,
    textAlign: "center",
  },
});
