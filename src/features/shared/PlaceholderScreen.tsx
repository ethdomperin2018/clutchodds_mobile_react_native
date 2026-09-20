import { StyleSheet, Text, View } from "react-native";
import { AppScreen } from "@/components/layout/AppScreen";
import { pageHeaderStyles } from "@/components/layout/pageHeaderStyles";
import { SectionCard } from "@/components/ui/SectionCard";
import { colors } from "@/theme/tokens";
import { fonts } from "@/theme/typography";

type PlaceholderScreenProps = {
  title: string;
  subtitle: string;
  bullets: string[];
};

export function PlaceholderScreen({
  title,
  subtitle,
  bullets,
}: PlaceholderScreenProps) {
  return (
    <AppScreen>
      <View style={pageHeaderStyles.header}>
        <Text style={pageHeaderStyles.title}>{title}</Text>
        <Text allowFontScaling={false} style={pageHeaderStyles.subtitle}>
          {subtitle}
        </Text>
      </View>

      <SectionCard
        title="Planned Surface Area"
        description="This placeholder keeps route contracts stable while the feature UI and backend integration fill in."
      >
        {bullets.map((bullet) => (
          <Text key={bullet} style={styles.bullet}>
            - {bullet}
          </Text>
        ))}
      </SectionCard>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  bullet: {
    color: colors.text,
    fontFamily: fonts.sansRegular,
    fontSize: 14,
    lineHeight: 20,
  },
});
