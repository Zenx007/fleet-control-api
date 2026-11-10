import { CarUsageRepository } from '../../../application/ports/car-usage-repository.js';
import { Car } from '../../../domain/car.js';
import { CarUsage } from '../../../domain/car-usage.js';
import { Driver } from '../../../domain/driver.js';
import {
  CarNotFoundError,
  CarUnavailableError,
  CarUsageAlreadyFinishedError,
  DriverNotFoundError,
  DriverUnavailableError,
  InvalidUsagePeriodError,
} from '../../../domain/errors.js';
import { translateConstraintError } from './translate-constraint-error.js';

const START_ERRORS = {
  car_usages_car_id_fkey: CarNotFoundError,
  car_usages_driver_id_fkey: DriverNotFoundError,
  car_usages_car_no_overlap: CarUnavailableError,
  car_usages_driver_no_overlap: DriverUnavailableError,
};

const FINISH_ERRORS = { car_usages_valid_period: InvalidUsagePeriodError };

const selectFrom = (source) => `
  SELECT
    u.id,
    u.start_date,
    u.end_date,
    u.reason,
    d.id AS driver_id,
    d.name AS driver_name,
    c.id AS car_id,
    c.license_plate AS car_license_plate,
    c.color AS car_color,
    c.brand AS car_brand
  FROM ${source} u
  JOIN drivers d ON d.id = u.driver_id
  JOIN cars c ON c.id = u.car_id
`;

const toCarUsage = (row) =>
  new CarUsage({
    id: row.id,
    startDate: row.start_date,
    endDate: row.end_date,
    reason: row.reason,
    driver: new Driver({ id: row.driver_id, name: row.driver_name }),
    car: new Car({
      id: row.car_id,
      licensePlate: row.car_license_plate,
      color: row.car_color,
      brand: row.car_brand,
    }),
  });

export class PostgresCarUsageRepository extends CarUsageRepository {
  constructor(pool) {
    super();
    this.pool = pool;
  }

  async start({ driver, car, startDate, reason }) {
    try {
      const { rows } = await this.pool.query(
        `WITH record AS (
           INSERT INTO car_usages (driver_id, car_id, start_date, reason)
           VALUES ($1, $2, $3, $4)
           RETURNING *
         )
         ${selectFrom('record')}`,
        [driver.id, car.id, startDate, reason],
      );
      return toCarUsage(rows[0]);
    } catch (error) {
      throw translateConstraintError(error, START_ERRORS);
    }
  }

  async finish({ id, endDate }) {
    const row = await this.#setEndDateIfOpen(id, endDate);

    if (!row) {
      throw new CarUsageAlreadyFinishedError();
    }

    return toCarUsage(row);
  }

  async findById(id) {
    const { rows } = await this.pool.query(`${selectFrom('car_usages')} WHERE u.id = $1`, [id]);
    return rows[0] ? toCarUsage(rows[0]) : null;
  }

  async list() {
    const { rows } = await this.pool.query(
      `${selectFrom('car_usages')} ORDER BY u.start_date DESC, u.id DESC`,
    );
    return rows.map(toCarUsage);
  }

  async #setEndDateIfOpen(id, endDate) {
    try {
      const { rows } = await this.pool.query(
        `WITH record AS (
           UPDATE car_usages
           SET end_date = $2
           WHERE id = $1 AND end_date IS NULL
           RETURNING *
         )
         ${selectFrom('record')}`,
        [id, endDate],
      );
      return rows[0];
    } catch (error) {
      throw translateConstraintError(error, FINISH_ERRORS);
    }
  }
}
