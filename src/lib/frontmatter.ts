// Hand-rolled YAML frontmatter for the fixed schema in src/content.config.ts.
// Avoids pulling in `gray-matter` (smallest-diff principle).
//
// Schema (from src/content.config.ts):
//   title: string
//   date: YYYY-MM-DD
//   description: string
//   tags: string[]
//   draft: boolean
//   og_image?: string
//   meta_description?: string

export interface PostMeta {
  title: string;
  date: string; // YYYY-MM-DD
  description: string;
  tags: string[];
  draft: boolean;
  og_image?: string;
  meta_description?: string;
}

const NEEDS_QUOTE = /[:#&*!|>'"%@`{}\[\],]/;

function quoteYamlString(s: string): string {
  if (s === '') return '""';
  if (NEEDS_QUOTE.test(s) || s.match(/^[-?]/) || s.trim() !== s) {
    return `"${s.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
  }
  return s;
}

function unquoteYamlString(raw: string): string {
  const s = raw.trim();
  if (s.length >= 2 && s.startsWith('"') && s.endsWith('"')) {
    return s.slice(1, -1).replace(/\\"/g, '"').replace(/\\\\/g, '\\');
  }
  if (s.length >= 2 && s.startsWith("'") && s.endsWith("'")) {
    return s.slice(1, -1).replace(/''/g, "'");
  }
  return s;
}

function serializeFrontmatter(meta: PostMeta): string {
  const lines: string[] = [];
  lines.push(`title: ${quoteYamlString(meta.title)}`);
  lines.push(`date: ${meta.date}`);
  lines.push(`description: ${quoteYamlString(meta.description)}`);
  if (meta.tags.length === 0) {
    lines.push(`tags: []`);
  } else {
    lines.push(`tags:`);
    for (const tag of meta.tags) {
      lines.push(`  - ${quoteYamlString(tag)}`);
    }
  }
  lines.push(`draft: ${meta.draft ? 'true' : 'false'}`);
  if (meta.og_image) {
    lines.push(`og_image: ${quoteYamlString(meta.og_image)}`);
  }
  if (meta.meta_description) {
    lines.push(`meta_description: ${quoteYamlString(meta.meta_description)}`);
  }
  return lines.join('\n');
}

export function composeMdx(meta: PostMeta, body: string): string {
  return `---\n${serializeFrontmatter(meta)}\n---\n\n${body.trim()}\n`;
}

export function parseMdx(source: string): { meta: PostMeta; body: string } {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) {
    throw new Error('Missing frontmatter delimiters (---)');
  }
  const fmBlock = match[1];
  const body = (match[2] || '').replace(/^\r?\n+/, '');

  const meta: Partial<PostMeta> & { tags: string[]; draft: boolean } = {
    tags: [],
    draft: false,
  };
  const lines = fmBlock.split(/\r?\n/);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const m = line.match(/^([a-z_]+):\s*(.*)$/);
    if (!m) continue;
    const key = m[1];
    const rawVal = m[2];

    if (key === 'tags') {
      const trimmed = rawVal.trim();
      if (trimmed === '[]' || trimmed === '') {
        meta.tags = trimmed === '' ? [] : [];
        if (trimmed === '') {
          // collect block list
          while (i + 1 < lines.length && /^\s*-\s*/.test(lines[i + 1])) {
            i++;
            meta.tags.push(unquoteYamlString(lines[i].replace(/^\s*-\s*/, '')));
          }
        }
      } else if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
        const inner = trimmed.slice(1, -1);
        meta.tags = inner
          .split(',')
          .map((t) => unquoteYamlString(t.trim()))
          .filter(Boolean);
      }
    } else if (key === 'draft') {
      meta.draft = rawVal.trim() === 'true';
    } else if (key === 'title') {
      meta.title = unquoteYamlString(rawVal);
    } else if (key === 'date') {
      meta.date = unquoteYamlString(rawVal);
    } else if (key === 'description') {
      meta.description = unquoteYamlString(rawVal);
    } else if (key === 'og_image') {
      meta.og_image = unquoteYamlString(rawVal);
    } else if (key === 'meta_description') {
      meta.meta_description = unquoteYamlString(rawVal);
    }
  }

  return {
    meta: {
      title: meta.title ?? '',
      date: meta.date ?? new Date().toISOString().slice(0, 10),
      description: meta.description ?? '',
      tags: meta.tags ?? [],
      draft: meta.draft ?? false,
      og_image: meta.og_image,
      meta_description: meta.meta_description,
    },
    body,
  };
}
