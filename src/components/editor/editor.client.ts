/*
  Editor client. Mounts TipTap on the body, wires the title/subtitle inputs,
  bubble menu, slash menu, status bar, metadata sheet, autosave, and save flow.

  This file is the only place that touches TipTap. The rest of the codebase
  stays clean of editor concerns.
*/

import { Editor, Node, mergeAttributes } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Typography from '@tiptap/extension-typography';
import { Markdown } from 'tiptap-markdown';

// ─── hand-rolled image node (no extra deps) ─────────────────────────────
// Serializes to markdown `![alt](src)` via prosemirror-markdown's default
// image handler — the node name and attribute names match what it expects.
const ImageNode = Node.create({
  name: 'image',
  inline: false,
  group: 'block',
  atom: true,
  draggable: true,
  addAttributes() {
    return {
      src: { default: null },
      alt: { default: null },
      title: { default: null },
    };
  },
  parseHTML() {
    return [{ tag: 'img[src]' }];
  },
  renderHTML({ HTMLAttributes }) {
    return ['img', mergeAttributes(HTMLAttributes)];
  },
});

// ─── types ───────────────────────────────────────────────────────────────

interface PostMeta {
  title: string;
  subtitle: string;       // shown as subtitle, persisted as `description`
  slug: string;
  date: string;           // YYYY-MM-DD
  tags: string[];
  draft: boolean;
  og_image: string;
  meta_description: string;
}

interface InitData {
  meta: Partial<PostMeta>;
  body: string;           // markdown
  originalSlug: string | null;
}

interface SaveResponse {
  ok?: boolean;
  slug?: string;
  url?: string;
  error?: string;
}

// ─── util ────────────────────────────────────────────────────────────────

const TURKISH_MAP: Record<string, string> = {
  ç: 'c', Ç: 'c', ş: 's', Ş: 's', ğ: 'g', Ğ: 'g',
  ı: 'i', İ: 'i', ö: 'o', Ö: 'o', ü: 'u', Ü: 'u',
};

