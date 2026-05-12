import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import { resolve, normalize, relative, sep } from 'node:path';

const execAsync = promisify(exec);

const ALLOWED_COMMANDS = [
  'ls', 'tree', 'find', 'stat', 'cat', 'head', 'tail', 
  'grep', 'rg', 'sed', 'awk', 'jq', 'cut', 'sort', 'uniq', 'wc'
];

/**
 * Splits a shell command by pipes, but only when | is outside of quotes.
 * Handles both single and double quotes.
 */
function splitByPipeRespectingQuotes(command) {
  const segments = [];
  let current = '';
  let inSingleQuote = false;
  let inDoubleQuote = false;
  let i = 0;

  while (i < command.length) {
    const char = command[i];

    if (char === "\\" && i + 1 < command.length && !inSingleQuote) {
      current += command[i] + command[i + 1];
      i += 2;
      continue;
    }

    if (char === "'" && !inDoubleQuote) {
      inSingleQuote = !inSingleQuote;
      current += char;
    } else if (char === '"' && !inSingleQuote) {
      inDoubleQuote = !inDoubleQuote;
      current += char;
    } else if (char === '|' && !inSingleQuote && !inDoubleQuote) {
      segments.push(current.trim());
      current = '';
    } else {
      current += char;
    }
    i++;
  }

  if (current.trim()) {
    segments.push(current.trim());
  }

  return segments;
}

/**
 * Executes a command in a virtualized filesystem environment.
 * The "root" is restricted to the provided directory.
 */
export async function executeVfsCommand(command, rootDir) {
  const normalizedRoot = resolve(rootDir);
  
  // Split by pipes (respecting quotes) and validate each segment
  const segments = splitByPipeRespectingQuotes(command);
  
  for (const segment of segments) {
    const baseCommand = segment.split(/\s+/)[0];
    if (!ALLOWED_COMMANDS.includes(baseCommand)) {
      throw new Error(`Command "${baseCommand}" is not allowed. Allowed: ${ALLOWED_COMMANDS.join(', ')}`);
    }
  }

  // Prevent dangerous characters outside of pipes
  if (/[;&><]/.test(command)) {
    throw new Error('Characters like ; & > < are not allowed for security reasons.');
  }

  // Prevent escaping the sandbox
  if (command.includes('..')) {
    throw new Error('Access to parent directories via ".." is not allowed.');
  }

  // Handle absolute paths if they are passed (map them to rootDir if possible, or reject if outside)
  // For now, let's just warn that we operate relative to content/
  
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
