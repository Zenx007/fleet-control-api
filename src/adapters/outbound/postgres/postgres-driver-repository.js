import { DriverRepository } from '../../../application/ports/driver-repository.js';
import { Driver } from '../../../domain/driver.js';
import { DriverHasUsagesError } from '../../../domain/errors.js';
import { translateConstraintError } from './translate-constraint-error.js';

const DELETE_ERRORS = { car_usages_driver_id_fkey: DriverHasUsagesError };

const escapeLike = (value) => value.replace(/[\\%_]/g, '\\$&');

const toDriver = (row) => new Driver({ id: row.id, name: row.name });

export class PostgresDriverRepository extends DriverRepository {
  constructor(pool) {
    super();
    this.pool = pool;
  }

  async create({ name }) {
    const { rows } = await this.pool.query(
      'INSERT INTO drivers (name) VALUES ($1) RETURNING id, name',
      [name],
    );
    return toDriver(rows[0]);
  }

  async update({ id, name }) {
    const { rows } = await this.pool.query(
      'UPDATE drivers SET name = $2 WHERE id = $1 RETURNING id, name',
      [id, name],
    );
    return rows[0] ? toDriver(rows[0]) : null;
  }

  async delete(id) {
    try {
      const { rowCount } = await this.pool.query('DELETE FROM drivers WHERE id = $1', [id]);
      return rowCount > 0;
    } catch (error) {
      throw translateConstraintError(error, DELETE_ERRORS);
    }
  }

  async findById(id) {
    const { rows } = await this.pool.query('SELECT id, name FROM drivers WHERE id = $1', [id]);
    return rows[0] ? toDriver(rows[0]) : null;
  }

  async list({ name }) {
    const pattern = name === undefined ? null : `%${escapeLike(name)}%`;
    const { rows } = await this.pool.query(
      `SELECT id, name
       FROM drivers
       WHERE $1::text IS NULL OR name ILIKE $1
       ORDER BY name, id`,
      [pattern],
    );
    return rows.map(toDriver);
  }
}