function slugify(input: string): string {
  if (!input) return '';
  let s = input;
  for (const [from, to] of Object.entries(TURKISH_MAP)) {
    s = s.split(from).join(to);
  }
  return s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function debounce<T extends (...args: never[]) => void>(fn: T, ms: number): T {
  let t: ReturnType<typeof setTimeout> | null = null;
  return ((...args: never[]) => {
    if (t) clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  }) as T;
}

function autoGrow(el: HTMLTextAreaElement): void {
  el.style.height = 'auto';
  el.style.height = `${el.scrollHeight}px`;
}

function relativeTime(ms: number): string {
  const seconds = Math.round((Date.now() - ms) / 1000);
  if (seconds < 5) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  return `${hours}h ago`;
}

function countWords(markdown: string): number {
  const text = markdown.replace(/[#>*_`~\-\[\]\(\)]/g, ' ').trim();
  if (!text) return 0;
  return text.split(/\s+/).length;
}

const isMac =
  typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.userAgent);
const cmdKey = isMac ? '⌘' : 'Ctrl';

// ─── slash menu items ────────────────────────────────────────────────────

interface SlashItem {
  label: string;
  match: string[]; // search keywords
  run: (editor: Editor) => void;
}

// pickImageFile / insertImageAtCursor are defined inside initEditor because
// they close over the Editor instance and the uploadImage helper.
const SLASH_ITEMS: SlashItem[] = [
  { label: 'Heading 2', match: ['h2', 'heading', 'başlık'], run: (e) => e.chain().focus().toggleHeading({ level: 2 }).run() },
  { label: 'Heading 3', match: ['h3', 'subheading'], run: (e) => e.chain().focus().toggleHeading({ level: 3 }).run() },
  { label: 'Quote', match: ['quote', 'blockquote', 'alıntı'], run: (e) => e.chain().focus().toggleBlockquote().run() },
  { label: 'Code block', match: ['code', 'kod'], run: (e) => e.chain().focus().toggleCodeBlock().run() },
  { label: 'Bullet list', match: ['list', 'ul', 'liste'], run: (e) => e.chain().focus().toggleBulletList().run() },
  { label: 'Numbered list', match: ['number', 'ol', 'sayı'], run: (e) => e.chain().focus().toggleOrderedList().run() },
  { label: 'Image', match: ['image', 'img', 'resim', 'görsel'], run: () => { /* wired inside initEditor */ } },
  { label: 'Divider', match: ['hr', 'rule', 'divider', 'ayırıcı'], run: (e) => e.chain().focus().setHorizontalRule().run() },
];

// ─── state ───────────────────────────────────────────────────────────────

class State {
  meta: PostMeta;
  body = '';
  isDirty = false;
  isSaving = false;
  lastSavedAt: number | null = null;
  errorMessage: string | null = null;
  originalSlug: string | null;

  constructor(init: InitData) {
    this.meta = {
      title: '',
      subtitle: '',
      slug: '',
      date: todayISO(),
      tags: [],
      draft: true,
      og_image: '',
      meta_description: '',
      ...init.meta,
    };
    this.body = init.body || '';
    this.originalSlug = init.originalSlug;
  }
}

// ─── init ────────────────────────────────────────────────────────────────

export function initEditor(): void {
  const dataEl = document.getElementById('editor-init');
  if (!dataEl) return;

  let initData: InitData;
  try {
    initData = JSON.parse(dataEl.textContent || '{}') as InitData;
  } catch {
    initData = { meta: {}, body: '', originalSlug: null };
  }

  const state = new State(initData);

  // ── DOM refs ──────────────────────────────────────────────────────────
  const shell = document.querySelector<HTMLElement>('.editor-shell')!;
  const titleEl = document.querySelector<HTMLTextAreaElement>('#editor-title')!;
  const subtitleEl = document.querySelector<HTMLTextAreaElement>('#editor-subtitle')!;
  const bodyEl = document.querySelector<HTMLDivElement>('#editor-body')!;
  const statusKeys = document.querySelector<HTMLElement>('.editor-statusbar__keys')!;
  const statusState = document.querySelector<HTMLElement>('.editor-statusbar__state')!;
  const statusBar = document.querySelector<HTMLElement>('.editor-statusbar')!;
  const bubbleEl = document.querySelector<HTMLElement>('#editor-bubblemenu')!;
  const slashEl = document.querySelector<HTMLElement>('#editor-slashmenu')!;
  const slashListEl = slashEl.querySelector<HTMLElement>('.editor-slashmenu__list')!;
  const sheetEl = document.querySelector<HTMLElement>('#editor-sheet')!;
  const sheetBackdropEl = document.querySelector<HTMLElement>('#editor-sheet-backdrop')!;
  const sheetSlugEl = document.querySelector<HTMLInputElement>('#meta-slug')!;
  const sheetDateEl = document.querySelector<HTMLInputElement>('#meta-date')!;
  const sheetMetaDescEl = document.querySelector<HTMLTextAreaElement>('#meta-description')!;
  const sheetOgImageEl = document.querySelector<HTMLInputElement>('#meta-ogimage')!;
  const sheetDraftEl = document.querySelector<HTMLInputElement>('#meta-draft')!;
  const sheetTagsContainer = document.querySelector<HTMLElement>('#meta-tags')!;
  const sheetTagInput = document.querySelector<HTMLInputElement>('#meta-tag-input')!;
  const sheetCloseEl = document.querySelector<HTMLElement>('#editor-sheet-close')!;
  const sheetDoneEl = document.querySelector<HTMLElement>('#editor-sheet-done')!;

  // Render the keyboard hint legend in the status bar.
  statusKeys.innerHTML = `
    <button class="editor-statusbar__key" data-action="metadata"><kbd>${cmdKey}K</kbd> metadata</button>
    <button class="editor-statusbar__key" data-action="preview"><kbd>${cmdKey}P</kbd> preview</button>
    <button class="editor-statusbar__key" data-action="save"><kbd>${cmdKey}S</kbd> save</button>
    <button class="editor-statusbar__key" data-action="publish"><kbd>${cmdKey}⇧P</kbd> publish</button>
  `;

  // ── image upload ──────────────────────────────────────────────────────
  async function uploadImage(file: File): Promise<string> {
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch('/api/posts/upload', { method: 'POST', body: fd });
    const data = (await res.json()) as { ok?: boolean; url?: string; error?: string };
    if (!res.ok || !data.url) {
      throw new Error(data.error || `upload failed: ${res.status}`);
    }
    return data.url;
  }

  function insertImageByUrl(url: string, alt = ''): void {
    editor
      .chain()
      .focus()
      .insertContent({ type: 'image', attrs: { src: url, alt } })
      .run();
  }

  async function handleImageFile(file: File): Promise<void> {
    state.errorMessage = null;
    state.isSaving = true;
    renderState();
    try {
      const url = await uploadImage(file);
      insertImageByUrl(url, file.name.replace(/\.[^.]+$/, ''));
      state.isSaving = false;
      state.lastSavedAt = null;
      renderState();
    } catch (err) {
      state.isSaving = false;
      state.errorMessage = err instanceof Error ? err.message : 'image upload failed';
      renderState();
    }
  }

  function pickImageFile(): void {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.addEventListener('change', () => {
      const file = input.files?.[0];
      if (file) void handleImageFile(file);
    });
    input.click();
  }

  // Wire the Image item now that uploads are available.
  const imageItem = SLASH_ITEMS.find((it) => it.label === 'Image');
  if (imageItem) imageItem.run = () => pickImageFile();

  // ── editor (TipTap) ───────────────────────────────────────────────────
  const editor: Editor = new Editor({
    element: bodyEl,
    extensions: [
      StarterKit.configure({
        link: { openOnClick: false, autolink: true, linkOnPaste: true },
      }),
      ImageNode,
      Placeholder.configure({
        placeholder: '',
        showOnlyWhenEditable: true,
      }),
      Typography,
      Markdown.configure({
        html: false,
        linkify: true,
        breaks: false,
        tightLists: true,
        transformPastedText: true,
        transformCopiedText: false,
      }),
    ],
    content: state.body || '',
    autofocus: false,
    editorProps: {
      attributes: {
        class: 'prose-nd',
      },
      handlePaste: (_view, event) => {
        const items = event.clipboardData?.items;
        if (!items) return false;
        for (const item of Array.from(items)) {
          if (item.type.startsWith('image/')) {
            const file = item.getAsFile();
            if (file) {
              event.preventDefault();
              void handleImageFile(file);
              return true;
            }
          }
        }
        return false;
      },
      handleDrop: (_view, event) => {
        const dt = (event as DragEvent).dataTransfer;
        if (!dt || !dt.files || dt.files.length === 0) return false;
        const file = dt.files[0];
        if (!file.type.startsWith('image/')) return false;
        event.preventDefault();
        void handleImageFile(file);
        return true;
      },
    },
    onUpdate: ({ editor }) => {
      const storage = editor.storage as unknown as {
        markdown: { getMarkdown: () => string };
      };
      const md = storage.markdown.getMarkdown();
      state.body = md;
      state.isDirty = true;
      updateEmptyState();
      autosaveLocal();
      renderState();
    },
    onSelectionUpdate: () => {
      renderBubbleMenu();
    },
  });

  function updateEmptyState(): void {
    const empty =
      !state.meta.title.trim() &&
      !state.meta.subtitle.trim() &&
      editor.isEmpty;
    shell.classList.toggle('is-empty', empty);
  }

  // Hydrate inputs
  titleEl.value = state.meta.title;
  subtitleEl.value = state.meta.subtitle;
  sheetSlugEl.value = state.meta.slug;
  sheetDateEl.value = state.meta.date;
  sheetMetaDescEl.value = state.meta.meta_description;
  sheetOgImageEl.value = state.meta.og_image;
  sheetDraftEl.checked = state.meta.draft;
  renderTags();
  autoGrow(titleEl);
  autoGrow(subtitleEl);
  renderState();
  updateEmptyState();

  // ── title / subtitle wiring ───────────────────────────────────────────
  titleEl.addEventListener('input', () => {
    state.meta.title = titleEl.value;
    if (!state.originalSlug) {
      // Auto-derive slug from title for new posts only.
      state.meta.slug = slugify(titleEl.value);
      sheetSlugEl.value = state.meta.slug;
    }
    state.isDirty = true;
    autoGrow(titleEl);
    updateEmptyState();
    autosaveLocal();
    renderState();
  });

  subtitleEl.addEventListener('input', () => {
    state.meta.subtitle = subtitleEl.value;
    state.isDirty = true;
    autoGrow(subtitleEl);
    updateEmptyState();
    autosaveLocal();
    renderState();
  });

  // Enter in title moves to subtitle. Enter in subtitle moves to body.
  titleEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      subtitleEl.focus();
    }
  });
  subtitleEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      editor.commands.focus('start');
    }
  });

  // ── status bar buttons ────────────────────────────────────────────────
  statusKeys.addEventListener('click', (e) => {
    const target = (e.target as HTMLElement).closest<HTMLElement>('[data-action]');
    if (!target) return;
    const action = target.dataset.action;
    if (action === 'metadata') openSheet();
    else if (action === 'preview') togglePreview();
    else if (action === 'save') save('draft');
    else if (action === 'publish') save('publish');
  });

  // ── status bar idle fade ──────────────────────────────────────────────
  let idleTimer: ReturnType<typeof setTimeout> | null = null;
  function bumpIdle(): void {
    statusBar.classList.remove('is-idle');
    if (idleTimer) clearTimeout(idleTimer);
    idleTimer = setTimeout(() => statusBar.classList.add('is-idle'), 2400);
  }
  document.addEventListener('mousemove', bumpIdle);
  document.addEventListener('keydown', bumpIdle);
  bumpIdle();

  // ── render helpers ────────────────────────────────────────────────────
  function renderState(): void {
    const words = countWords(state.body);
    const draftLabel = state.meta.draft ? 'draft' : 'live';
    let savedLabel: string;
    if (state.isSaving) savedLabel = 'saving…';
    else if (state.errorMessage) savedLabel = state.errorMessage;
    else if (state.lastSavedAt) savedLabel = `saved ${relativeTime(state.lastSavedAt)}`;
    else if (state.isDirty) savedLabel = 'unsaved';
    else savedLabel = 'idle';

    statusState.innerHTML = `
      <span>${draftLabel}</span>
      <span class="${state.errorMessage ? 'is-error' : ''}">${escapeHtml(savedLabel)}</span>
      <span>${words}w</span>
    `;
  }

  function renderTags(): void {
    sheetTagsContainer.querySelectorAll('.editor-tag').forEach((n) => n.remove());
    state.meta.tags.forEach((tag, i) => {
      const chip = document.createElement('span');
      chip.className = 'editor-tag';
      chip.innerHTML = `${escapeHtml(tag)} <button type="button" data-i="${i}" aria-label="Remove tag">×</button>`;
      sheetTagsContainer.insertBefore(chip, sheetTagInput);
    });
  }

  // Periodic re-render so "saved Xs ago" updates
  setInterval(renderState, 5000);

  // ── metadata sheet ────────────────────────────────────────────────────
  function openSheet(): void {
    sheetEl.classList.add('is-open');
    sheetBackdropEl.classList.add('is-open');
    sheetSlugEl.focus();
  }
  function closeSheet(): void {
    sheetEl.classList.remove('is-open');
    sheetBackdropEl.classList.remove('is-open');
    editor.commands.focus();
  }
  sheetCloseEl.addEventListener('click', closeSheet);
  sheetDoneEl.addEventListener('click', closeSheet);
  sheetBackdropEl.addEventListener('click', closeSheet);

  sheetSlugEl.addEventListener('input', () => {
    state.meta.slug = slugify(sheetSlugEl.value || '');
    state.isDirty = true;
    autosaveLocal();
  });
  sheetDateEl.addEventListener('input', () => {
    state.meta.date = sheetDateEl.value;
    state.isDirty = true;
    autosaveLocal();
  });
  sheetMetaDescEl.addEventListener('input', () => {
    state.meta.meta_description = sheetMetaDescEl.value;
    state.isDirty = true;
    autosaveLocal();
  });
  sheetOgImageEl.addEventListener('input', () => {
    state.meta.og_image = sheetOgImageEl.value;
    state.isDirty = true;
    autosaveLocal();
  });
  sheetDraftEl.addEventListener('change', () => {
    state.meta.draft = sheetDraftEl.checked;
    state.isDirty = true;
    renderState();
    autosaveLocal();
  });
  sheetTagInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const v = sheetTagInput.value.trim().replace(/,$/, '').trim();
      if (v && !state.meta.tags.includes(v)) {
        state.meta.tags.push(v);
        renderTags();
        state.isDirty = true;
        autosaveLocal();
      }
      sheetTagInput.value = '';
    } else if (e.key === 'Backspace' && sheetTagInput.value === '' && state.meta.tags.length > 0) {
      state.meta.tags.pop();
      renderTags();
      state.isDirty = true;
      autosaveLocal();
    }
  });
  sheetTagsContainer.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    if (target.tagName === 'BUTTON' && target.dataset.i !== undefined) {
      const i = parseInt(target.dataset.i, 10);
      state.meta.tags.splice(i, 1);
      renderTags();
      state.isDirty = true;
      autosaveLocal();
    }
  });

  // ── preview mode ──────────────────────────────────────────────────────
  function togglePreview(): void {
    shell.classList.toggle('is-preview');
    const isPreview = shell.classList.contains('is-preview');
    editor.setEditable(!isPreview);
    if (!isPreview) editor.commands.focus();
  }

  // ── bubble menu ───────────────────────────────────────────────────────
  bubbleEl.innerHTML = `
    <button data-key="b" type="button" title="Bold">B</button>
    <button data-key="i" type="button" title="Italic">i</button>
    <button data-key="link" type="button" title="Link">link</button>
    <button data-key="h2" type="button" title="Heading 2">H2</button>
    <button data-key="h3" type="button" title="Heading 3">H3</button>
    <button data-key="quote" type="button" title="Quote">&ldquo;</button>
    <button data-key="code" type="button" title="Code">&lt;&gt;</button>
  `;
  bubbleEl.addEventListener('mousedown', (e) => e.preventDefault());
  bubbleEl.addEventListener('click', (e) => {
    const target = (e.target as HTMLElement).closest<HTMLElement>('[data-key]');
    if (!target) return;
    const key = target.dataset.key;
    const chain = editor.chain().focus();
    if (key === 'b') chain.toggleBold().run();
    else if (key === 'i') chain.toggleItalic().run();
    else if (key === 'h2') chain.toggleHeading({ level: 2 }).run();
    else if (key === 'h3') chain.toggleHeading({ level: 3 }).run();
    else if (key === 'quote') chain.toggleBlockquote().run();
    else if (key === 'code') chain.toggleCode().run();
    else if (key === 'link') {
      const prevHref = editor.getAttributes('link').href as string | undefined;
      const url = window.prompt('URL', prevHref || 'https://');
      if (url === null) return;
      if (url === '') chain.unsetLink().run();
      else chain.extendMarkRange('link').setLink({ href: url }).run();
    }
  });

  function renderBubbleMenu(): void {
    const { from, to, empty } = editor.state.selection;
    if (empty || !editor.isFocused) {
      bubbleEl.classList.remove('is-open');
      return;
    }
    // Hide if selection is inside a code block
    if (editor.isActive('codeBlock')) {
      bubbleEl.classList.remove('is-open');
      return;
    }
    try {
      const startCoords = editor.view.coordsAtPos(from);
      const endCoords = editor.view.coordsAtPos(to);
      const top = Math.min(startCoords.top, endCoords.top);
      const left = (startCoords.left + endCoords.right) / 2;
      bubbleEl.classList.add('is-open');
      // Position above selection. Width is dynamic; offset by half-width.
      const rect = bubbleEl.getBoundingClientRect();
      bubbleEl.style.top = `${Math.max(8, top - rect.height - 8)}px`;
      bubbleEl.style.left = `${Math.max(8, Math.min(window.innerWidth - rect.width - 8, left - rect.width / 2))}px`;
      // Update active state
      bubbleEl.querySelectorAll<HTMLElement>('[data-key]').forEach((btn) => {
        const key = btn.dataset.key;
        let active = false;
        if (key === 'b') active = editor.isActive('bold');
        else if (key === 'i') active = editor.isActive('italic');
        else if (key === 'h2') active = editor.isActive('heading', { level: 2 });
        else if (key === 'h3') active = editor.isActive('heading', { level: 3 });
        else if (key === 'quote') active = editor.isActive('blockquote');
        else if (key === 'code') active = editor.isActive('code');
        else if (key === 'link') active = editor.isActive('link');
        btn.classList.toggle('is-active', active);
      });
    } catch {
      bubbleEl.classList.remove('is-open');
    }
  }

  // ── slash menu ────────────────────────────────────────────────────────
  let slashOpen = false;
  let slashQuery = '';
  let slashStartPos = 0;
  let slashActiveIndex = 0;

  function renderSlashMenu(): void {
    if (!slashOpen) {
      slashEl.classList.remove('is-open');
      return;
    }
    const filtered = SLASH_ITEMS.filter((item) => {
      if (!slashQuery) return true;
      const q = slashQuery.toLowerCase();
      if (item.label.toLowerCase().includes(q)) return true;
      return item.match.some((m) => m.toLowerCase().startsWith(q));
    });
    if (filtered.length === 0) {
      closeSlash();
      return;
    }
    slashActiveIndex = Math.min(slashActiveIndex, filtered.length - 1);
    slashListEl.innerHTML = filtered
      .map(
        (item, i) =>
          `<li class="editor-slashmenu__item ${i === slashActiveIndex ? 'is-active' : ''}" data-i="${i}" data-label="${escapeHtml(item.label)}"><span>${escapeHtml(item.label)}</span></li>`,
      )
      .join('');
    slashEl.classList.add('is-open');
    // Position near cursor
    try {
      const coords = editor.view.coordsAtPos(slashStartPos);
      slashEl.style.top = `${coords.bottom + 6}px`;
      slashEl.style.left = `${coords.left}px`;
    } catch {
      // ignore
    }
  }

  function openSlash(pos: number): void {
    slashOpen = true;
    slashQuery = '';
    slashStartPos = pos;
    slashActiveIndex = 0;
    renderSlashMenu();
  }

  function closeSlash(): void {
    slashOpen = false;
    slashQuery = '';
    renderSlashMenu();
  }

  function runSlashItem(label: string): void {
    const item = SLASH_ITEMS.find((it) => it.label === label);
    if (!item) return;
    // Remove the typed query (the "/foo" portion)
    const queryLen = slashQuery.length + 1; // +1 for the slash itself
    editor
      .chain()
      .focus()
      .deleteRange({ from: slashStartPos, to: slashStartPos + queryLen })
      .run();
    item.run(editor);
    closeSlash();
  }

  slashListEl.addEventListener('mousedown', (e) => e.preventDefault());
  slashListEl.addEventListener('click', (e) => {
    const target = (e.target as HTMLElement).closest<HTMLElement>('[data-label]');
    if (!target) return;
    runSlashItem(target.dataset.label || '');
  });

  // Hook into the contentEditable for slash detection
  bodyEl.addEventListener('keydown', (e) => {
    if (slashOpen) {
      const filtered = SLASH_ITEMS.filter((item) => {
        if (!slashQuery) return true;
        const q = slashQuery.toLowerCase();
        return item.label.toLowerCase().includes(q) || item.match.some((m) => m.toLowerCase().startsWith(q));
      });
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        slashActiveIndex = (slashActiveIndex + 1) % Math.max(1, filtered.length);
        renderSlashMenu();
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        slashActiveIndex = (slashActiveIndex - 1 + filtered.length) % Math.max(1, filtered.length);
        renderSlashMenu();
        return;
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        const item = filtered[slashActiveIndex];
        if (item) runSlashItem(item.label);
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        closeSlash();
        return;
      }
    }
  });

  bodyEl.addEventListener('input', () => {
    if (!slashOpen) {
      // Check if user just typed `/` at the start of an empty paragraph
      const { selection } = editor.state;
      const { $from } = selection;
      const isAtStart = $from.parentOffset === 1 && $from.parent.type.name === 'paragraph';
      const charBefore = $from.parent.textContent.charAt(0);
      if (isAtStart && charBefore === '/') {
        openSlash($from.pos - 1);
      }
    } else {
      // Update query
      const { selection } = editor.state;
      const { $from } = selection;
      const text = $from.parent.textContent;
      const slashIdx = text.indexOf('/');
      if (slashIdx === -1) {
        closeSlash();
      } else {
        slashQuery = text.slice(slashIdx + 1);
        renderSlashMenu();
      }
    }
  });

  // ── autosave (localStorage only) ──────────────────────────────────────
  const storageKey = `editor:${state.originalSlug || '__draft__'}`;

  const autosaveLocal = debounce(() => {
    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify({
          meta: state.meta,
          body: state.body,
          savedAt: Date.now(),
        }),
      );
    } catch {
      // ignore quota errors
    }
  }, 800);

  // Restore from localStorage on mount IF no server-provided body
  // (only restore if newer than 1 hour to avoid stale drafts)
  if (!state.body && !state.originalSlug) {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored) as { meta: PostMeta; body: string; savedAt: number };
        const ageHours = (Date.now() - parsed.savedAt) / (1000 * 60 * 60);
        if (ageHours < 24 && parsed.body) {
          state.meta = { ...state.meta, ...parsed.meta };
          state.body = parsed.body;
          titleEl.value = state.meta.title;
          subtitleEl.value = state.meta.subtitle;
          sheetSlugEl.value = state.meta.slug;
          sheetDateEl.value = state.meta.date;
          sheetMetaDescEl.value = state.meta.meta_description;
          sheetOgImageEl.value = state.meta.og_image;
          sheetDraftEl.checked = state.meta.draft;
          renderTags();
          autoGrow(titleEl);
          autoGrow(subtitleEl);
          editor.commands.setContent(state.body);
        }
      }
    } catch {
      // ignore
    }
  }

  // ── server save ───────────────────────────────────────────────────────
  async function save(action: 'draft' | 'publish'): Promise<void> {
    if (state.isSaving) return;
    if (!state.meta.title.trim()) {
      state.errorMessage = 'title required';
      renderState();
      titleEl.focus();
      return;
    }
    state.isSaving = true;
    state.errorMessage = null;
    renderState();

    try {
      const res = await fetch('/api/posts/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          meta: {
            title: state.meta.title,
            subtitle: state.meta.subtitle,
            description: state.meta.subtitle, // subtitle IS the description in our schema
            date: state.meta.date,
            tags: state.meta.tags,
            slug: state.meta.slug || slugify(state.meta.title),
            og_image: state.meta.og_image || undefined,
            meta_description: state.meta.meta_description || undefined,
          },
          body: state.body,
          originalSlug: state.originalSlug || undefined,
        }),
      });
      const data = (await res.json()) as SaveResponse;
      if (!res.ok || !data.ok) {
        throw new Error(data.error || `save failed: ${res.status}`);
      }
      state.isSaving = false;
      state.lastSavedAt = Date.now();
      state.isDirty = false;
      // Clear local autosave
      try { localStorage.removeItem(storageKey); } catch { /* ignore */ }
      // Update originalSlug to the new slug for subsequent saves
      if (data.slug) state.originalSlug = data.slug;
      renderState();
      if (action === 'publish' && data.url) {
        // Brief pause so user sees "saved" before redirect
        setTimeout(() => {
          window.location.href = data.url!;
        }, 700);
      }
    } catch (err) {
      state.isSaving = false;
      state.errorMessage = err instanceof Error ? err.message : 'save failed';
      renderState();
    }
  }

  // ── global keyboard ───────────────────────────────────────────────────
  document.addEventListener('keydown', (e) => {
    const meta = e.metaKey || e.ctrlKey;
    if (meta && e.key.toLowerCase() === 'k' && !e.shiftKey) {
      // ⌘K: open metadata sheet, UNLESS the user is selecting text in the editor
      // (in which case ⌘K means "wrap as link" — TipTap's Link extension doesn't
      // bind ⌘K by default, so we manually intercept here).
      const isInEditor = editor.isFocused && !editor.state.selection.empty;
      if (isInEditor) {
        e.preventDefault();
        const prev = editor.getAttributes('link').href as string | undefined;
        const url = window.prompt('URL', prev || 'https://');
        if (url === null) return;
        if (url === '') editor.chain().focus().unsetLink().run();
        else editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
        return;
      }
      e.preventDefault();
      if (sheetEl.classList.contains('is-open')) closeSheet();
      else openSheet();
      return;
    }
    if (meta && e.key.toLowerCase() === 'p' && !e.shiftKey) {
      e.preventDefault();
      togglePreview();
      return;
    }
    if (meta && e.key.toLowerCase() === 's') {
      e.preventDefault();
      save('draft');
      return;
    }
    if (meta && e.shiftKey && e.key.toLowerCase() === 'p') {
      e.preventDefault();
      save('publish');
      return;
    }
    if (e.key === 'Escape') {
      if (sheetEl.classList.contains('is-open')) {
        e.preventDefault();
        closeSheet();
        return;
      }
      if (slashOpen) {
        e.preventDefault();
        closeSlash();
        return;
      }
      if (shell.classList.contains('is-preview')) {
        e.preventDefault();
        togglePreview();
        return;
      }
    }
  });

  // Hide bubble menu when scrolling (it'd otherwise float in the wrong place)
  document.addEventListener('scroll', () => {
    if (!editor.state.selection.empty) renderBubbleMenu();
  }, true);

  // Reposition slash on scroll
  document.addEventListener('scroll', () => {
    if (slashOpen) renderSlashMenu();
  }, true);
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
