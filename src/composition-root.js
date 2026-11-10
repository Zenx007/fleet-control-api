import { createApp } from './adapters/inbound/http/create-app.js';
import { createPool } from './adapters/outbound/postgres/connection.js';
import { runMigrations } from './adapters/outbound/postgres/migrator.js';
import { PostgresCarRepository } from './adapters/outbound/postgres/postgres-car-repository.js';
import { PostgresCarUsageRepository } from './adapters/outbound/postgres/postgres-car-usage-repository.js';
import { PostgresDriverRepository } from './adapters/outbound/postgres/postgres-driver-repository.js';
import { PostgresHealthIndicator } from './adapters/outbound/postgres/postgres-health-indicator.js';
import { SystemClock } from './adapters/outbound/system-clock.js';
import { createUseCases } from './application/create-use-cases.js';

export function createApplication({ databaseUrl }) {
  const pool = createPool(databaseUrl);

  const useCases = createUseCases({
    carRepository: new PostgresCarRepository(pool),
    driverRepository: new PostgresDriverRepository(pool),
    carUsageRepository: new PostgresCarUsageRepository(pool),
    healthIndicator: new PostgresHealthIndicator(pool),
    clock: new SystemClock(),
  });

  return {
    app: createApp(useCases),
    pool,
    migrate: () => runMigrations(pool),
    close: () => pool.end(),
  };
}
