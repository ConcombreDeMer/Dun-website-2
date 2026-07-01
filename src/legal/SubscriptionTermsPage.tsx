import subscriptionTermsMarkdown from '../../legal/subscription-terms.md?raw';
import { LegalDocumentPage } from './LegalDocumentPage';

export function SubscriptionTermsPage() {
  return (
    <LegalDocumentPage
      eyebrow="Subscription Terms"
      markdown={subscriptionTermsMarkdown}
      title="Conditions d’abonnement Dun Plus"
    />
  );
}
