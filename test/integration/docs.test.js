import assert from 'node:assert/strict';
import { after, describe, it } from 'node:test';
import { openapi } from '../../src/adapters/inbound/http/docs/openapi.js';
import { api, closeDatabase } from './helpers.js';

describe('documentation', () => {
  after(closeDatabase);

  it('redirects the root to the chooser page', async () => {
    const { headers } = await api.get('/').expect(302);

    assert.equal(headers.location, '/docs');
  });

  it('shows the page with both documentations and both themes', async () => {
    const { text } = await api.get('/docs').expect(200).expect('Content-Type', /html/);

    assert.match(text, /href="\/docs\/swagger\/"/);
    assert.match(text, /href="\/docs\/scalar"/);
    assert.match(text, /data-theme='dark'/);
    assert.match(text, /prefers-color-scheme: dark/);
  });

  it('exposes the OpenAPI specification', async () => {
    const { body } = await api.get('/openapi.json').expect(200);

    assert.equal(body.openapi, '3.1.0');
    assert.deepEqual(Object.keys(body.paths).sort(), [
      '/car-usages',
      '/car-usages/{id}/finish',
      '/cars',
      '/cars/{id}',
      '/drivers',
      '/drivers/{id}',
      '/health',
    ]);
  });

  it('only references schemas defined in the specification', () => {
    const references = JSON.stringify(openapi).match(/#\/components\/schemas\/\w+/g);

    for (const reference of new Set(references)) {
      assert.ok(openapi.components.schemas[reference.split('/').pop()], reference);
    }
  });

  it('serves Swagger UI and Scalar', async () => {
    const swagger = await api.get('/docs/swagger/').expect(200);
    const scalar = await api.get('/docs/scalar').expect(200);

    assert.match(swagger.text, /swagger-ui/);
    assert.match(scalar.text, /openapi\.json/);
  });
});
