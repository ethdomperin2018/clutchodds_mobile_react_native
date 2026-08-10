import { LegalDocumentScreen } from "@/features/legal/LegalDocumentScreen";
import { PRIVACY_POLICY } from "@/features/legal/content";

export default function PrivacyScreen() {
  return <LegalDocumentScreen document={PRIVACY_POLICY} />;
}
