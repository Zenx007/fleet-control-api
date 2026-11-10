import { CarRepository } from '../../../application/ports/car-repository.js';
import { Car } from '../../../domain/car.js';
import { CarHasUsagesError, DuplicateLicensePlateError } from '../../../domain/errors.js';
import { translateConstraintError } from './translate-constraint-error.js';

const COLUMNS = 'id, license_plate, color, brand';

const WRITE_ERRORS = { cars_license_plate_key: DuplicateLicensePlateError };
const DELETE_ERRORS = { car_usages_car_id_fkey: CarHasUsagesError };

const toCar = (row) =>
  new Car({
    id: row.id,
    licensePlate: row.license_plate,
    color: row.color,
    brand: row.brand,
  });

export class PostgresCarRepository extends CarRepository {
  constructor(pool) {
    super();
    this.pool = pool;
  }

  async create({ licensePlate, color, brand }) {
    try {
      const { rows } = await this.pool.query(
        `INSERT INTO cars (license_plate, color, brand) VALUES ($1, $2, $3) RETURNING ${COLUMNS}`,
        [licensePlate, color, brand],
      );
      return toCar(rows[0]);
    } catch (error) {
      throw translateConstraintError(error, WRITE_ERRORS);
    }
  }

  async update({ id, licensePlate, color, brand }) {
    try {
      const { rows } = await this.pool.query(
        `UPDATE cars SET license_plate = $2, color = $3, brand = $4 WHERE id = $1 RETURNING ${COLUMNS}`,
        [id, licensePlate, color, brand],
      );
      return rows[0] ? toCar(rows[0]) : null;
    } catch (error) {
      throw translateConstraintError(error, WRITE_ERRORS);
    }
  }

  async delete(id) {
    try {
      const { rowCount } = await this.pool.query('DELETE FROM cars WHERE id = $1', [id]);
      return rowCount > 0;
    } catch (error) {
      throw translateConstraintError(error, DELETE_ERRORS);
    }
  }

  async findById(id) {
    const { rows } = await this.pool.query(`SELECT ${COLUMNS} FROM cars WHERE id = $1`, [id]);
    return rows[0] ? toCar(rows[0]) : null;
  }

  async list({ color, brand }) {
    const { rows } = await this.pool.query(
      `SELECT ${COLUMNS}
       FROM cars
       WHERE ($1::text IS NULL OR lower(color) = lower($1))
         AND ($2::text IS NULL OR lower(brand) = lower($2))
       ORDER BY id`,
      [color, brand],
    );
    return rows.map(toCar);
  }
}
