import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSession } from "@/features/auth/SessionProvider";
import { fonts } from "@/theme/typography";

const CODE_LENGTH = 6;
const RESEND_SECONDS = 30;

function formatTimer(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function resolveEmailParam(value: string | string[] | undefined): string {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw) return "";
  try {
    return decodeURIComponent(raw).trim();
  } catch {
    return raw.trim();
  }
}

export function VerifyEmailScreen() {
  const { verifyEmail, resendVerification } = useSession();
  const { height: windowHeight } = useWindowDimensions();
  const params = useLocalSearchParams<{ email?: string | string[] }>();
  const email = resolveEmailParam(params.email);

  const compact = windowHeight < 720;
  const [code, setCode] = useState("");
  const [focused, setFocused] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const inputRef = useRef<TextInput | null>(null);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const id = setInterval(() => {
      setSecondsLeft((current) => Math.max(0, current - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [secondsLeft]);

  const canVerify = code.length === CODE_LENGTH;
  const digits = Array.from({ length: CODE_LENGTH }, (_, index) => code[index] ?? "");

  const onChangeCode = (raw: string) => {
    setCode(raw.replace(/\D/g, "").slice(0, CODE_LENGTH));
  };

  const onResend = async () => {
    if (secondsLeft > 0) return;
    if (!email) {
      setFormError("Missing email address. Go back and sign up again.");
      return;
    }
    setFormError(null);
    try {
      await resendVerification(email);
      setSecondsLeft(RESEND_SECONDS);
      setCode("");
      inputRef.current?.focus();
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "Unable to resend code."
      );
    }
  };

  const onVerify = async () => {
    if (!canVerify || submitting) return;
    if (!email) {
      setFormError("Missing email address. Go back and sign up again.");
      return;
    }
    setFormError(null);
    setSubmitting(true);
    try {
      await verifyEmail(email, code);
      router.replace("/(app)/(tabs)/dashboard");
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "Unable to verify email."
      );
      setCode("");
      inputRef.current?.focus();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.flex}
      >
        <View style={[styles.screen, compact ? styles.screenCompact : null]}>
          <Pressable
            accessibilityLabel="Go back"
            hitSlop={12}
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace("/(auth)/signup");
              }
            }}
            style={styles.backButton}
          >
            <Ionicons color="#FFFFFF" name="arrow-back" size={22} />
          </Pressable>

          <View style={styles.hero}>
            <View style={styles.iconWrap}>
              <View style={styles.iconCircle}>
                <Ionicons color="#FFFFFF" name="mail-outline" size={36} />
              </View>
              <View style={styles.checkBadge}>
                <Ionicons color="#FFFFFF" name="checkmark" size={12} />
              </View>
            </View>

            <Text style={[styles.title, compact ? styles.titleCompact : null]}>
              Verify your email
            </Text>
            <Text style={styles.subtitle}>
              We sent a 6-digit code to{"\n"}
              <Text style={styles.emailText}>{email}</Text>
            </Text>
          </View>

          <Pressable
            onPress={() => inputRef.current?.focus()}
            style={styles.codeRow}
          >
            {digits.map((digit, index) => {
              const isActive =
                focused &&
                (index === code.length ||
                  (code.length === CODE_LENGTH && index === CODE_LENGTH - 1));
              return (
                <View
                  key={`otp-${index}`}
                  style={[
                    styles.codeBox,
                    isActive ? styles.codeBoxActive : null,
                  ]}
                >
                  <Text style={styles.codeDigit}>{digit}</Text>
                </View>
              );
            })}
            <TextInput
              ref={inputRef}
              autoCapitalize="none"
              autoCorrect={false}
              autoFocus
              caretHidden
              keyboardType="number-pad"
              maxLength={CODE_LENGTH}
              onBlur={() => setFocused(false)}
              onChangeText={onChangeCode}
              onFocus={() => setFocused(true)}
              style={styles.hiddenInput}
              textContentType="oneTimeCode"
              value={code}
            />
          </Pressable>

          <Text style={styles.timerText}>
            {secondsLeft > 0 ? (
              <>
                Resend code in{" "}
                <Text style={styles.timerAccent}>
                  {formatTimer(secondsLeft)}
                </Text>
              </>
            ) : (
              "You can resend a new code now."
            )}
          </Text>

          {formError ? <Text style={styles.formError}>{formError}</Text> : null}

          <Pressable
            disabled={!canVerify || submitting}
            onPress={() => void onVerify()}
            style={({ pressed }) => [
              styles.primaryButton,
              pressed ? styles.pressed : null,
              !canVerify || submitting ? styles.disabled : null,
            ]}
          >
            <Text style={styles.primaryButtonText}>
              {submitting ? "Verifying..." : "Verify Email"}
            </Text>
          </Pressable>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Didn't receive the code? </Text>
            <Pressable
              disabled={secondsLeft > 0}
              onPress={() => void onResend()}
            >
              <Text
                style={[
                  styles.footerLink,
                  secondsLeft > 0 ? styles.footerLinkDisabled : null,
                ]}
              >
                Resend
              </Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    overflow: "hidden",
  },
  safeArea: {
    flex: 1,
    backgroundColor: "#000000",
    overflow: "hidden",
  },
  screen: {
    flex: 1,
    width: "100%",
    maxWidth: 430,
    alignSelf: "center",
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 52,
    justifyContent: "center",
  },
  screenCompact: {
    paddingTop: 20,
    paddingBottom: 40,
    justifyContent: "flex-start",
  },
  backButton: {
    position: "absolute",
    top: 8,
    left: 24,
    width: 40,
    height: 40,
    alignItems: "flex-start",
    justifyContent: "center",
    zIndex: 2,
  },
  hero: {
    alignItems: "center",
    marginBottom: 28,
  },
  iconWrap: {
    width: 96,
    height: 96,
    marginBottom: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "#1A1A1A",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  checkBadge: {
    position: "absolute",
    right: 4,
    bottom: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#FF1E1E",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#000000",
  },
  title: {
    fontFamily: fonts.displayBold,
    color: "#FFFFFF",
    fontSize: 34,
    lineHeight: 40,
    letterSpacing: -0.4,
    textAlign: "center",
  },
  titleCompact: {
    fontSize: 30,
    lineHeight: 36,
  },
  subtitle: {
    marginTop: 10,
    fontFamily: fonts.sansRegular,
    color: "#9CA3AF",
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
  },
  emailText: {
    color: "#D4D4D8",
    fontFamily: fonts.sansMedium,
  },
  codeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
    marginBottom: 18,
    position: "relative",
  },
  codeBox: {
    flex: 1,
    minHeight: 54,
    maxWidth: 52,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    backgroundColor: "#141414",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Platform.OS === "web" ? 12 : 10,
  },
  codeBoxActive: {
    borderColor: "#FF1E1E",
  },
  codeDigit: {
    color: "#FFFFFF",
    fontFamily: fonts.sansBold,
    fontSize: 22,
  },
  hiddenInput: {
    ...StyleSheet.absoluteFill,
    opacity: 0.02,
    color: "transparent",
  },
  timerText: {
    fontFamily: fonts.sansRegular,
    color: "#9CA3AF",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 24,
  },
  timerAccent: {
    color: "#FF1E1E",
    fontFamily: fonts.sansSemiBold,
  },
  formError: {
    marginTop: -12,
    marginBottom: 12,
    fontFamily: fonts.sansRegular,
    color: "#FF6B6B",
    fontSize: 13,
    textAlign: "center",
  },
  primaryButton: {
    minHeight: 50,
    borderRadius: 12,
    backgroundColor: "#FF1E1E",
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonText: {
    fontFamily: fonts.sansBold,
    color: "#FFFFFF",
    fontSize: 16,
  },
  pressed: {
    opacity: 0.88,
  },
  disabled: {
    opacity: 0.55,
  },
  footer: {
    marginTop: 28,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    flexWrap: "wrap",
  },
  footerText: {
    fontFamily: fonts.sansRegular,
    color: "#9CA3AF",
    fontSize: 14,
  },
  footerLink: {
    fontFamily: fonts.sansSemiBold,
    color: "#FF1E1E",
    fontSize: 14,
  },
  footerLinkDisabled: {
    color: "#52525B",
  },
});
