import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { ONBOARDING_STEPS } from "@/lib/onboarding/onboardingSteps";
import { colors } from "@/theme/tokens";
import { fonts } from "@/theme/typography";

type OnboardingModalProps = {
  open: boolean;
  stepIndex: number;
  onStepChange: (index: number) => void;
  onComplete: () => void;
  onSkip: () => void;
};

export function OnboardingModal({
  open,
  stepIndex,
  onStepChange,
  onComplete,
  onSkip,
}: OnboardingModalProps) {
  const step = ONBOARDING_STEPS[stepIndex];
  const isLast = stepIndex === ONBOARDING_STEPS.length - 1;
  const isFirst = stepIndex === 0;

  if (!step) return null;

  function handleNext() {
    if (isLast) {
      onComplete();
      return;
    }
    onStepChange(stepIndex + 1);
  }

  return (
    <Modal
      animationType="fade"
      onRequestClose={onSkip}
      transparent
      visible={open}
    >
      <View style={styles.root}>
        <Pressable
          accessibilityLabel="Skip onboarding"
          onPress={onSkip}
          style={styles.backdrop}
        />
        <View style={styles.card}>
          <View style={styles.topRow}>
            <Text style={styles.stepLabel}>
              Step {stepIndex + 1} of {ONBOARDING_STEPS.length}
            </Text>
            <Pressable onPress={onSkip} hitSlop={8}>
              <Text style={styles.skip}>Skip</Text>
            </Pressable>
          </View>

          <View style={styles.progressRow}>
            {ONBOARDING_STEPS.map((s, i) => (
              <View
                key={s.id}
                style={[
                  styles.progressSeg,
                  i <= stepIndex ? styles.progressSegActive : null,
                ]}
              />
            ))}
          </View>

          <Text style={styles.title}>{step.title}</Text>
          <Text style={styles.body}>{step.body}</Text>

          {step.bullets && step.bullets.length > 0 ? (
            <View style={styles.bullets}>
              {step.bullets.map((bullet) => (
                <View key={bullet} style={styles.bulletRow}>
                  <View style={styles.bulletDot} />
                  <Text style={styles.bulletText}>{bullet}</Text>
                </View>
              ))}
            </View>
          ) : null}

          <View style={styles.actions}>
            <Pressable
              disabled={isFirst}
              onPress={() => onStepChange(stepIndex - 1)}
              style={[styles.backBtn, isFirst ? styles.backHidden : null]}
            >
              <Text style={styles.backText}>Back</Text>
            </Pressable>
            <Pressable onPress={handleNext} style={styles.nextBtn}>
              <Text style={styles.nextText}>
                {isLast ? (step.ctaLabel ?? "Done") : "Next"}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: "flex-end",
    padding: 16,
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(0,0,0,0.75)",
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "#09090B",
    padding: 24,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  stepLabel: {
    fontFamily: fonts.sansBold,
    color: colors.primary,
    fontSize: 11,
    letterSpacing: 1.6,
    textTransform: "uppercase",
  },
  skip: {
    fontFamily: fonts.sansSemiBold,
    color: "#71717A",
    fontSize: 12,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  progressRow: {
    flexDirection: "row",
    gap: 6,
  },
  progressSeg: {
    flex: 1,
    height: 4,
    borderRadius: 999,
    backgroundColor: "#27272A",
  },
  progressSegActive: {
    backgroundColor: colors.primary,
  },
  title: {
    marginTop: 22,
    fontFamily: fonts.displaySemiBold,
    color: colors.text,
    fontSize: 24,
    lineHeight: 30,
  },
  body: {
    marginTop: 12,
    fontFamily: fonts.sansRegular,
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 22,
  },
  bullets: {
    marginTop: 16,
    gap: 10,
  },
  bulletRow: {
    flexDirection: "row",
    gap: 10,
  },
  bulletDot: {
    marginTop: 8,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
  },
  bulletText: {
    flex: 1,
    fontFamily: fonts.sansRegular,
    color: "#D4D4D8",
    fontSize: 14,
    lineHeight: 22,
  },
  actions: {
    marginTop: 28,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  backBtn: {
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  backHidden: {
    opacity: 0,
  },
  backText: {
    fontFamily: fonts.sansBold,
    color: colors.textMuted,
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  nextBtn: {
    marginLeft: "auto",
    borderRadius: 6,
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  nextText: {
    fontFamily: fonts.sansBold,
    color: colors.text,
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
});
