CREATE EXTENSION IF NOT EXISTS btree_gist;

CREATE TABLE cars (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  license_plate VARCHAR(7) NOT NULL,
  color VARCHAR(50) NOT NULL,
  brand VARCHAR(50) NOT NULL,
  CONSTRAINT cars_license_plate_key UNIQUE (license_plate)
);

CREATE INDEX cars_color_idx ON cars (lower(color));
CREATE INDEX cars_brand_idx ON cars (lower(brand));

CREATE TABLE drivers (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name VARCHAR(150) NOT NULL
);

CREATE TABLE car_usages (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ,
  driver_id INTEGER NOT NULL,
  car_id INTEGER NOT NULL,
  reason VARCHAR(500) NOT NULL,
  CONSTRAINT car_usages_driver_id_fkey FOREIGN KEY (driver_id) REFERENCES drivers (id) ON DELETE RESTRICT,
  CONSTRAINT car_usages_car_id_fkey FOREIGN KEY (car_id) REFERENCES cars (id) ON DELETE RESTRICT,
  CONSTRAINT car_usages_valid_period CHECK (end_date IS NULL OR end_date > start_date),
  CONSTRAINT car_usages_car_no_overlap EXCLUDE USING gist (
    car_id WITH =,
    tstzrange(start_date, end_date) WITH &&
  ),
  CONSTRAINT car_usages_driver_no_overlap EXCLUDE USING gist (
    driver_id WITH =,
    tstzrange(start_date, end_date) WITH &&
  )
);

CREATE INDEX car_usages_start_date_idx ON car_usages (start_date DESC, id DESC);
