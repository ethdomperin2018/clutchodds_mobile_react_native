import { StyleSheet, Text, TextInput, View } from "react-native";
import { colors, radii, spacing } from "@/theme/tokens";
import { fonts, typography } from "@/theme/typography";

type TextFieldProps = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  error?: string;
  placeholder?: string;
  secureTextEntry?: boolean;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  keyboardType?: "default" | "email-address";
};

export function TextField({
  label,
  value,
  onChangeText,
  error,
  placeholder,
  secureTextEntry = false,
  autoCapitalize = "none",
  keyboardType = "default",
}: TextFieldProps) {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        autoCapitalize={autoCapitalize}
        autoCorrect={false}
        keyboardType={keyboardType}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        secureTextEntry={secureTextEntry}
        style={[styles.input, error ? styles.inputError : null]}
        value={value}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: spacing.xs,
  },
  label: {
    ...typography.label,
    color: colors.text,
  },
  input: {
    minHeight: 48,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceMuted,
    color: colors.text,
    paddingHorizontal: spacing.md,
    fontFamily: fonts.sansRegular,
    fontSize: 15,
  },
  inputError: {
    borderColor: colors.danger,
  },
  error: {
    color: colors.danger,
    fontFamily: fonts.sansRegular,
    fontSize: 12,
  },
});
