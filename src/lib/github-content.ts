// Thin wrapper over the GitHub Contents API for editing files in the blog repo.
// Reads/writes use a server-side fine-grained PAT in GITHUB_WRITE_TOKEN.
// Repo coordinates are hardcoded — this editor is single-tenant by design.

const OWNER = 'SemihMutlu07';
const REPO = 'selambuarada.com';
const BRANCH = 'main';
const API = 'https://api.github.com';

function getToken(): string {
  const token =
    (import.meta.env.GITHUB_WRITE_TOKEN as string | undefined) ||
    (typeof process !== 'undefined' ? process.env.GITHUB_WRITE_TOKEN : undefined);
  if (!token) {
    throw new Error('GITHUB_WRITE_TOKEN is not configured');
  }
  return token;
}

function authHeaders(): Record<string, string> {
  return {
    Accept: 'application/vnd.github+json',
    Authorization: `Bearer ${getToken()}`,
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'selambuarada-editor',
  };
}

function encodePath(path: string): string {
  return path
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/');
}

interface ContentResponse {
  sha: string;
  content: string;
  encoding: 'base64';
}

interface DirEntry {
  name: string;
  path: string;
  sha: string;
  type: 'file' | 'dir' | string;
}

interface FileResult {
  sha: string;
  content: string; // utf-8
}

export async function getFile(path: string): Promise<FileResult | null> {
  const url = `${API}/repos/${OWNER}/${REPO}/contents/${encodePath(path)}?ref=${BRANCH}`;
  const res = await fetch(url, { headers: authHeaders() });
  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`GitHub getFile ${path} failed: ${res.status} ${await res.text()}`);
  }
  const data = (await res.json()) as ContentResponse;
  const cleaned = data.content.replace(/\n/g, '');
  const bytes = Uint8Array.from(atob(cleaned), (c) => c.charCodeAt(0));
  return { sha: data.sha, content: new TextDecoder().decode(bytes) };
}

export async function listFiles(
  dir: string,
): Promise<Array<{ name: string; path: string; sha: string }>> {
  const url = `${API}/repos/${OWNER}/${REPO}/contents/${encodePath(dir)}?ref=${BRANCH}`;
  const res = await fetch(url, { headers: authHeaders() });
  if (res.status === 404) return [];
  if (!res.ok) {
    throw new Error(`GitHub listFiles ${dir} failed: ${res.status} ${await res.text()}`);
  }
  const data = (await res.json()) as DirEntry[];
  return data
    .filter((e) => e.type === 'file')
    .map(({ name, path, sha }) => ({ name, path, sha }));
}

function utf8ToBase64(content: string): string {
  const bytes = new TextEncoder().encode(content);
  return bytesToBase64(bytes);
}

function bytesToBase64(bytes: Uint8Array): string {
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

export async function commitFile(opts: {
  path: string;
  content: string | Uint8Array;
  message: string;
  sha?: string;
}): Promise<{ sha: string }> {
  const url = `${API}/repos/${OWNER}/${REPO}/contents/${encodePath(opts.path)}`;
  const encoded =
    typeof opts.content === 'string'
      ? utf8ToBase64(opts.content)
      : bytesToBase64(opts.content);
  const body: Record<string, string> = {
    message: opts.message,
    content: encoded,
    branch: BRANCH,
  };
  if (opts.sha) body.sha = opts.sha;
  const res = await fetch(url, {
    method: 'PUT',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(
      `GitHub commitFile ${opts.path} failed: ${res.status} ${await res.text()}`,
    );
  }
  const data = (await res.json()) as { content: { sha: string } };
  return { sha: data.content.sha };
}

export async function deleteFile(opts: {
  path: string;
  sha: string;
  message: string;
}): Promise<void> {
  const url = `${API}/repos/${OWNER}/${REPO}/contents/${encodePath(opts.path)}`;
  const res = await fetch(url, {
    method: 'DELETE',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: opts.message,
      sha: opts.sha,
      branch: BRANCH,
    }),
  });
  if (!res.ok) {
    throw new Error(
      `GitHub deleteFile ${opts.path} failed: ${res.status} ${await res.text()}`,
    );
  }
}

