import './SiteFooter.css';

export const legalLinks = [
  { href: '/terms-of-use', label: 'Terms of Use' },
  { href: '/subscription-terms', label: 'Subscription Terms' },
  { href: '/privacy-policy', label: 'Privacy Policy' },
];

export function SiteFooter({ className = '' }: { className?: string }) {
  return (
    <footer className={`siteFooter${className ? ` ${className}` : ''}`}>
      <nav aria-label="Liens légaux">
        {legalLinks.map((link) => (
          <a href={link.href} key={link.href}>
            {link.label}
          </a>
        ))}
      </nav>
    </footer>
  );
}
