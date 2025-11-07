import { cp } from 'fs/promises';
import { join } from 'path';

const src = join(process.cwd(), 'i18n', 'locales');
const dest = join(process.cwd(), 'public', 'i18n', 'locales');

async function copy() {
  try {
    await cp(src, dest, { recursive: true });
    console.log(`Copied locales from ${src} to ${dest}`);
    process.exit(0);
  } catch (err) {
    console.error('Failed to copy locales:', err);
    process.exit(2);
  }
}

copy();
