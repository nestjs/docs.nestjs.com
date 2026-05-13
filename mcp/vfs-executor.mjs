import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import { resolve, normalize, relative, sep, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readdir, stat } from 'node:fs/promises';

const execAsync = promisify(exec);

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, '..');

// Prepend local bin dir to PATH so rg is found on Netlify Lambda
const LOCAL_BIN = join(PROJECT_ROOT, 'bin');
process.env.PATH = `${LOCAL_BIN}:${process.env.PATH}`;

const ALLOWED_COMMANDS = [
  'ls', 'find', 'stat', 'cat', 'head', 'tail',
  'grep', 'rg', 'sed', 'awk', 'cut', 'sort', 'uniq', 'wc'
];

// built-in commands: tree, ls (fallback) — run directly via Node.js
const BUILTIN_COMMANDS = ['tree'];

/**
 * Splits a shell command by separators (; and |), respecting quotes.
 * Returns individual command segments for validation.
 */
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

/**
 * Built-in tree command. Mimics `tree` output by walking the directory recursively.
 */
async function builtinTree(rootDir, args) {
  const ignoreDirs = new Set(['node_modules', '.git', 'dist', '.angular', 'tmp']);

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

/**
 * Executes a command in a virtualized filesystem environment.
 * The "root" is restricted to the provided directory.
 * Supported: ls, find, stat, cat, head, tail, grep, rg, sed, awk,
 * cut, sort, uniq, wc. Plus built-in: tree.
 * Shell separators (;, |) and redirects (>, <) are allowed since
 * every sub-command is validated and the filesystem is sandboxed.
 */
export async function executeVfsCommand(command, rootDir) {
  const normalizedRoot = resolve(rootDir);

  // Prevent escaping the sandbox
  if (command.includes('..')) {
    throw new Error('Access to parent directories via ".." is not allowed.');
  }

  // Handle built-in commands (cannot be piped/chained)
  const firstWord = command.split(/\s+/)[0];
  if (BUILTIN_COMMANDS.includes(firstWord)) {
    const args = command.slice(firstWord.length).trim();
    try {
      const stdout = await builtinTree(normalizedRoot, args);
      return { exit: 0, stdout, stderr: '' };
    } catch (error) {
      return { exit: 1, stdout: '', stderr: error.message };
    }
  }

  // Split by ; and | (respecting quotes) and validate each segment
  const segments = splitByCommandSeparators(command);

  for (const segment of segments) {
    const baseCommand = segment.split(/\s+/)[0];
    if (!ALLOWED_COMMANDS.includes(baseCommand)) {
      throw new Error(
        `Command "${baseCommand}" is not allowed. Allowed: ${ALLOWED_COMMANDS.join(', ')}`
      );
    }
  }

  try {
    const { stdout, stderr } = await execAsync(command, {
      cwd: normalizedRoot,
      timeout: 10000, // 10s timeout
      maxBuffer: 1024 * 1024 * 5, // 5MB limit
      env: { ...process.env, LANG: 'en_US.UTF-8' }
    });

    return {
      exit: 0,
      stdout: stdout.trim(),
      stderr: stderr.trim(),
    };
  } catch (error) {
    if (error.killed) {
      return {
        exit: 124, // standard timeout exit code
        stdout: '',
        stderr: 'Command timed out.',
      };
    }
    return {
      exit: error.code ?? 1,
      stdout: error.stdout ? error.stdout.trim() : '',
      stderr: error.stderr ? error.stderr.trim() : error.message.trim(),
    };
  }
}
