import { Ionicons } from "@expo/vector-icons";
import { zodResolver } from "@hookform/resolvers/zod";
import { router, type Href } from "expo-router";
import { useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppleSignInButton } from "@/features/auth/AppleSignInButton";
import { useSession } from "@/features/auth/SessionProvider";
import {
  getPasswordChecks,
  signupSchema,
  type SignupFormValues,
} from "@/features/auth/schemas";
import {
  openPrivacyPolicy,
  openTermsOfService,
} from "@/features/legal/openLegalDocument";
import { fonts } from "@/theme/typography";
import { separatorLineStyle } from "@/theme/separator";

const googleIcon = require("../../../../assets/images/google-g.png");

type AuthFieldProps = {
  icon: keyof typeof Ionicons.glyphMap;
  placeholder: string;
  value: string;
  onChangeText: (value: string) => void;
  error?: string;
  secureTextEntry?: boolean;
  showToggle?: boolean;
  autoCapitalize?: "none" | "words";
  keyboardType?: "default" | "email-address";
  textContentType?: "name" | "emailAddress" | "newPassword" | "password";
};

function AuthField({
  icon,
  placeholder,
  value,
  onChangeText,
  error,
  secureTextEntry,
  showToggle,
  autoCapitalize = "none",
  keyboardType = "default",
  textContentType,
}: AuthFieldProps) {
  const [visible, setVisible] = useState(false);
  const isSecure = Boolean(secureTextEntry) && !visible;

  return (
    <View>
      <View style={[styles.inputShell, error ? styles.inputShellError : null]}>
        <Ionicons color="#8A8A93" name={icon} size={18} />
        <TextInput
          autoCapitalize={autoCapitalize}
          autoCorrect={false}
          keyboardType={keyboardType}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#6B6B73"
          secureTextEntry={isSecure}
          style={styles.input}
          textContentType={textContentType}
          value={value}
        />
        {showToggle ? (
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
        ) : null}
      </View>
      {error ? <Text style={styles.fieldError}>{error}</Text> : null}
    </View>
  );
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

export function SignupScreen() {
  const { signup, signInWithGoogle, signInWithApple } = useSession();
  const { height: windowHeight } = useWindowDimensions();
  const [formError, setFormError] = useState<string | null>(null);
  const [googleSubmitting, setGoogleSubmitting] = useState(false);
  const [appleSubmitting, setAppleSubmitting] = useState(false);
  const compact = windowHeight < 760;

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
    mode: "onChange",
  });

  const password = useWatch({ control, name: "password" }) ?? "";
  const checks = getPasswordChecks(password);

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      const result = await signup(values.name, values.email, values.password);
      router.replace({
        pathname: "/(auth)/verify-email",
        params: { email: result.requiresVerification ? result.email : values.email },
      });
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "Unable to create account."
      );
    }
  });

  const onApplePress = async () => {
    setFormError(null);
    setAppleSubmitting(true);
    try {
      const signedIn = await signInWithApple();
      if (signedIn) {
        router.replace("/(app)/(tabs)/" as Href);
      }
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : "Unable to sign in with Apple."
      );
    } finally {
      setAppleSubmitting(false);
    }
  };

  const onGooglePress = async () => {
    setFormError(null);
    setGoogleSubmitting(true);
    try {
      const signedIn = await signInWithGoogle();
      if (signedIn) {
        router.replace("/(app)/(tabs)/" as Href);
      }
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : "Unable to sign in with Google."
      );
    } finally {
      setGoogleSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.flex}
      >
        <View style={styles.flex}>
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

          <ScrollView
            contentContainerStyle={[
              styles.content,
              compact ? styles.contentCompact : null,
            ]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.screen}>
              <View style={styles.header}>
                <Text
                  style={[styles.title, compact ? styles.titleCompact : null]}
                >
                  Create your account
                </Text>
                <Text style={styles.subtitle}>Join ClutchOdds today.</Text>
              </View>

              <View style={styles.form}>
                <Controller
                  control={control}
                  name="name"
                  render={({ field: { onChange, value } }) => (
                    <AuthField
                      autoCapitalize="words"
                      error={errors.name?.message}
                      icon="person-outline"
                      onChangeText={onChange}
                      placeholder="Full Name"
                      textContentType="name"
                      value={value}
                    />
                  )}
                />

                <Controller
                  control={control}
                  name="email"
                  render={({ field: { onChange, value } }) => (
                    <AuthField
                      error={errors.email?.message}
                      icon="mail-outline"
                      keyboardType="email-address"
                      onChangeText={onChange}
                      placeholder="Email"
                      textContentType="emailAddress"
                      value={value}
                    />
                  )}
                />

                <Controller
                  control={control}
                  name="password"
                  render={({ field: { onChange, value } }) => (
                    <AuthField
                      error={errors.password?.message}
                      icon="lock-closed-outline"
                      onChangeText={onChange}
                      placeholder="Password"
                      secureTextEntry
                      showToggle
                      textContentType="newPassword"
                      value={value}
                    />
                  )}
                />

                <Controller
                  control={control}
                  name="confirmPassword"
                  render={({ field: { onChange, value } }) => (
                    <AuthField
                      error={errors.confirmPassword?.message}
                      icon="lock-closed-outline"
                      onChangeText={onChange}
                      placeholder="Confirm Password"
                      secureTextEntry
                      showToggle
                      textContentType="newPassword"
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
                  disabled={isSubmitting || googleSubmitting || appleSubmitting}
                  onPress={() => void onSubmit()}
                  style={({ pressed }) => [
                    styles.primaryButton,
                    pressed ? styles.pressed : null,
                    isSubmitting ? styles.disabled : null,
                  ]}
                >
                  <Text style={styles.primaryButtonText}>
                    {isSubmitting ? "Creating account..." : "Create Account"}
                  </Text>
                </Pressable>

                <View style={styles.dividerRow}>
                  <View style={[styles.dividerLine, separatorLineStyle]} />
                  <Text style={styles.dividerText}>or continue with</Text>
                  <View style={[styles.dividerLine, separatorLineStyle]} />
                </View>

                <AppleSignInButton
                  disabled={isSubmitting || googleSubmitting || appleSubmitting}
                  mode="sign-up"
                  onPress={() => void onApplePress()}
                />

                <Pressable
                  disabled={isSubmitting || googleSubmitting || appleSubmitting}
                  onPress={() => void onGooglePress()}
                  style={({ pressed }) => [
                    styles.googleButton,
                    Platform.OS === "ios" ? styles.googleButtonUnderApple : null,
                    pressed ? styles.pressed : null,
                    googleSubmitting ? styles.disabled : null,
                  ]}
                >
                  <Image
                    accessibilityLabel="Google"
                    resizeMode="contain"
                    source={googleIcon}
                    style={styles.googleIcon}
                  />
                  <Text style={styles.googleButtonText}>
                    {googleSubmitting ? "Connecting…" : "Google"}
                  </Text>
                </Pressable>

                <Text style={styles.legal}>
                  By signing up, you agree to our{" "}
                  <Text
                    accessibilityRole="link"
                    onPress={() => {
                      void openTermsOfService();
                    }}
                    style={styles.legalLink}
                  >
                    Terms of Service
                  </Text>
                  {"\n"}and{" "}
                  <Text
                    accessibilityRole="link"
                    onPress={() => {
                      void openPrivacyPolicy();
                    }}
                    style={styles.legalLink}
                  >
                    Privacy Policy
                  </Text>
                  .
                </Text>
              </View>

              <View style={styles.footer}>
                <Text style={styles.footerText}>Already have an account? </Text>
                <Pressable onPress={() => router.replace("/(marketing)")}>
                  <Text style={styles.footerLink}>Log in</Text>
                </Pressable>
              </View>
            </View>
          </ScrollView>
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
  content: {
    flexGrow: 1,
    justifyContent: "center",
    paddingTop: 56,
    paddingBottom: 52,
  },
  contentCompact: {
    paddingTop: 52,
    paddingBottom: 40,
    justifyContent: "flex-start",
  },
  screen: {
    width: "100%",
    maxWidth: 430,
    alignSelf: "center",
    paddingHorizontal: 24,
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
  header: {
    marginBottom: 24,
  },
  title: {
    fontFamily: fonts.displayBold,
    color: "#FFFFFF",
    fontSize: 34,
    lineHeight: 40,
    letterSpacing: -0.4,
  },
  titleCompact: {
    fontSize: 30,
    lineHeight: 36,
  },
  subtitle: {
    marginTop: 8,
    fontFamily: fonts.sansRegular,
    color: "#9CA3AF",
    fontSize: 15,
    lineHeight: 22,
  },
  form: {
    gap: 12,
  },
  inputShell: {
    minHeight: 50,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    backgroundColor: "#141414",
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  inputShellError: {
    borderColor: "rgba(255,30,30,0.6)",
  },
  input: {
    flex: 1,
    color: "#FFFFFF",
    fontFamily: fonts.sansRegular,
    fontSize: 15,
    paddingVertical: Platform.OS === "web" ? 12 : 10,
  },
  fieldError: {
    marginTop: 6,
    fontFamily: fonts.sansRegular,
    color: "#FF6B6B",
    fontSize: 12,
  },
  checklist: {
    marginTop: 4,
    gap: 8,
  },
  checkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  checkText: {
    fontFamily: fonts.sansRegular,
    color: "#71717A",
    fontSize: 13,
  },
  checkTextOk: {
    color: "#D4D4D8",
  },
  formError: {
    fontFamily: fonts.sansRegular,
    color: "#FF6B6B",
    fontSize: 13,
  },
  primaryButton: {
    marginTop: 10,
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
  dividerRow: {
    marginTop: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  dividerLine: {
    flex: 1,
  },
  dividerText: {
    fontFamily: fonts.sansRegular,
    color: "#6B6B73",
    fontSize: 12,
  },
  googleButton: {
    marginTop: 12,
    minHeight: 50,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    backgroundColor: "#0A0A0A",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  googleButtonUnderApple: {
    marginTop: 0,
  },
  googleIcon: {
    width: 18,
    height: 18,
  },
  googleButtonText: {
    fontFamily: fonts.sansSemiBold,
    color: "#FFFFFF",
    fontSize: 15,
  },
  legal: {
    marginTop: 12,
    fontFamily: fonts.sansRegular,
    color: "#71717A",
    fontSize: 12,
    lineHeight: 20,
    textAlign: "center",
  },
  legalLink: {
    color: "#FF1E1E",
    fontFamily: fonts.sansSemiBold,
    textDecorationLine: "underline",
  },
  footer: {
    marginTop: 32,
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
});
