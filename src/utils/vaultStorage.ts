import JSZip from 'jszip';
import { INITIAL_VAULT } from '../data/initialVault';
import { VaultItem } from '../types';

const STORAGE_KEY = 'kerygma_sermon_vault_v1';

export function loadVault(): VaultItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      saveVault(INITIAL_VAULT);
      return INITIAL_VAULT;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return INITIAL_VAULT;
  } catch (err) {
    console.error('Failed to load vault from localStorage', err);
    return INITIAL_VAULT;
  }
}

export function saveVault(items: VaultItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch (err) {
    console.error('Failed to save vault to localStorage', err);
  }
}

export function convertItemToMarkdown(item: VaultItem): string {
  const frontmatter = [
    '---',
    `title: "${item.title.replace(/"/g, '\\"')}"`,
    item.subtitle ? `subtitle: "${item.subtitle.replace(/"/g, '\\"')}"` : null,
    `type: ${item.type}`,
    `date: ${item.date}`,
    item.series ? `series: "${item.series.replace(/"/g, '\\"')}"` : null,
    `preacher: "${item.preacher}"`,
    `primary_scripture: "${item.primaryScripture}"`,
    item.secondaryScriptures && item.secondaryScriptures.length > 0
      ? `secondary_scriptures:\n${item.secondaryScriptures.map((s) => `  - "${s}"`).join('\n')}`
      : null,
    item.tags && item.tags.length > 0 ? `tags:\n${item.tags.map((t) => `  - ${t}`).join('\n')}` : null,
    `status: ${item.status}`,
    `duration_minutes: ${item.durationMinutes}`,
    item.bigIdea ? `big_idea: "${item.bigIdea.replace(/"/g, '\\"')}"` : null,
    `updated_at: ${item.updatedAt}`,
    '---',
    ''
  ]
    .filter(Boolean)
    .join('\n');

  let body = '';

  if (item.bigIdea) {
    body += `> **Big Idea**: ${item.bigIdea}\n\n`;
  }

  if (item.outline && item.outline.length > 0) {
    body += `## Homiletical Outline\n\n`;
    item.outline.forEach((opt) => {
      const indent = opt.level === 1 ? '###' : opt.level === 2 ? '####' : '#####';
      const ref = opt.scriptureRef ? ` *(${opt.scriptureRef})*` : '';
      body += `${indent} ${opt.title}${ref}\n`;
      if (opt.speakerCue) {
        body += `*Cue: \`${opt.speakerCue}\`*\n\n`;
      }
      if (opt.content) {
        body += `${opt.content}\n\n`;
      }
      if (opt.illustrationSnippet) {
        body += `> **Illustration**: ${opt.illustrationSnippet}\n\n`;
      }
    });
  }

  if (item.manuscript) {
    body += `## Pulpit Manuscript & Notes\n\n${item.manuscript}\n\n`;
  }

  if (item.exegesis && (item.exegesis.historicalContext || (item.exegesis.keyTerms && item.exegesis.keyTerms.length > 0))) {
    body += `## Exegesis & Original Language Notes\n\n`;
    if (item.exegesis.historicalContext) {
      body += `**Historical & Cultural Context**:\n${item.exegesis.historicalContext}\n\n`;
    }
    if (item.exegesis.keyTerms && item.exegesis.keyTerms.length > 0) {
      body += `**Key Original Terms**:\n`;
      item.exegesis.keyTerms.forEach((kt) => {
        body += `- **${kt.original}** (${kt.language} *${kt.transliteration}*): ${kt.meaning}. ${kt.notes}\n`;
      });
      body += '\n';
    }
  }

  if (item.handoutItems && item.handoutItems.length > 0) {
    body += `## Congregational Handout Guide (Fill-in-the-Blanks)\n\n`;
    item.handoutItems.forEach((hi, idx) => {
      body += `${idx + 1}. ${hi.question} *(Ref: ${hi.scripture})*  \n   *Teacher Answer: [${hi.answer}]*\n\n`;
    });
  }

  if (item.discussionQuestions && item.discussionQuestions.length > 0) {
    body += `## Small Group Discussion Questions\n\n`;
    item.discussionQuestions.forEach((dq, idx) => {
      body += `${idx + 1}. ${dq}\n`;
    });
    body += '\n';
  }

  return frontmatter + body;
}

