import { HealthIndicator } from '../../../application/ports/health-indicator.js';

export class PostgresHealthIndicator extends HealthIndicator {
  constructor(pool) {
    super();
    this.pool = pool;
  }

  async isHealthy() {
    try {
      await this.pool.query('SELECT 1');
      return true;
    } catch {
      return false;
    }
  }
}
