/**
 * Install commands in content/ are written for npm. The docs build gives a
 * bash or shell block that only installs or removes packages a package manager
 * switch, and the page rewrites the block for yarn, pnpm or bun (see
 * package-manager-switch.ts). A line the converter does not know leaves the
 * block as it is.
 */

/** npm first and shown by default, then the order `nest new` offers. */
export const PACKAGE_MANAGERS = ['npm', 'yarn', 'pnpm', 'bun'];

type Kind = 'add' | 'dev' | 'global' | 'remove';

const COMMANDS: Record<Kind, Record<string, string>> = {
  add: { yarn: 'yarn add', pnpm: 'pnpm add', bun: 'bun add' },
  dev: { yarn: 'yarn add -D', pnpm: 'pnpm add -D', bun: 'bun add -D' },
  global: { yarn: 'yarn global add', pnpm: 'pnpm add -g', bun: 'bun add -g' },
  remove: { yarn: 'yarn remove', pnpm: 'pnpm remove', bun: 'bun remove' },
};

// `--save` has been npm's default since npm 5, and pnpm 12 rejects it
const FLAGS: Record<string, Kind> = {
  '--save': 'add',
  '--save-dev': 'dev',
  '-D': 'dev',
  '-g': 'global',
};

/** `$ npm ...`, or a commented-out `# npm ...` */
const NPM_LINE = /^([$#] )npm (.*)$/;
const OTHER_LINE = /^(\$ |# |$)/;
const MENTIONS_NPM = /(^|\s)np[mx](\s|$)/;
const PACKAGE = /^[\w@./~^:-]+$/;

/** What `npm <args>` installs or removes, or null for anything else. */
function parseNpm([command, ...args]: string[]) {
  const flags = args.filter((arg) => arg[0] === '-');
  const packages = args.filter((arg) => arg[0] !== '-');
  if (!packages.length || !packages.every((name) => PACKAGE.test(name))) {
    return null;
  }
  if (command === 'uninstall') {
    return flags.length ? null : { kind: 'remove' as Kind, packages };
  }
  const kinds = flags.map((flag) => FLAGS[flag]);
  const changes = kinds.filter((kind) => kind !== 'add');
  if (
    (command !== 'i' && command !== 'install') ||
    kinds.some((kind) => !kind) ||
    changes.length > 1
  ) {
    return null;
  }
  return { kind: changes[0] || ('add' as Kind), packages };
}

/**
 * The block's text for each of PACKAGE_MANAGERS, or null unless every line is
 * an npm install command, another `$ ` command, a `# ` comment or empty.
 */
export function packageManagerVariants(code: string): string[] | null {
  const others = PACKAGE_MANAGERS.slice(1);
  const variants: string[][] = others.map(() => []);
  let commands = 0;
  for (const line of code.split('\n')) {
    const match = NPM_LINE.exec(line);
    const npm = match && parseNpm(match[2].split(' '));
    if (npm) {
      commands += match[1] === '$ ' ? 1 : 0;
      others.forEach((pm, i) => {
        const command = [COMMANDS[npm.kind][pm], ...npm.packages].join(' ');
        variants[i].push(match[1] + command);
      });
    } else if (OTHER_LINE.test(line) && !MENTIONS_NPM.test(line)) {
      variants.forEach((lines) => lines.push(line));
    } else {
      return null;
    }
  }
  return commands ? [code, ...variants.map((lines) => lines.join('\n'))] : null;
}

/** The package manager the switch shows after `pm`, back to npm after bun. */
export function nextPackageManager(pm: string) {
  const index = PACKAGE_MANAGERS.indexOf(pm) + 1;
  return PACKAGE_MANAGERS[index % PACKAGE_MANAGERS.length];
}

/** The accessible name of the switch while it shows `pm`. */
export function packageManagerLabel(pm: string) {
  return `Package manager: ${pm}, switch to ${nextPackageManager(pm)}`;
}
