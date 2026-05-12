import { readFile, readdir } from 'node:fs/promises';
import { watch } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, normalize, relative, resolve, sep } from 'node:path';
import MiniSearch from 'minisearch';

const debounce = (fn, ms) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(this, args), ms);
  };
};

const getProjectRoot = () => {
  try {
    if (typeof import.meta?.url === 'string') {
      const __dirname = dirname(fileURLToPath(import.meta.url));
      return resolve(__dirname, '..');
    }
  } catch (e) {
    // Ignore error and fallback
  }
  // Fallback for environments where import.meta.url is undefined (e.g. bundled CJS)
  // or if fileURLToPath fails.
  return process.cwd();
};

const PROJECT_ROOT = getProjectRoot();

export class DocsIndex {
  constructor({
    rootDir = PROJECT_ROOT,
    contentDir = join(PROJECT_ROOT, 'content'),
  } = {}) {
    this.rootDir = resolve(rootDir);
    this.contentDir = resolve(contentDir);
    this.files = []; // List of relative paths
    this.cache = new Map(); // path -> full content
    this.chunks = []; // Array of chunk objects { id, title, content, path }
    this.miniSearch = new MiniSearch({
      fields: ['title', 'content'], // fields to index for full-text search
      storeFields: ['title', 'content', 'path'], // fields to return with search results
      searchOptions: {
        boost: { title: 2 },
        fuzzy: 0.2,
        prefix: true,
      },
    });
    this.isReady = false;
    this.watcher = null;
    this.debouncedBuild = debounce(() => {
      console.error('File change detected, rebuilding index...');
      this.build().catch(err => console.error('Error rebuilding index:', err));
    }, 500);
  }

  async build() {
    const fullPaths = await this.collectMarkdownFiles(this.contentDir);
    this.files = fullPaths.map(file => relative(this.rootDir, file).split(sep).join('/'));

    const newCache = new Map();
    const newChunks = [];
    const newMiniSearch = new MiniSearch({
      fields: ['title', 'content'],
      storeFields: ['title', 'content', 'path'],
      searchOptions: {
        boost: { title: 2 },
        fuzzy: 0.2,
        prefix: true,
      },
    });

    for (const file of this.files) {
      const fullPath = resolve(this.rootDir, file);
      const content = await readFile(fullPath, 'utf8');
      newCache.set(file, content);

      const fileChunks = this.chunkMarkdown(file, content, newChunks.length);
      newChunks.push(...fileChunks);
    }

    newMiniSearch.addAll(newChunks);

    this.cache = newCache;
    this.chunks = newChunks;
    this.miniSearch = newMiniSearch;
    this.isReady = true;

    if (!this.watcher) {
      try {
        this.watcher = watch(this.contentDir, { recursive: true }, (eventType, filename) => {
          if (filename && filename.endsWith('.md')) {
            this.debouncedBuild();
          }
        });
      } catch (err) {
        console.error('Failed to start file watcher:', err);
      }
    }

    console.error(`Index built with ${this.files.length} files and ${this.chunks.length} chunks.`);
  }

  async collectMarkdownFiles(dir) {
    const entries = await readdir(dir, { withFileTypes: true });
    const files = await Promise.all(
      entries.map(async entry => {
        const fullPath = join(dir, entry.name);

        if (entry.isDirectory()) {
          return this.collectMarkdownFiles(fullPath);
        }

        if (entry.isFile() && entry.name.endsWith('.md')) {
          return [fullPath];
        }

        return [];
      }),
    );

    return files.flat();
  }