export function downloadFile(content: string, filename: string, mimeType = 'text/markdown;charset=utf-8;'): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

export function generatePulpitHtml(
  item: VaultItem,
  options: {
    fontSize?: '12pt' | '14pt' | '16pt';
    includeOutline?: boolean;
    includeExegesis?: boolean;
  } = {}
): string {
  const fontSize = options.fontSize || '14pt';
  const includeOutline = options.includeOutline ?? true;
  const includeExegesis = options.includeExegesis ?? true;

  // Render paragraphs with speaker cue highlighting
  const paragraphs = (item.manuscript || '').split('\n\n');
  const formattedManuscript = paragraphs
    .map((p) => {
      const trimmed = p.trim();
      if (!trimmed) return '';
      if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
        return `<div class="speaker-cue">${trimmed.slice(1, -1)}</div>`;
      }
      if (trimmed.startsWith('>')) {
        const text = trimmed.replace(/^>\s*/, '');
        return `<blockquote class="scripture-quote">${text}</blockquote>`;
      }
      if (trimmed.startsWith('###')) {
        return `<h3>${trimmed.replace(/^###\s*/, '')}</h3>`;
      }
      if (trimmed.startsWith('##')) {
        return `<h2>${trimmed.replace(/^##\s*/, '')}</h2>`;
      }
      if (trimmed.startsWith('#')) {
        return `<h1>${trimmed.replace(/^#\s*/, '')}</h1>`;
      }
      return `<p>${trimmed}</p>`;
    })
    .join('\n');

  let outlineHtml = '';
  if (includeOutline && item.outline && item.outline.length > 0) {
    outlineHtml = `
      <section class="outline-box">
        <div class="section-label">HOMILETICAL MOVEMENTS</div>
        ${item.outline
          .map(
            (pt, i) => `
          <div class="outline-point level-${pt.level}">
            <div class="outline-title">
              <strong>${pt.title}</strong>
              ${pt.scriptureRef ? `<span class="outline-ref">${pt.scriptureRef}</span>` : ''}
            </div>
            ${pt.speakerCue ? `<div class="cue-pill">${pt.speakerCue}</div>` : ''}
            ${pt.content ? `<p class="outline-desc">${pt.content}</p>` : ''}
          </div>
        `
          )
          .join('')}
      </section>
    `;
  }

  let exegesisHtml = '';
  if (includeExegesis && item.exegesis && (item.exegesis.historicalContext || (item.exegesis.keyTerms && item.exegesis.keyTerms.length > 0))) {
    exegesisHtml = `
      <section class="exegesis-section page-break-before">
        <div class="section-label">EXEGESIS & ORIGINAL LANGUAGE INSIGHTS</div>
        ${
          item.exegesis.historicalContext
            ? `<div class="exegesis-item"><strong>Historical Context:</strong> <p>${item.exegesis.historicalContext}</p></div>`
            : ''
        }
        ${
          item.exegesis.keyTerms && item.exegesis.keyTerms.length > 0
            ? `
          <div class="exegesis-terms">
            <strong>Key Original Terms:</strong>
            <ul>
              ${item.exegesis.keyTerms
                .map(
                  (kt) =>
                    `<li><strong>${kt.original}</strong> (<em>${kt.transliteration}</em> - ${kt.language}): ${kt.meaning}. <span class="notes">${kt.notes}</span></li>`
                )
                .join('')}
            </ul>
          </div>
        `
            : ''
        }
      </section>
    `;
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${item.title} — Pulpit Preaching Notes</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,400&family=Plus+Jakarta+Sans:wght@400;500;600;700&family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,600;1,8..60,400&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet">
  <style>
    @page {
      margin: 0.8in 0.8in 0.8in 0.8in;
      size: letter;
      @bottom-right {
        content: counter(page);
      }
    }
    body {
      font-family: 'Source Serif 4', Georgia, serif;
      font-size: ${fontSize};
      line-height: 1.65;
      color: #1a1a1a;
      background: #ffffff;
      margin: 0;
      padding: 20px;
    }
    .no-print {
      display: block;
      margin-bottom: 24px;
      padding: 12px 18px;
      background: #f4f1ea;
      border: 1px solid #dcd5c7;
      border-radius: 6px;
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 13px;
    }
    .print-btn {
      background: #1c1917;
      color: #ffffff;
      border: none;
      padding: 8px 16px;
      border-radius: 4px;
      font-weight: 600;
      cursor: pointer;
      font-family: 'Plus Jakarta Sans', sans-serif;
    }
    .print-btn:hover {
      background: #333;
    }
    @media print {
      .no-print {
        display: none !important;
      }
      body {
        padding: 0 !important;
      }
      .page-break-before {
        page-break-before: always;
      }
    }
    .header {
      border-bottom: 2px solid #292524;
      padding-bottom: 12px;
      margin-bottom: 20px;
      font-family: 'Plus Jakarta Sans', sans-serif;
    }
    .meta-top {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: #78716c;
      margin-bottom: 6px;
    }
    h1.sermon-title {
      font-family: 'Cormorant Garamond', Georgia, serif;
      font-size: 26pt;
      font-weight: 700;
      margin: 0 0 6px 0;
      line-height: 1.15;
      color: #0c0a09;
    }
    .subtitle {
      font-style: italic;
      color: #57534e;
      margin: 0 0 10px 0;
      font-size: 13pt;
    }
    .meta-bar {
      display: flex;
      justify-content: space-between;
      font-size: 11pt;
      font-weight: 500;
      margin-top: 10px;
      padding-top: 8px;
      border-top: 1px solid #e7e5e4;
    }
    .scripture-pill {
      font-weight: 700;
      color: #78350f;
    }
    .big-idea-box {
      background: #faf8f5;
      border: 1px solid #e7e5e4;
      padding: 12px 16px;
      border-radius: 4px;
      margin-bottom: 24px;
      font-size: 12pt;
    }
    .big-idea-label {
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 9pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #78716c;
      margin-bottom: 4px;
    }
    .big-idea-text {
      font-family: 'Cormorant Garamond', Georgia, serif;
      font-size: 15pt;
      font-style: italic;
      font-weight: 600;
      color: #1c1917;
      margin: 0;
    }
    .speaker-cue {
      display: inline-block;
      background: #fef3c7;
      border: 1px solid #f59e0b;
      color: #92400e;
      font-family: 'JetBrains Mono', monospace;
      font-size: 9pt;
      font-weight: 700;
      text-transform: uppercase;
      padding: 2px 8px;
      border-radius: 3px;
      margin: 8px 0;
    }
    .scripture-quote {
      margin: 14px 0;
      padding-left: 14px;
      border-left: 3px solid #78350f;
      color: #292524;
      font-style: italic;
      background: #fafaf9;
      padding: 8px 12px;
    }
    .outline-box {
      background: #fdfbf7;
      border: 1px solid #e7e5e4;
      border-radius: 6px;
      padding: 16px;
      margin-bottom: 24px;
    }
    .section-label {
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 9pt;
      font-weight: 700;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: #78716c;
      margin-bottom: 12px;
      border-bottom: 1px solid #e7e5e4;
      padding-bottom: 4px;
    }
    .outline-point {
      margin-bottom: 12px;
      border-left: 2px solid #a8a29e;
      padding-left: 10px;
    }
    .outline-point.level-2 {
      margin-left: 16px;
      border-left: 2px solid #d6d3d1;
    }
    .outline-title {
      font-size: 13pt;
      font-family: 'Cormorant Garamond', Georgia, serif;
      color: #1c1917;
    }
    .outline-ref {
      font-family: 'JetBrains Mono', monospace;
      font-size: 9pt;
      color: #78350f;
      margin-left: 6px;
    }
    .cue-pill {
      font-family: 'JetBrains Mono', monospace;
      font-size: 8.5pt;
      color: #b45309;
      font-weight: 600;
      margin-top: 2px;
    }
    .outline-desc {
      font-size: 10.5pt;
      margin: 4px 0 0 0;
      color: #44403c;
    }
    h2, h3 {
      font-family: 'Cormorant Garamond', Georgia, serif;
      color: #1c1917;
      margin-top: 20px;
      margin-bottom: 8px;
    }
    h2 { font-size: 18pt; border-bottom: 1px solid #e7e5e4; padding-bottom: 4px; }
    h3 { font-size: 15pt; }
    p { margin: 0 0 12px 0; }
    .exegesis-section {
      margin-top: 30px;
      padding-top: 16px;
      border-top: 1px solid #d6d3d1;
      font-size: 11pt;
    }
    .footer {
      margin-top: 40px;
      padding-top: 12px;
      border-top: 1px solid #e7e5e4;
      font-size: 9pt;
      font-family: 'Plus Jakarta Sans', sans-serif;
      color: #a8a29e;
      display: flex;
      justify-content: space-between;
    }
  </style>
</head>
<body>
  <div class="no-print">
    <div style="display: flex; justify-content: space-between; align-items: center;">
      <div>
        <strong>Pulpit Preaching Notes View</strong> — Click below to print or save directly as PDF via your browser.
      </div>
      <button onclick="window.print()" class="print-btn">Print / Save as PDF</button>
    </div>
  </div>

  <div class="header">
    <div class="meta-top">
      ${item.series ? `Series: ${item.series} · ` : ''}Date: ${item.date} · Preacher: ${item.preacher}
    </div>
    <h1 class="sermon-title">${item.title}</h1>
    ${item.subtitle ? `<div class="subtitle">${item.subtitle}</div>` : ''}
    <div class="meta-bar">
      <div>Text: <span class="scripture-pill">${item.primaryScripture}</span></div>
      <div>Target: ${item.durationMinutes || 35} mins</div>
    </div>
  </div>

  ${
    item.bigIdea
      ? `
    <div class="big-idea-box">
      <div class="big-idea-label">Homiletical Proposition (Big Idea)</div>
      <p class="big-idea-text">"${item.bigIdea}"</p>
    </div>
  `
      : ''
  }

  ${outlineHtml}

  <div class="manuscript-body">
    ${formattedManuscript}
  </div>

  ${exegesisHtml}

  <div class="footer">
    <span>PHALANX Sermon Studio · ${item.primaryScripture}</span>
    <span>Preached by ${item.preacher} · ${item.date}</span>
  </div>
</body>
</html>`;
}

export async function exportVaultAsGitRepoZip(items: VaultItem[]): Promise<void> {
  const zip = new JSZip();

  // Create README.md
  let readme = `# PHALANX — Sermon & Bible Study Vault\n\n`;
  readme += `This repository contains the sermon manuscripts, biblical exegesis notes, outlines, and teaching handouts created with **PHALANX Studio**.\n\n`;
  readme += `### 📁 Repository Structure\n`;
  readme += `- \`/sermons/\` - Full sermon manuscripts, homiletical outlines, and pulpit notes.\n`;
  readme += `- \`/studies/\` - Exegetical and book-by-book Bible study papers.\n`;
  readme += `- \`/illustrations/\` - Categorized sermon illustrations, stories, and metaphors.\n`;
  readme += `- \`vault-backup.json\` - Full database export for 1-click restore into PHALANX Studio.\n\n`;

  readme += `### 📜 Library Index (${items.length} works)\n\n`;
  readme += `| Title | Scripture | Series | Date | Type |\n`;
  readme += `| :--- | :--- | :--- | :--- | :--- |\n`;

  const sermonsFolder = zip.folder('sermons');
  const studiesFolder = zip.folder('studies');
  const illustrationsFolder = zip.folder('illustrations');

  items.forEach((item) => {
    const filename = `${item.date || 'no-date'}-${item.slug || item.id}.md`;
    const mdContent = convertItemToMarkdown(item);

    const seriesText = item.series || '—';
    const linkPath = item.type === 'study' ? `studies/${filename}` : item.type === 'illustration' ? `illustrations/${filename}` : `sermons/${filename}`;

    readme += `| [${item.title}](${linkPath}) | \`${item.primaryScripture}\` | ${seriesText} | ${item.date} | ${item.type} |\n`;

    if (item.type === 'study') {
      studiesFolder?.file(filename, mdContent);
    } else if (item.type === 'illustration') {
      illustrationsFolder?.file(filename, mdContent);
    } else {
      sermonsFolder?.file(filename, mdContent);
    }
  });

  readme += `\n\n---\n*Generated by PHALANX — Sermon & Bible Study Studio. Push to GitHub for version control and public sharing.*`;

  zip.file('README.md', readme);

  // Add .gitignore
  zip.file(
    '.gitignore',
    `# OS files
.DS_Store
Thumbs.db

# Editor
.vscode/
.idea/
*.swp
`
  );

  // Add JSON backup
  zip.file('vault-backup.json', JSON.stringify(items, null, 2));

  // Generate ZIP blob and trigger download
  const content = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(content);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `sermon-vault-${new Date().toISOString().slice(0, 10)}.zip`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
