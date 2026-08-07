import { Ionicons } from "@expo/vector-icons";
import { zodResolver } from "@hookform/resolvers/zod";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import {
  ActivityIndicator,
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
import { env } from "@/config/env";
import {
  getPasswordChecks,
  resetPasswordSchema,
  type ResetPasswordFormValues,
} from "@/features/auth/schemas";
import { authApi } from "@/lib/api/endpoints/auth";
import { fonts } from "@/theme/typography";

function resolveTokenParam(value: string | string[] | undefined): string {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw) return "";
  try {
    return decodeURIComponent(raw).trim();
  } catch {
    return raw.trim();
  }
}

function PasswordCheck({ label, ok }: { label: string; ok: boolean }) {
  return (
    <View style={styles.checkRow}>
      <Ionicons
        color={ok ? "#22C55E" : "#52525B"}
        name={ok ? "checkmark-circle" : "ellipse-outline"}
        size={16}
      />
      <Text style={[styles.checkText, ok ? styles.checkTextOk : null]}>
        {label}
      </Text>
    </View>
  );
}

type AuthFieldProps = {
  placeholder: string;
  value: string;
  onChangeText: (value: string) => void;
  error?: string;
};

function PasswordField({
  placeholder,
  value,
  onChangeText,
  error,
}: AuthFieldProps) {
  const [visible, setVisible] = useState(false);

  return (
    <View>
      <View style={[styles.inputShell, error ? styles.inputShellError : null]}>
        <Ionicons color="#8A8A93" name="lock-closed-outline" size={18} />
        <TextInput
          autoCapitalize="none"
          autoCorrect={false}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#6B6B73"
          secureTextEntry={!visible}
          style={styles.input}
          textContentType="newPassword"
          value={value}
        />
        <Pressable
          accessibilityLabel={visible ? "Hide password" : "Show password"}
          hitSlop={10}
          onPress={() => setVisible((current) => !current)}
        >
          <Ionicons
            color="#8A8A93"
            name={visible ? "eye-off-outline" : "eye-outline"}
            size={18}
          />
        </Pressable>
      </View>
      {error ? <Text style={styles.fieldError}>{error}</Text> : null}
    </View>
  );
}

