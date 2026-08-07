import { Ionicons } from "@expo/vector-icons";
import { zodResolver } from "@hookform/resolvers/zod";
import { router } from "expo-router";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
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
import { env } from "@/config/env";
import {
  forgotPasswordSchema,
  type ForgotPasswordFormValues,
} from "@/features/auth/schemas";
import { authApi } from "@/lib/api/endpoints/auth";
import { fonts } from "@/theme/typography";

export function ForgotPasswordScreen() {
  const { height: windowHeight } = useWindowDimensions();
  const compact = windowHeight < 720;
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
    mode: "onChange",
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    setSuccessMessage(null);
    try {
      if (env.uiOnly) {
        setSuccessMessage(
          "If an account exists with that email, we sent a password reset link."
        );
        return;
      }

      const response = await authApi.forgotPassword(values.email);
      setSuccessMessage(
        response.message ??
          "If an account exists with that email, we sent a password reset link."
      );
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : "Unable to send reset link."
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
              <Ionicons color="#FFFFFF" name="key-outline" size={34} />
            </View>
            <Text style={[styles.title, compact ? styles.titleCompact : null]}>
              Forgot password?
            </Text>
            <Text style={styles.subtitle}>
              Enter your email and we'll send you a link to reset your password.
            </Text>
          </View>

          {successMessage ? (
            <View style={styles.successBlock}>
              <Text style={styles.successText}>{successMessage}</Text>
            <Text style={styles.successHint}>
              Check your inbox (and spam). Open the link on this device to reset
              in the app. The link expires in 1 hour.
            </Text>
              <Pressable
                onPress={() => router.replace("/(marketing)")}
                style={({ pressed }) => [
                  styles.primaryButton,
                  pressed ? styles.pressed : null,
                ]}
              >
                <Text style={styles.primaryButtonText}>Back to log in</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.form}>
              <Controller
                control={control}
                name="email"
                render={({ field: { onChange, value } }) => (
                  <View
                    style={[
                      styles.inputShell,
                      errors.email ? styles.inputShellError : null,
                    ]}
                  >
                    <Ionicons color="#8A8A93" name="mail-outline" size={18} />
                    <TextInput
                      autoCapitalize="none"
                      autoCorrect={false}
                      keyboardType="email-address"
                      onChangeText={onChange}
                      placeholder="Email"
                      placeholderTextColor="#6B6B73"
                      style={styles.input}
                      textContentType="emailAddress"
                      value={value}
                    />
                  </View>
                )}
              />
              {errors.email ? (
                <Text style={styles.fieldError}>{errors.email.message}</Text>
              ) : null}

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
                  {isSubmitting ? "Sending..." : "Send reset link"}
                </Text>
              </Pressable>

              <Pressable
                onPress={() => router.replace("/(marketing)")}
                style={styles.footerLink}
              >
                <Text style={styles.footerLinkText}>Back to log in</Text>
              </Pressable>
            </View>
          )}
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
  form: {
    gap: 12,
  },
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
    marginTop: -4,
    fontFamily: fonts.sansRegular,
    color: "#FF6B6B",
    fontSize: 13,
  },
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
  pressed: {
    opacity: 0.88,
  },
  disabled: {
    opacity: 0.55,
  },
  footerLink: {
    marginTop: 18,
    alignItems: "center",
  },
  footerLinkText: {
    fontFamily: fonts.sansSemiBold,
    color: "#FF1E1E",
    fontSize: 14,
  },
  successBlock: {
    gap: 12,
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
  },
  successHint: {
    fontFamily: fonts.sansRegular,
    color: "#9CA3AF",
    fontSize: 13,
    lineHeight: 20,
    textAlign: "center",
  },
});