  chunkMarkdown(path, text, startId = 0) {
    const fileTitle = this.titleFromMarkdown(path, text);
    // Split by ##, ###, or #### headers
    const sections = text.split(/^(?=(?:##|###|####)\s+)/m);
    const chunks = [];

    let currentId = startId;

    sections.forEach((section, index) => {
      const trimmedSection = section.trim();
      if (!trimmedSection) return;

      const lines = trimmedSection.split('\n');
      let title = fileTitle;

      // Check if this section starts with a header (##, ###, or ####)
      const headerMatch = lines[0].match(/^(?:##|###|####)\s+(.+)$/);
      if (headerMatch) {
        title = `${fileTitle} > ${headerMatch[1].trim()}`;
      }

      chunks.push({
        id: `chunk-${currentId++}`,
        title,
        content: trimmedSection,
        path,
      });
    });

    return chunks;
  }

  titleFromMarkdown(path, text) {
    const heading = text.match(/^#\s+(.+)$/m);

    if (heading) {
      return heading[1].trim();
    }

    return path
      .replace(/^content\//, '')
      .replace(/\.md$/, '')
      .split('/')
      .pop()
      .replace(/-/g, ' ');
  }

  async listMarkdownFiles() {
    if (!this.isReady) {
      await this.build();
    }
    return this.files.sort((a, b) => a.localeCompare(b));
  }

  async readDocFile(requestedPath) {
    if (this.cache.has(requestedPath)) {
      return this.cache.get(requestedPath);
    }
    // Fallback to disk if cache miss (though build() should have filled it)
    const fullPath = this.resolveContentMarkdownPath(requestedPath);
    const content = await readFile(fullPath, 'utf8');
    this.cache.set(requestedPath, content);
    return content;
  }

  resolveContentMarkdownPath(requestedPath) {
    const normalizedPath = normalize(requestedPath);
    const fullPath = resolve(this.rootDir, normalizedPath);
    const relativeToContent = relative(this.contentDir, fullPath);
    const insideContent =
      relativeToContent && !relativeToContent.startsWith('..') && !relativeToContent.startsWith(sep);

    if (!insideContent || !fullPath.endsWith('.md')) {
      throw new Error('Only content markdown files can be read');
    }

    return fullPath;
  }

  async searchDocs(query, { limit = 10 } = {}) {
    if (!this.isReady) {
      await this.build();
    }

    const results = this.miniSearch.search(query);
    const queryTerms = query.toLowerCase().split(/\s+/).filter(t => t.length > 1);

    return results.slice(0, limit).map(result => {
      const rawContent = result.content ?? '';
      const snippet = this.extractSnippet(rawContent, queryTerms);
      return {
        path: result.path,
        title: result.title,
        score: result.score,
        snippet,
        url: `https://docs.nestjs.com/${result.path.replace(/^content\//, '').replace(/\.md$/, '')}`,
      };
    });
  }

  extractSnippet(text, queryTerms) {
    const maxLen = 400;
    const textLower = text.toLowerCase();

    let bestIdx = -1;
    for (const term of queryTerms) {
      const idx = textLower.indexOf(term);
      if (idx !== -1 && (bestIdx === -1 || idx < bestIdx)) {
        bestIdx = idx;
      }
    }

    let start = 0;
    let end = Math.min(text.length, maxLen);

    if (bestIdx !== -1) {
      const contextStart = Math.max(0, bestIdx - 80);
      const contextEnd = Math.min(text.length, bestIdx + maxLen - 130);
      start = contextStart;
      end = contextEnd;

      if (start > 0) {
        const ws = text.indexOf(' ', start);
        if (ws !== -1 && ws < start + 20) start = ws + 1;
      }
      if (end < text.length) {
        const ws = text.lastIndexOf(' ', end);
        if (ws !== -1 && ws > end - 20) end = ws;
      }
    }

    let snippet = text.slice(start, end).replace(/\n+/g, ' ').trim();
    if (start > 0) snippet = '...' + snippet;
    if (end < text.length) snippet = snippet + '...';
    return snippet;
  }
}

// Factory function for backward compatibility with existing server.mjs
export function createDocsIndex(options) {
  return new DocsIndex(options);
}

export async function listMarkdownFiles(index) {
  return index.listMarkdownFiles();
}

export async function readDocFile(index, path) {
  return index.readDocFile(path);
}

export async function searchDocs(index, query, options) {
  return index.searchDocs(query, options);
}
