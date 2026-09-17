import { StyleSheet, Text, View } from "react-native";
import { AppScreen } from "@/components/layout/AppScreen";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusPill } from "@/components/ui/StatusPill";
import { colors } from "@/theme/tokens";
import { fonts, typography } from "@/theme/typography";

type PlaceholderScreenProps = {
  title: string;
  subtitle: string;
  bullets: string[];
  tone?: "success" | "info" | "warning";
};

export function PlaceholderScreen({
  title,
  subtitle,
  bullets,
  tone = "info",
}: PlaceholderScreenProps) {
  return (
    <AppScreen>
      <StatusPill label="Scaffold" tone={tone} />
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
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
  header: {
    gap: 6,
  },
  title: {
    ...typography.pageTitle,
    color: "#FFFFFF",
  },
  subtitle: {
    ...typography.pageSubtitle,
  },
  bullet: {
    color: colors.text,
    fontFamily: fonts.sansRegular,
    fontSize: 14,
    lineHeight: 20,
  },
});
