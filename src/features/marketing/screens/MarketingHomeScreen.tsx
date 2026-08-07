import { Ionicons } from "@expo/vector-icons";
import { zodResolver } from "@hookform/resolvers/zod";
import { router } from "expo-router";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  Image,
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
import { ApiError } from "@/lib/api/client";
import {
  loginSchema,
  type LoginFormValues,
} from "@/features/auth/schemas";
import { fonts } from "@/theme/typography";

const brandLogo = require("../../../../assets/images/logo-tight.jpg");
const heroNetwork = require("../../../../assets/images/hero-network.png");
const googleIcon = require("../../../../assets/images/google-g.png");

function HeroNetworkEffect() {
  return (
    <View pointerEvents="none" style={styles.effectLayer}>
      <Image
        resizeMode="cover"
        source={heroNetwork}
        style={styles.effectImage}
      />
    </View>
  );
}

export function MarketingHomeScreen() {
  const { login } = useSession();
  const { height: windowHeight } = useWindowDimensions();
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const compact = windowHeight < 720;
  const headlineSize = compact ? 32 : 38;

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      await login(values.email, values.password);
      router.replace("/(app)/(tabs)/dashboard");
    } catch (error) {
      if (error instanceof ApiError && error.code === "EMAIL_NOT_VERIFIED") {
        router.replace({
          pathname: "/(auth)/verify-email",
          params: { email: error.email ?? values.email },
        });
        return;
      }
      setFormError(
        error instanceof Error ? error.message : "Unable to sign in."
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
          <View style={styles.topSection}>
            <Image
              accessibilityLabel="Clutch Odds"
              resizeMode="contain"
              source={brandLogo}
              style={[styles.logo, compact ? styles.logoCompact : null]}
            />

            <View style={styles.heroBlock}>
              <HeroNetworkEffect />
              <Text
                style={[
                  styles.headline,
                  {
                    fontSize: headlineSize,
                    lineHeight: headlineSize + 6,
                  },
                ]}
              >
                Understand{"\n"}the market{"\n"}
                <Text style={styles.headlineAccent}>before</Text> you bet.
              </Text>
              <Text style={styles.subhead}>
                Real-time odds. Smarter insights.{"\n"}Better decisions.
              </Text>
            </View>
          </View>

          <View style={styles.formSection}>
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

            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, value } }) => (
                <View
                  style={[
                    styles.inputShell,
                    errors.password ? styles.inputShellError : null,
                  ]}
                >
                  <Ionicons
                    color="#8A8A93"
                    name="lock-closed-outline"
                    size={18}
                  />
                  <TextInput
                    autoCapitalize="none"
                    autoCorrect={false}
                    onChangeText={onChange}
                    placeholder="Password"
                    placeholderTextColor="#6B6B73"
                    secureTextEntry={!showPassword}
                    style={styles.input}
                    textContentType="password"
                    value={value}
                  />
                  <Pressable
                    accessibilityLabel={
                      showPassword ? "Hide password" : "Show password"
                    }
                    hitSlop={10}
                    onPress={() => setShowPassword((current) => !current)}
                  >
                    <Ionicons
                      color="#8A8A93"
                      name={showPassword ? "eye-off-outline" : "eye-outline"}
                      size={18}
                    />
                  </Pressable>
                </View>
              )}
            />
            {errors.password ? (
              <Text style={styles.fieldError}>{errors.password.message}</Text>
            ) : null}

            <Pressable
              onPress={() => router.push("/(auth)/forgot-password")}
              style={styles.forgotPressable}
            >
              <Text style={styles.forgotText}>Forgot password?</Text>
            </Pressable>

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
                {isSubmitting ? "Logging in..." : "Log In"}
              </Text>
            </Pressable>

            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or continue with</Text>
              <View style={styles.dividerLine} />
            </View>

            <Pressable
              onPress={() => {
                // Google OAuth UI only for this pass
              }}
              style={({ pressed }) => [
                styles.googleButton,
                pressed ? styles.pressed : null,
              ]}
            >
              <Image
                accessibilityLabel="Google"
                resizeMode="contain"
                source={googleIcon}
                style={styles.googleIcon}
              />
              <Text style={styles.googleButtonText}>Google</Text>
            </Pressable>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <Pressable onPress={() => router.push("/(auth)/signup")}>
              <Text style={styles.footerLink}>Sign up</Text>
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
    overflow: "hidden",
  },
  screenCompact: {
    paddingTop: 20,
    paddingBottom: 40,
  },
  topSection: {
    flexShrink: 1,
    justifyContent: "flex-start",
    overflow: "hidden",
  },
  logo: {
    // Flush-cropped logo-tight.jpg (~5.78:1) — aligns with hero/form left edge
    width: 300,
    height: 52,
    alignSelf: "flex-start",
    marginBottom: 0,
  },
  logoCompact: {
    width: 260,
    height: 45,
  },
  heroBlock: {
    position: "relative",
    marginTop: 18,
    minHeight: 130,
    justifyContent: "center",
    overflow: "hidden",
  },
  effectLayer: {
    ...StyleSheet.absoluteFill,
  },
  effectImage: {
    position: "absolute",
    right: -12,
    top: 0,
    width: "108%",
    height: "100%",
    opacity: 0.85,
  },
  headline: {
    fontFamily: fonts.displayBold,
    color: "#FFFFFF",
    letterSpacing: -0.4,
    maxWidth: "100%",
    paddingRight: 12,
    zIndex: 1,
  },
  headlineAccent: {
    color: "#FF1E1E",
    fontFamily: fonts.displayBold,
  },
  subhead: {
    marginTop: 14,
    maxWidth: "92%",
    fontFamily: fonts.sansRegular,
    color: "#9CA3AF",
    fontSize: 14,
    lineHeight: 22,
    zIndex: 1,
  },
  formSection: {
    flexGrow: 0,
    flexShrink: 0,
    gap: 12,
    marginTop: 36,
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
    marginTop: -4,
    fontFamily: fonts.sansRegular,
    color: "#FF6B6B",
    fontSize: 12,
  },
  forgotPressable: {
    alignSelf: "flex-start",
    marginTop: 0,
    paddingVertical: 2,
  },
  forgotText: {
    fontFamily: fonts.sansRegular,
    color: "#9CA3AF",
    fontSize: 13,
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
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(255,255,255,0.16)",
  },
  dividerText: {
    fontFamily: fonts.sansRegular,
    color: "#6B6B73",
    fontSize: 12,
  },
  googleButton: {
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
  googleIcon: {
    width: 18,
    height: 18,
  },
  googleButtonText: {
    fontFamily: fonts.sansSemiBold,
    color: "#FFFFFF",
    fontSize: 15,
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
