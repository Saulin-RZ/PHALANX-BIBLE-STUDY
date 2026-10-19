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
    item.secondaryScriptures.length > 0
      ? `secondary_scriptures:\n${item.secondaryScriptures.map((s) => `  - "${s}"`).join('\n')}`
      : null,
    item.tags.length > 0 ? `tags:\n${item.tags.map((t) => `  - ${t}`).join('\n')}` : null,
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

  if (item.exegesis && (item.exegesis.historicalContext || item.exegesis.keyTerms.length > 0)) {
    body += `## Exegesis & Original Language Notes\n\n`;
    if (item.exegesis.historicalContext) {
      body += `**Historical & Cultural Context**:\n${item.exegesis.historicalContext}\n\n`;
    }
    if (item.exegesis.keyTerms.length > 0) {
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

export async function exportVaultAsGitRepoZip(items: VaultItem[]): Promise<void> {
  const zip = new JSZip();

  // Create README.md
  let readme = `# Sermon & Bible Study Vault\n\n`;
  readme += `This repository contains the sermon manuscripts, biblical exegesis notes, outlines, and teaching handouts created with **Kerygma Studio**.\n\n`;
  readme += `### 📁 Repository Structure\n`;
  readme += `- \`/sermons/\` - Full sermon manuscripts, homiletical outlines, and pulpit notes.\n`;
  readme += `- \`/studies/\` - Exegetical and book-by-book Bible study papers.\n`;
  readme += `- \`/illustrations/\` - Categorized sermon illustrations, stories, and metaphors.\n`;
  readme += `- \`vault-backup.json\` - Full database export for 1-click restore into Kerygma Studio.\n\n`;

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

  readme += `\n\n---\n*Generated by Kerygma — Sermon & Bible Study Studio. Push to GitHub for version control and public sharing.*`;

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
