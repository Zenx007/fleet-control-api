import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createInMemoryUseCases } from './support/in-memory-adapters.js';

describe('CheckHealth', () => {
  it('reports a healthy service', async () => {
    assert.equal(await createInMemoryUseCases({ healthy: true }).checkHealth.execute(), true);
  });

  it('reports an unhealthy service', async () => {
    assert.equal(await createInMemoryUseCases({ healthy: false }).checkHealth.execute(), false);
  });
});
