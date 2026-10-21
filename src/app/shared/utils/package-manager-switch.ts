import * as Prism from 'prismjs';
import {
  nextPackageManager,
  PACKAGE_MANAGERS,
  packageManagerLabel,
  packageManagerVariants,
} from './package-managers';

/**
 * An install command renders for npm, with a switch in its header bar. A click
 * shows the next package manager in every block of the page, and the choice is
 * kept for the next pages.
 */
const STORAGE_KEY = 'package-manager';

/** The npm text of each block, read before its first switch. */
const npmCode = new WeakMap<Element, string>();

function show(root: HTMLElement, pm: string) {
  root.querySelectorAll('.pm-switch').forEach((block) => {
    const code = block.querySelector('code');
    const button = block.querySelector('button');
    if (!npmCode.has(code)) {
      npmCode.set(code, code.textContent);
    }
    const variants = packageManagerVariants(npmCode.get(code));
    if (!variants) {
      return;
    }
    code.textContent = variants[PACKAGE_MANAGERS.indexOf(pm)];
    Prism.highlightElement(code);
    button.textContent = pm;
    button.setAttribute('aria-label', packageManagerLabel(pm));
  });
}

/** Shows the package manager picked on an earlier page or visit. */
export function restorePackageManager(root: HTMLElement) {
  if (!root.querySelector('.pm-switch')) {
    return;
  }
  // One announcement per click, however many blocks the page has
  const status = document.createElement('p');
  status.className = 'visually-hidden pm-status';
  status.setAttribute('role', 'status');
  root.append(status);

  let pm: string | null = null;
  try {
    pm = localStorage.getItem(STORAGE_KEY);
  } catch {
    // storage is blocked: npm stays
  }
  if (pm !== 'npm' && PACKAGE_MANAGERS.includes(pm)) {
    show(root, pm);
  }
}

/** A click on a switch, delegated from the page. */
export function switchPackageManager(root: HTMLElement, event: Event) {
  const button = (event.target as Element).closest('.pm-switch button');
  if (!button) {
    return;
  }
  const pm = nextPackageManager(button.textContent);
  show(root, pm);
  root.querySelector('.pm-status').textContent = `Showing ${pm} commands`;
  try {
    localStorage.setItem(STORAGE_KEY, pm);
  } catch {
    // storage is blocked: the choice lasts until the next page
  }
}
