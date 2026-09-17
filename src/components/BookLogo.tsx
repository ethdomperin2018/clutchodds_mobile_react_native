import { createElement, useState } from "react";
import { Image, Platform, StyleSheet, Text, View } from "react-native";
import { getBookBrand } from "@/lib/bookmakerBranding";
import { getBookDisplayName } from "@/lib/bookmakerDisplay";
import { getBookLogoSource } from "@/lib/bookmakerLogos";
import { fonts } from "@/theme/typography";

export function BookLogo({
  bookKey,
  bookTitle,
  size = 20,
}: {
  bookKey: string;
  bookTitle?: string;
  size?: number;
}) {
  const title = bookTitle?.trim() || getBookDisplayName(bookKey);
  const brand = getBookBrand(bookKey, title);
  const { source, variant } = getBookLogoSource(bookKey);
  const [failed, setFailed] = useState(false);
  const pad = variant === "icon" ? Math.max(2, Math.round(size * 0.14)) : 2;
  const inner = Math.max(1, size - pad * 2);
  const uri =
    source && typeof source === "object" && "uri" in source
      ? String(source.uri ?? "")
      : "";

  if (source && !failed) {
    return (
      <View
        style={[
          styles.imageWrap,
          {
            width: size,
            height: size,
            borderRadius: 6,
            padding: pad,
          },
        ]}
      >
        {Platform.OS === "web" && uri.endsWith(".svg")
          ? createElement("img", {
              alt: `${title} logo`,
              onError: () => setFailed(true),
              src: uri,
              style: {
                width: inner,
                height: inner,
                objectFit: "contain",
                display: "block",
              },
            })
          : (
            <Image
              onError={() => setFailed(true)}
              resizeMode="contain"
              source={source}
              style={{ width: inner, height: inner }}
            />
          )}
      </View>
    );
  }

  return (
    <View
      style={[
        styles.badge,
        {
          width: size,
          height: size,
          borderRadius: 6,
          backgroundColor: brand.bg,
        },
      ]}
    >
      <Text
        numberOfLines={1}
        style={[
          styles.text,
          {
            color: brand.fg,
            fontSize: size <= 18 ? 7 : size <= 22 ? 8 : 9,
          },
        ]}
      >
        {brand.short}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  imageWrap: {
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.1)",
  },
  badge: {
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  text: {
    fontFamily: fonts.sansBold,
    textTransform: "uppercase",
  },
});
