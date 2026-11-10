export const presentCar = ({ id, licensePlate, color, brand }) => ({
  id,
  licensePlate,
  color,
  brand,
});

export const presentDriver = ({ id, name }) => ({ id, name });

export const presentCarUsage = ({ id, startDate, endDate, reason, driver, car }) => ({
  id,
  startDate,
  endDate,
  reason,
  driver: presentDriver(driver),
  car: presentCar(car),
});
