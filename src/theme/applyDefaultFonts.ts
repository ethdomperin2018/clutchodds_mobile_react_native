import { Text, TextInput } from "react-native";
import { fonts } from "@/theme/typography";

type TextWithDefaults = typeof Text & {
  defaultProps?: {
    style?: unknown;
  };
};

type TextInputWithDefaults = typeof TextInput & {
  defaultProps?: {
    style?: unknown;
  };
};

/** Apply web-matching body font as the RN Text/TextInput default. */
export function applyDefaultFonts() {
  const text = Text as TextWithDefaults;
  const input = TextInput as TextInputWithDefaults;

  text.defaultProps = {
    ...text.defaultProps,
    style: [{ fontFamily: fonts.sansRegular }, text.defaultProps?.style],
  };

  input.defaultProps = {
    ...input.defaultProps,
    style: [{ fontFamily: fonts.sansRegular }, input.defaultProps?.style],
  };
}
