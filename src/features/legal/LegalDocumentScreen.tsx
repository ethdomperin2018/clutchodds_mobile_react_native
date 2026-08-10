import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  LEGAL_LAST_UPDATED,
  type LegalDocumentContent,
} from "@/features/legal/content";
import { fonts } from "@/theme/typography";

type LegalDocumentScreenProps = {
  document: LegalDocumentContent;
};

export function LegalDocumentScreen({ document }: LegalDocumentScreenProps) {
  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <Pressable
          accessibilityLabel="Go back"
          hitSlop={12}
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace("/(auth)/signup");
            }
          }}
          style={styles.backButton}
        >
          <Ionicons color="#FFFFFF" name="arrow-back" size={22} />
        </Pressable>
        <Text numberOfLines={1} style={styles.headerTitle}>
          {document.title}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.updated}>Last updated: {LEGAL_LAST_UPDATED}</Text>

        {document.sections.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            {section.blocks.map((block, index) => {
              if (block.type === "list") {
                return (
                  <View key={`${section.title}-list-${index}`} style={styles.list}>
                    {block.items.map((item) => (
                      <View key={item} style={styles.listItem}>
                        <Text style={styles.bullet}>•</Text>
                        <Text style={styles.body}>{item}</Text>
                      </View>
                    ))}
                  </View>
                );
              }

              return (
                <Text
                  key={`${section.title}-p-${index}`}
                  style={styles.body}
                >
                  {block.text}
                </Text>
              );
            })}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#000000",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.16)",
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontFamily: fonts.sansSemiBold,
    color: "#FFFFFF",
    fontSize: 16,
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 48,
    gap: 22,
  },
  updated: {
    fontFamily: fonts.sansRegular,
    color: "#71717A",
    fontSize: 13,
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    fontFamily: fonts.sansSemiBold,
    color: "#F4F4F5",
    fontSize: 16,
  },
  body: {
    flex: 1,
    fontFamily: fonts.sansRegular,
    color: "#A1A1AA",
    fontSize: 14,
    lineHeight: 22,
  },
  list: {
    gap: 8,
    paddingLeft: 2,
  },
  listItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  bullet: {
    fontFamily: fonts.sansRegular,
    color: "#A1A1AA",
    fontSize: 14,
    lineHeight: 22,
  },
});
