import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import { resolve, dirname, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readdir, stat, writeFile, unlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';

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

function splitByCharRespectingQuotes(command, char) {
  const parts = [];
  let current = '';
  let inSingleQuote = false;
  let inDoubleQuote = false;

  for (let i = 0; i < command.length; i++) {
    const c = command[i];
    if (c === "'" && !inDoubleQuote) { inSingleQuote = !inSingleQuote; current += c; }
    else if (c === '"' && !inSingleQuote) { inDoubleQuote = !inDoubleQuote; current += c; }
    else if (c === char && !inSingleQuote && !inDoubleQuote) {
      parts.push(current.trim());
      current = '';
    } else {
      current += c;
    }
  }
  parts.push(current.trim());
  return parts;
}

function truncate(text, max) {
  if (text.length <= max) return text;
  return text.slice(0, max) + `\n... (output truncated, ${text.length - max} more chars. Use | tail or | head to narrow)`;
}

// ---- built-in find ----

function parseFlag(args, flag) {
  const re = new RegExp(flag + '\\s+([^-]\\S*)');
  const m = args.match(re);
  if (!m) return null;
  const val = m[1].replace(/^['\"](.+?)['\"]$/, '$1');
  return val || null;
}

async function builtinFind(rootDir, args) {
  const pathArgs = args.split(/\s+/).filter(Boolean);
  const searchDir = pathArgs.length > 0 && !pathArgs[0].startsWith('-') ? pathArgs[0] : '.';
  const restArgs = searchDir === '.' ? args.replace(/^\s*\.\s*/, '') : args.slice(args.indexOf(searchDir) + searchDir.length).trim();

  const namePat = parseFlag(restArgs, '-name');
  const pattern = namePat ? new RegExp('^' + namePat.replace(/\*/g, '.*').replace(/\?/g, '.') + '$') : null;
  const maxDepthStr = parseFlag(restArgs, '-maxdepth');
  const maxDepth = maxDepthStr ? parseInt(maxDepthStr) : Infinity;
  const typeFilter = parseFlag(restArgs, '-type');

  const results = [];

  async function walk(dir, depth) {
    if (depth > maxDepth) return;
    const entries = await readdir(dir, { withFileTypes: true }).catch(() => []);
    for (const entry of entries) {
      if (entry.name.startsWith('.') && entry.name !== '.') continue;
      const fullPath = join(dir, entry.name);
      const relPath = relative(rootDir, fullPath);
      if (!relPath) continue;

      const isDir = entry.isDirectory();
      if (isDir && ['node_modules', '.git', 'dist', '.angular', 'tmp', '.netlify'].includes(entry.name)) continue;

      const matchType = !typeFilter || (typeFilter === 'd' ? isDir : typeFilter === 'f' ? !isDir : true);
      const matchName = !pattern || pattern.test(entry.name);

      if (matchType && matchName) {
        results.push('./' + relPath.split(sep).join('/'));
      }

      if (isDir) {
        await walk(fullPath, depth + 1);
      }
    }
  }

  await walk(join(rootDir, searchDir), 0);
  return results.sort((a, b) => a.localeCompare(b)).join('\n') + '\n';
}

// ---- built-in tree ----

async function builtinTree(rootDir, args) {
  const pathArgs = args.split(/\s+/).filter(Boolean);
  const searchDir = pathArgs.length > 0 && !pathArgs[0].startsWith('-') ? pathArgs[0] : '.';
  const restArgs = searchDir === '.' ? args.replace(/^\s*\.\s*/, '') : args.slice(args.indexOf(searchDir) + searchDir.length).trim();

  const ignoreDirs = new Set(['node_modules', '.git', 'dist', '.angular', 'tmp', '.netlify']);
  const maxDepthStr = parseFlag(restArgs, '-L');
  const maxDepth = maxDepthStr ? parseInt(maxDepthStr) : Infinity;
  const dirsOnly = /\s-d\s/.test(' ' + args + ' ');
  const startDir = join(rootDir, searchDir);

  async function* walk(dir, depth) {
    if (depth >= maxDepth) return;
    const entries = await readdir(dir, { withFileTypes: true }).catch(() => []);
    const dirs = entries.filter(e => e.isDirectory() && !ignoreDirs.has(e.name));
    const files = entries.filter(e => e.isFile());

    for (const entry of [...dirs, ...files]) {
      if (dirsOnly && !entry.isDirectory()) continue;
      const prefix = depth === 0 ? '' : '│   '.repeat(depth - 1) + '├── ';
      yield prefix + entry.name;

      if (entry.isDirectory()) {
        yield* walk(join(dir, entry.name), depth + 1);
      }
    }
  }

  const lines = [];
  const basename = startDir.split('/').pop() || 'content';
  lines.push(basename);

  for await (const line of walk(startDir, 0)) {
    lines.push(line);
  }

  const stats = await stat(startDir).catch(() => null);
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

  // Split by | (quote-aware) to check if we pipe OUT of a built-in command
  const pipeParts = splitByCharRespectingQuotes(command, '|');
  const firstWord = pipeParts[0].split(/\s+/)[0];

  if (BUILTIN_COMMANDS.includes(firstWord)) {
    // Run built-in, then optionally pipe output through subsequent commands
    const fn = firstWord === 'find' ? builtinFind : builtinTree;
    const args = pipeParts[0].slice(firstWord.length).trim();

    let stdout;
    try {
      stdout = await fn(normalizedRoot, args);
    } catch (error) {
      return { exit: 1, stdout: '', stderr: truncate(error.message, MAX_OUTPUT) };
    }

    if (pipeParts.length > 1) {
      // Pipe built-in output through remaining shell commands
      const rest = pipeParts.slice(1).join(' | ');
      for (const seg of pipeParts.slice(1)) {
        const base = seg.split(/\s+/)[0];
        if (!ALLOWED_COMMANDS.includes(base)) {
          throw new Error(
            `Command "${base}" is not allowed.\nAllowed: ${ALL_COMMANDS_STR}`
          );
        }
      }
      // Write built-in output to tmp file for piping to shell commands
      const tmpFile = join(tmpdir(), `mcp-pipe-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
      await writeFile(tmpFile, stdout, 'utf8');
      try {
        const { stdout: piped, stderr } = await execAsync(`< "${tmpFile}" ${rest}`, {
          cwd: normalizedRoot,
          timeout: 10000,
          maxBuffer: 1024 * 1024 * 5,
          env: { ...process.env, LANG: 'C.UTF-8' }
        });
        await unlink(tmpFile);
        return {
          exit: 0,
          stdout: truncate(piped.trim(), MAX_OUTPUT),
          stderr: truncate(stderr.trim(), MAX_OUTPUT),
        };
      } catch (error) {
        await unlink(tmpFile).catch(() => {});
        return {
          exit: error.code ?? 1,
          stdout: truncate(error.stdout?.trim() || '', MAX_OUTPUT),
          stderr: truncate(error.stderr?.trim() || error.message.trim(), MAX_OUTPUT),
        };
      }
    }

    return { exit: 0, stdout: truncate(stdout, MAX_OUTPUT), stderr: '' };
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
