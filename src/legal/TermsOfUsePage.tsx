import termsOfUseMarkdown from '../../legal/terms-of-use.md?raw';
import { LegalDocumentPage } from './LegalDocumentPage';

export function TermsOfUsePage() {
  return (
    <LegalDocumentPage
      eyebrow="Terms of Use"
      markdown={termsOfUseMarkdown}
      title="Conditions Générales d’Utilisation"
    />
  );
}