export function ResetPasswordScreen() {
  const { height: windowHeight } = useWindowDimensions();
  const compact = windowHeight < 720;
  const params = useLocalSearchParams<{ token?: string | string[] }>();
  const token = resolveTokenParam(params.token);

  const [checking, setChecking] = useState(true);
  const [valid, setValid] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
    mode: "onChange",
  });

  const password = useWatch({ control, name: "password" }) ?? "";
  const checks = useMemo(() => getPasswordChecks(password), [password]);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (!token) {
        setValid(false);
        setChecking(false);
        return;
      }

      if (env.uiOnly) {
        setValid(true);
        setChecking(false);
        return;
      }

      try {
        const response = await authApi.validateResetToken(token);
        if (!cancelled) {
          setValid(Boolean(response.valid));
        }
      } catch {
        if (!cancelled) {
          setValid(false);
        }
      } finally {
        if (!cancelled) {
          setChecking(false);
        }
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      if (env.uiOnly) {
        setSuccessMessage("Your password has been updated.");
        setTimeout(() => router.replace("/(marketing)"), 1500);
        return;
      }

      const response = await authApi.resetPassword(token, values.password);
      setSuccessMessage(
        response.message ?? "Your password has been updated."
      );
      setTimeout(() => router.replace("/(marketing)"), 1800);
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "Unable to update password."
      );
    }
  });

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
                router.replace("/(marketing)");
              }
            }}
            style={styles.backButton}
          >
            <Ionicons color="#FFFFFF" name="arrow-back" size={22} />
          </Pressable>

          <View style={styles.hero}>
            <View style={styles.iconCircle}>
              <Ionicons color="#FFFFFF" name="shield-checkmark-outline" size={34} />
            </View>
            <Text style={[styles.title, compact ? styles.titleCompact : null]}>
              Reset password
            </Text>
            <Text style={styles.subtitle}>
              Choose a new password for your account.
            </Text>
          </View>

          {checking ? (
            <View style={styles.centerBlock}>
              <ActivityIndicator color="#FF1E1E" />
              <Text style={styles.muted}>Checking link…</Text>
            </View>
          ) : !valid ? (
            <View style={styles.centerBlock}>
              <Text style={styles.warnText}>
                This reset link is invalid or has expired.
              </Text>
              <Pressable
                onPress={() => router.replace("/(auth)/forgot-password")}
                style={({ pressed }) => [
                  styles.primaryButton,
                  pressed ? styles.pressed : null,
                ]}
              >
                <Text style={styles.primaryButtonText}>Request new link</Text>
              </Pressable>
              <Pressable
                onPress={() => router.replace("/(marketing)")}
                style={styles.footerLink}
              >
                <Text style={styles.footerLinkText}>Back to log in</Text>
              </Pressable>
            </View>
          ) : successMessage ? (
            <View style={styles.centerBlock}>
              <Text style={styles.successText}>{successMessage}</Text>
              <Text style={styles.muted}>Taking you back to log in…</Text>
            </View>
          ) : (
            <View style={styles.form}>
              <Controller
                control={control}
                name="password"
                render={({ field: { onChange, value } }) => (
                  <PasswordField
                    error={errors.password?.message}
                    onChangeText={onChange}
                    placeholder="New password"
                    value={value}
                  />
                )}
              />
              <Controller
                control={control}
                name="confirmPassword"
                render={({ field: { onChange, value } }) => (
                  <PasswordField
                    error={errors.confirmPassword?.message}
                    onChangeText={onChange}
                    placeholder="Confirm password"
                    value={value}
                  />
                )}
              />

              <View style={styles.checklist}>
                <PasswordCheck label="8+ characters" ok={checks.minLength} />
                <PasswordCheck label="1 number" ok={checks.hasNumber} />
                <PasswordCheck
                  label="1 uppercase letter"
                  ok={checks.hasUppercase}
                />
              </View>

              {formError ? (
                <Text style={styles.formError}>{formError}</Text>
              ) : null}

              <Pressable
                disabled={isSubmitting}
                onPress={() => void onSubmit()}
                style={({ pressed }) => [
                  styles.primaryButton,
                  pressed ? styles.pressed : null,
                  isSubmitting ? styles.disabled : null,
                ]}
              >
                <Text style={styles.primaryButtonText}>
                  {isSubmitting ? "Updating..." : "Update password"}
                </Text>
              </Pressable>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, overflow: "hidden" },
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
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "#1A1A1A",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
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
    paddingHorizontal: 8,
  },
  form: { gap: 12 },
  inputShell: {
    minHeight: 52,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    backgroundColor: "#141414",
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  inputShellError: {
    borderColor: "rgba(255,107,107,0.55)",
  },
  input: {
    flex: 1,
    color: "#FFFFFF",
    fontFamily: fonts.sansRegular,
    fontSize: 16,
    paddingVertical: Platform.OS === "web" ? 12 : 10,
  },
  fieldError: {
    marginTop: 6,
    fontFamily: fonts.sansRegular,
    color: "#FF6B6B",
    fontSize: 13,
  },
  checklist: { gap: 8, marginTop: 4 },
  checkRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  checkText: {
    fontFamily: fonts.sansRegular,
    color: "#52525B",
    fontSize: 13,
  },
  checkTextOk: { color: "#86EFAC" },
  formError: {
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
    marginTop: 8,
  },
  primaryButtonText: {
    fontFamily: fonts.sansBold,
    color: "#FFFFFF",
    fontSize: 16,
  },
  pressed: { opacity: 0.88 },
  disabled: { opacity: 0.55 },
  centerBlock: { gap: 14, alignItems: "center" },
  muted: {
    fontFamily: fonts.sansRegular,
    color: "#9CA3AF",
    fontSize: 14,
    textAlign: "center",
  },
  warnText: {
    fontFamily: fonts.sansRegular,
    color: "#FCD34D",
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(250,204,21,0.35)",
    backgroundColor: "rgba(66,32,6,0.35)",
    width: "100%",
  },
  successText: {
    fontFamily: fonts.sansRegular,
    color: "#86EFAC",
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(34,197,94,0.35)",
    backgroundColor: "rgba(22,101,52,0.25)",
    width: "100%",
  },
  footerLink: { marginTop: 8, alignItems: "center" },
  footerLinkText: {
    fontFamily: fonts.sansSemiBold,
    color: "#FF1E1E",
    fontSize: 14,
  },
});
