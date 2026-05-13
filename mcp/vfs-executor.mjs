import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import { resolve, dirname, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readdir, stat } from 'node:fs/promises';

const execAsync = promisify(exec);

let PROJECT_ROOT;
try {
  const metaUrl = typeof import.meta !== 'undefined' ? import.meta.url : undefined;
  if (metaUrl) {
    PROJECT_ROOT = resolve(dirname(fileURLToPath(metaUrl)), '..');
  } else {
    PROJECT_ROOT = process.cwd();
  }
} catch {
  PROJECT_ROOT = process.cwd();
}

const LOCAL_BIN = join(PROJECT_ROOT, 'bin');
process.env.PATH = `${LOCAL_BIN}:${process.env.PATH}`;

const MAX_OUTPUT = 5000;

const ALLOWED_COMMANDS = [
  'ls', 'stat', 'cat', 'head', 'tail',
  'grep', 'rg', 'sed', 'awk', 'cut', 'sort', 'uniq', 'wc'
];

const BUILTIN_COMMANDS = ['tree', 'find'];

const ALL_COMMANDS_STR = [
  ...ALLOWED_COMMANDS,
  ...BUILTIN_COMMANDS.map(c => c + ' (built-in)'),
].join(', ');

function splitByCommandSeparators(command) {
  const segments = [];
  let current = '';
  let inSingleQuote = false;
  let inDoubleQuote = false;

  for (let i = 0; i < command.length; i++) {
    const char = command[i];

    if (char === "'" && !inDoubleQuote) { inSingleQuote = !inSingleQuote; current += char; }
    else if (char === '"' && !inSingleQuote) { inDoubleQuote = !inDoubleQuote; current += char; }
    else if ((char === ';' || char === '|') && !inSingleQuote && !inDoubleQuote) {
      if (current.trim()) segments.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  if (current.trim()) segments.push(current.trim());
  return segments;
}

function truncate(text, max) {
  if (text.length <= max) return text;
  return text.slice(0, max) + `\n... (output truncated, ${text.length - max} more chars. Use | tail or | head to narrow)`;
}

// ---- built-in find ----

function parseNamePattern(args) {
  const m = args.match(/-name\s+['\"]?([^'\"]+)['\"]?/);
  return m ? new RegExp('^' + m[1].replace(/\*/g, '.*').replace(/\?/g, '.') + '$') : null;
}

function parseMaxDepth(args) {
  const m = args.match(/-maxdepth\s+(\d+)/);
  return m ? parseInt(m[1]) : Infinity;
}

function parseType(args) {
  const m = args.match(/-type\s+([fdb])/);
  return m ? m[1] : null;
}

async function builtinFind(rootDir, args) {
  const pattern = parseNamePattern(args);
  const maxDepth = parseMaxDepth(args);
  const typeFilter = parseType(args);
  const results = [];

  async function walk(dir, depth) {
    if (depth > maxDepth) return;
    const entries = await readdir(dir, { withFileTypes: true }).catch(() => []);
    for (const entry of entries) {
      if (entry.name.startsWith('.') && entry.name !== '.') continue;
      const relPath = relative(rootDir, join(dir, entry.name)) || '.';
      if (relPath === '.') continue;

      const isDir = entry.isDirectory();
      const excludeDirs = ['node_modules', '.git', 'dist', '.angular', 'tmp', '.netlify'];
      if (isDir && excludeDirs.includes(entry.name)) continue;

      const matchType = typeFilter ? (typeFilter === 'd' ? isDir : typeFilter === 'f' ? !isDir : true) : true;
      const matchName = pattern ? pattern.test(entry.name) : true;

      if (matchType && matchName) {
        results.push('./' + relPath.split(sep).join('/'));
      }

      if (isDir) {
        await walk(join(dir, entry.name), depth + 1);
      }
    }
  }

  await walk(rootDir, 0);
  return results.sort((a, b) => a.localeCompare(b)).join('\n');
}

// ---- built-in tree ----

async function builtinTree(rootDir, args) {
  const ignoreDirs = new Set(['node_modules', '.git', 'dist', '.angular', 'tmp', '.netlify']);

  async function* walk(dir, depth) {
    const entries = await readdir(dir, { withFileTypes: true }).catch(() => []);
    const dirs = entries.filter(e => e.isDirectory() && !ignoreDirs.has(e.name));
    const files = entries.filter(e => e.isFile());

    for (const entry of [...dirs, ...files]) {
      const prefix = depth === 0 ? '' : '│   '.repeat(depth - 1) + '├── ';
      yield prefix + entry.name;

      if (entry.isDirectory()) {
        yield* walk(join(dir, entry.name), depth + 1);
      }
    }
  }

  const lines = [];
  const basename = rootDir.split('/').pop() || 'content';
  lines.push(basename);

  for await (const line of walk(rootDir, 0)) {
    lines.push(line);
  }

  const stats = await stat(rootDir).catch(() => null);
  if (stats) {
    const dirCount = lines.filter(l => l.endsWith('/') || l.includes('│')).length;
    const fileCount = lines.length - 1 - dirCount;
    lines.push('');
    lines.push(`${dirCount} directories, ${fileCount} files`);
  }

  return lines.join('\n');
}

// ---- main executor ----

/**
 * Executes read-only shell commands inside the content/ sandbox.
 *
 * Supported: ls, stat, cat, head, tail, grep, rg, sed, awk, cut, sort, uniq, wc
 * Built-in:  tree, find
 * Operators: ; (chain), | (pipe), > (redirect out), < (redirect in), & (bg)
 * Security:  each sub-command is validated; .. is blocked; 10s timeout; output truncated to ${MAX_OUTPUT} chars
 */
export async function executeVfsCommand(command, rootDir) {
  const normalizedRoot = resolve(rootDir);

  if (command.includes('..')) {
    const hint = '[Hint: use find or tree to explore the docs filesystem instead]';
    throw new Error(`Access to parent directories via ".." is not allowed. ${hint}`);
  }

  const firstWord = command.split(/\s+/)[0];
  if (BUILTIN_COMMANDS.includes(firstWord)) {
    const fn = firstWord === 'find' ? builtinFind : builtinTree;
    const args = command.slice(firstWord.length).trim();
    try {
      const stdout = await fn(normalizedRoot, args);
      return { exit: 0, stdout: truncate(stdout, MAX_OUTPUT), stderr: '' };
    } catch (error) {
      return { exit: 1, stdout: '', stderr: truncate(error.message, MAX_OUTPUT) };
    }
  }

  const segments = splitByCommandSeparators(command);
  for (const segment of segments) {
    const baseCommand = segment.split(/\s+/)[0];
    if (!ALLOWED_COMMANDS.includes(baseCommand)) {
      throw new Error(
        `Command "${baseCommand}" is not allowed.\n` +
        `Allowed: ${ALL_COMMANDS_STR}\n` +
        `[Hint: use ; to chain multiple allowed commands]`
      );
    }
  }

  try {
    const { stdout, stderr } = await execAsync(command, {
      cwd: normalizedRoot,
      timeout: 10000,
      maxBuffer: 1024 * 1024 * 5,
      env: { ...process.env, LANG: 'C.UTF-8' }
    });

    return {
      exit: 0,
      stdout: truncate(stdout.trim(), MAX_OUTPUT),
      stderr: truncate(stderr.trim(), MAX_OUTPUT),
    };
  } catch (error) {
    if (error.killed) {
      return {
        exit: 124,
        stdout: '',
        stderr: 'Command timed out (limit: 10s). [Hint: narrow your search with -name or pipe to | head]',
      };
    }

    const stderr = error.stderr ? error.stderr.trim() : error.message.trim();
    const stdout = error.stdout ? error.stdout.trim() : '';

    if (stderr.includes('not found') || error.code === 127) {
      return {
        exit: error.code ?? 1,
        stdout: truncate(stdout, MAX_OUTPUT),
        stderr: truncate(stderr + '\n[Hint: this tool is not installed in the environment]', MAX_OUTPUT),
      };
    }

    return {
      exit: error.code ?? 1,
      stdout: truncate(stdout, MAX_OUTPUT),
      stderr: truncate(stderr, MAX_OUTPUT),
    };
  }
}
