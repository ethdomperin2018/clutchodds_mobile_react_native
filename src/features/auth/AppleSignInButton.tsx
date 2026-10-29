import * as AppleAuthentication from "expo-apple-authentication";
import { useState } from "react";
import { Platform, StyleSheet, View } from "react-native";

export function AppleSignInButton({
  mode,
  disabled,
  onPress,
}: {
  mode: "sign-in" | "sign-up";
  disabled?: boolean;
  onPress: () => void;
}) {
  const [width, setWidth] = useState(0);
  if (Platform.OS !== "ios") return null;

  return (
    <View
      onLayout={(event) => {
        const next = Math.round(event.nativeEvent.layout.width);
        if (next > 0 && next !== width) setWidth(next);
      }}
      pointerEvents={disabled ? "none" : "auto"}
      style={[styles.wrap, disabled ? styles.disabled : null]}
    >
      {width > 0 ? (
        <AppleAuthentication.AppleAuthenticationButton
          buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE}
          buttonType={
            mode === "sign-up"
              ? AppleAuthentication.AppleAuthenticationButtonType.SIGN_UP
              : AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN
          }
          cornerRadius={12}
          onPress={onPress}
          style={{ width, height: 50 }}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: "100%",
    marginBottom: 12,
  },
  disabled: {
    opacity: 0.55,
  },
});
