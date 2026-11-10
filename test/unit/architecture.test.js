import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

const SOURCE_DIRECTORY = fileURLToPath(new URL('../../src', import.meta.url));

async function importsOf(layer) {
  const directory = path.join(SOURCE_DIRECTORY, layer);
  const entries = await readdir(directory, { recursive: true, withFileTypes: true });
  const files = entries.filter((entry) => entry.isFile() && entry.name.endsWith('.js'));

  const imports = await Promise.all(
    files.map(async (file) => {
      const fullPath = path.join(file.parentPath, file.name);
      const source = await readFile(fullPath, 'utf8');
      return [...source.matchAll(/from '([^']+)'/g)].map(([, specifier]) => ({
        file: path.relative(SOURCE_DIRECTORY, fullPath),
        specifier,
        target: specifier.startsWith('.')
          ? path.relative(SOURCE_DIRECTORY, path.resolve(path.dirname(fullPath), specifier))
          : specifier,
      }));
    }),
  );

  return imports.flat();
}

const assertOnlyImports = (imports, isAllowed) => {
  const violations = imports.filter((item) => !isAllowed(item.target));
  assert.deepEqual(violations, []);
};

describe('hexagonal architecture', () => {
  it('keeps the domain independent of every other layer and library', async () => {
    assertOnlyImports(await importsOf('domain'), (target) => target.startsWith('domain/'));
  });

  it('keeps the application dependent only on itself and the domain', async () => {
    assertOnlyImports(
      await importsOf('application'),
      (target) => target.startsWith('domain/') || target.startsWith('application/'),
    );
  });

  it('keeps inbound adapters away from outbound adapters', async () => {
    const imports = await importsOf('adapters/inbound');

    assert.deepEqual(
      imports.filter((item) => item.target.startsWith('adapters/outbound/')),
      [],
    );
    assert.deepEqual(
      imports.filter((item) => item.specifier === 'pg'),
      [],
    );
  });
});
