import { useEffect, type ReactNode } from 'react';
import { SiteFooter } from '../components/SiteFooter';
import './legal.css';

type LegalDocumentPageProps = {
  eyebrow: string;
  markdown: string;
  title: string;
};

export function LegalDocumentPage({ eyebrow, markdown, title }: LegalDocumentPageProps) {
  const normalizedMarkdown = normalizeLegalMarkdown(markdown);
  const { updatedAt, content } = splitLegalMarkdown(normalizedMarkdown);

  useEffect(() => {
    document.documentElement.classList.add('legalDocumentScroll');
    document.body.classList.add('legalDocumentScroll');

    return () => {
      document.documentElement.classList.remove('legalDocumentScroll');
      document.body.classList.remove('legalDocumentScroll');
    };
  }, []);

  return (
    <main className="legalShell">
      <article className="legalPage" aria-labelledby="legal-title">
        <a className="legalBackLink" href="/">
          <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
            <path d="M15 5 8 12l7 7" />
          </svg>
          Accueil
        </a>

        <header className="legalHeader">
          <p className="legalEyebrow">{eyebrow}</p>
          <h1 className="legalTitle" id="legal-title">
            {title}
          </h1>
          {updatedAt && <p className="legalUpdated">{updatedAt}</p>}
        </header>

        <div className="legalContent">{renderLegalMarkdown(content)}</div>
      </article>
      <SiteFooter className="siteFooterInline" />
    </main>
  );
}

function normalizeLegalMarkdown(markdown: string) {
  return markdown
    .replaceAll('[LIEN VERS LA POLITIQUE DE CONFIDENTIALITÉ]', '[Politique de confidentialité](/privacy-policy)')
    .replaceAll('[LIEN VERS LES CGU]', '[Conditions Générales d’Utilisation](/terms-of-use)');
}

function splitLegalMarkdown(markdown: string) {
  const lines = markdown.trim().split('\n');
  const withoutTitle = lines[0]?.startsWith('# ') ? lines.slice(1) : lines;
  const firstContentIndex = withoutTitle.findIndex((line) => line.trim().startsWith('## '));
  const introLines = firstContentIndex === -1 ? withoutTitle : withoutTitle.slice(0, firstContentIndex);
  const updatedAt = introLines.find((line) => line.trim().toLowerCase().startsWith('dernière mise à jour'))?.trim();
  const content = (firstContentIndex === -1 ? withoutTitle : withoutTitle.slice(firstContentIndex)).join('\n');

  return { updatedAt, content };
}

function renderLegalMarkdown(markdown: string) {
  const lines = markdown.split('\n');
  const blocks: ReactNode[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index].trim();

    if (!line) {
      index += 1;
      continue;
    }

    if (line.startsWith('### ')) {
      blocks.push(<h3 key={index}>{renderInlineMarkdown(line.slice(4))}</h3>);
      index += 1;
      continue;
    }

    if (line.startsWith('## ')) {
      blocks.push(<h2 key={index}>{renderInlineMarkdown(line.slice(3))}</h2>);
      index += 1;
      continue;
    }

    if (line.startsWith('- ')) {
      const items: string[] = [];

      while (index < lines.length && lines[index].trim().startsWith('- ')) {
        items.push(lines[index].trim().slice(2));
        index += 1;
      }

      blocks.push(
        <ul key={index}>
          {items.map((item, itemIndex) => (
            <li key={`${item}-${itemIndex}`}>{renderInlineMarkdown(item)}</li>
          ))}
        </ul>,
      );
      continue;
    }

    if (line.startsWith('|') && line.endsWith('|')) {
      const tableRows: string[][] = [];

      while (index < lines.length && lines[index].trim().startsWith('|') && lines[index].trim().endsWith('|')) {
        const cells = lines[index]
          .trim()
          .slice(1, -1)
          .split('|')
          .map((cell) => cell.trim());

        if (!cells.every((cell) => /^-+$/.test(cell))) {
          tableRows.push(cells);
        }

        index += 1;
      }

      const [head = [], ...body] = tableRows;

      blocks.push(
        <div className="legalTableWrap" key={index}>
          <table>
            <thead>
              <tr>
                {head.map((cell) => (
                  <th key={cell}>{renderInlineMarkdown(cell)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {body.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {row.map((cell, cellIndex) => (
                    <td key={`${cell}-${cellIndex}`}>{renderInlineMarkdown(cell)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>,
      );
      continue;
    }

    const paragraphLines: string[] = [];

    while (
      index < lines.length &&
      lines[index].trim() &&
      !lines[index].trim().startsWith('## ') &&
      !lines[index].trim().startsWith('### ') &&
      !lines[index].trim().startsWith('- ') &&
      !lines[index].trim().startsWith('|')
    ) {
      paragraphLines.push(lines[index].trim());
      index += 1;
    }

    blocks.push(<p key={index}>{renderInlineMarkdown(paragraphLines.join(' '))}</p>);
  }

  return blocks;
}

function renderInlineMarkdown(text: string) {
  const nodes: ReactNode[] = [];
  const linkPattern = /\[([^\]]+)\]\(([^)]+)\)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = linkPattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }

    nodes.push(
      <a href={match[2]} key={`${match[1]}-${match.index}`}>
        {match[1]}
      </a>,
    );
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes;
}
