import { LegalDocumentScreen } from "@/features/legal/LegalDocumentScreen";
import { TERMS_OF_SERVICE } from "@/features/legal/content";

export default function TermsScreen() {
  return <LegalDocumentScreen document={TERMS_OF_SERVICE} />;
}
