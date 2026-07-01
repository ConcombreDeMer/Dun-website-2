import privacyPolicyMarkdown from '../../legal/privacy-policy.md?raw';
import { LegalDocumentPage } from './LegalDocumentPage';

export function PrivacyPolicyPage() {
  return (
    <LegalDocumentPage
      eyebrow="Privacy Policy"
      markdown={privacyPolicyMarkdown}
      title="Politique de confidentialité"
    />
  );
}
