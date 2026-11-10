const ref = (name) => ({ $ref: `#/components/schemas/${name}` });

const json = (schema, example) => ({
  'application/json': example === undefined ? { schema } : { schema, example },
});

const success = (description, schema) => ({
  description,
  content: json(schema),
});

const noContent = (description) => ({ description });

const failure = (description, message) => ({
  description,
  content: json(ref('Error'), { error: message }),
});

const validationFailure = {
  description: 'Invalid data.',
  content: json(ref('ValidationError'), {
    error: 'Invalid data.',
    details: [{ field: 'field', message: 'Required field.' }],
  }),
};

const body = (name, required = true) => ({
  required,
  content: json(ref(name)),
});

const idParameter = (description) => ({
  name: 'id',
  in: 'path',
  required: true,
  description,
  schema: { type: 'integer', minimum: 1, maximum: 2147483647 },
  example: 1,
});

const filterParameter = (name, description, example) => ({
  name,
  in: 'query',
  required: false,
  description,
  schema: { type: 'string' },
  example,
});

const idSchema = { type: 'integer', minimum: 1, maximum: 2147483647, example: 1 };

const inputDateTime = (description, example) => ({
  type: 'string',
  format: 'date-time',
  description,
  example,
});

const carNotFound = failure('Car not found.', 'Car not found.');
const driverNotFound = failure('Driver not found.', 'Driver not found.');
const duplicateLicensePlate = failure(
  'License plate already registered.',
  'A car with this license plate already exists.',
);

export const openapi = {
  openapi: '3.1.0',
  info: {
    title: 'Fleet Control API',
    version: '1.0.0',
    description:
      "API to control the use of a company's cars. A car can only be used by one driver at a time, and a driver can only use one car at a time.",
  },
  servers: [{ url: '/', description: 'Current server' }],
  tags: [
    { name: 'Cars', description: 'Car registry' },
    { name: 'Drivers', description: 'Driver registry' },
    { name: 'Car Usages', description: 'Car usage records' },
    { name: 'Health', description: 'Service availability' },
  ],
  paths: {
    '/cars': {
      post: {
        tags: ['Cars'],
        operationId: 'createCar',
        summary: 'Create a car',
        requestBody: body('CarInput'),
        responses: {
          201: success('Car created.', ref('Car')),
          400: validationFailure,
          409: duplicateLicensePlate,
        },
      },
      get: {
        tags: ['Cars'],
        operationId: 'listCars',
        summary: 'List cars',
        description: 'Filters match the exact value, ignoring case, and can be combined.',
        parameters: [
          filterParameter('color', 'Car color.', 'Black'),
          filterParameter('brand', 'Car brand.', 'Fiat'),
        ],
        responses: {
          200: success('List of cars.', { type: 'array', items: ref('Car') }),
          400: validationFailure,
        },
      },
    },
    '/cars/{id}': {
      parameters: [idParameter('Car identifier.')],
      get: {
        tags: ['Cars'],
        operationId: 'getCar',
        summary: 'Get a car',
        responses: {
          200: success('Car found.', ref('Car')),
          400: validationFailure,
          404: carNotFound,
        },
      },
      put: {
        tags: ['Cars'],
        operationId: 'updateCar',
        summary: 'Update a car',
        requestBody: body('CarInput'),
        responses: {
          200: success('Car updated.', ref('Car')),
          400: validationFailure,
          404: carNotFound,
          409: duplicateLicensePlate,
        },
      },
      delete: {
        tags: ['Cars'],
        operationId: 'deleteCar',
        summary: 'Delete a car',
        responses: {
          204: noContent('Car deleted.'),
          400: validationFailure,
          404: carNotFound,
          409: failure(
            'The car has usage history.',
            'The car has usage records and cannot be deleted.',
          ),
        },
      },
    },
    '/drivers': {
      post: {
        tags: ['Drivers'],
        operationId: 'createDriver',
        summary: 'Create a driver',
        requestBody: body('DriverInput'),
        responses: {
          201: success('Driver created.', ref('Driver')),
          400: validationFailure,
        },
      },
      get: {
        tags: ['Drivers'],
        operationId: 'listDrivers',
        summary: 'List drivers',
        description: 'The filter matches part of the name, ignoring case.',
        parameters: [filterParameter('name', 'Part of the driver name.', 'silva')],
        responses: {
          200: success('List of drivers.', { type: 'array', items: ref('Driver') }),
          400: validationFailure,
        },
      },
    },
    '/drivers/{id}': {
      parameters: [idParameter('Driver identifier.')],
      get: {
        tags: ['Drivers'],
        operationId: 'getDriver',
        summary: 'Get a driver',
        responses: {
          200: success('Driver found.', ref('Driver')),
          400: validationFailure,
          404: driverNotFound,
        },
      },
      put: {
        tags: ['Drivers'],
        operationId: 'updateDriver',
        summary: 'Update a driver',
        requestBody: body('DriverInput'),
        responses: {
          200: success('Driver updated.', ref('Driver')),
          400: validationFailure,
          404: driverNotFound,
        },
      },
      delete: {
        tags: ['Drivers'],
        operationId: 'deleteDriver',
        summary: 'Delete a driver',
        responses: {
          204: noContent('Driver deleted.'),
          400: validationFailure,
          404: driverNotFound,
          409: failure(
            'The driver has usage history.',
            'The driver has usage records and cannot be deleted.',
          ),
        },
      },
    },
    '/car-usages': {
      post: {
        tags: ['Car Usages'],
        operationId: 'startCarUsage',
        summary: 'Start using a car',
        requestBody: body('CarUsageInput'),
        responses: {
          201: success('Car usage started.', ref('CarUsage')),
          400: validationFailure,
          404: failure('Driver or car not found.', 'Car not found.'),
          409: failure(
            'Car or driver busy during the period.',
            'The car is already being used by a driver during this period.',
          ),
        },
      },
      get: {
        tags: ['Car Usages'],
        operationId: 'listCarUsages',
        summary: 'List car usages',
        description:
          'Returns the driver name and the car data, from the most recent usage to the oldest.',
        responses: {
          200: success('List of car usages.', { type: 'array', items: ref('CarUsage') }),
        },
      },
    },
    '/car-usages/{id}/finish': {
      parameters: [idParameter('Car usage identifier.')],
      patch: {
        tags: ['Car Usages'],
        operationId: 'finishCarUsage',
        summary: 'Finish a car usage',
        description: 'The body is optional. Without `endDate`, the current time is recorded.',
        requestBody: body('FinishCarUsageInput', false),
        responses: {
          200: success('Car usage finished.', ref('CarUsage')),
          400: validationFailure,
          404: failure('Car usage not found.', 'Car usage not found.'),
          409: failure('Car usage already finished.', 'This car usage has already been finished.'),
          422: failure('Invalid period.', 'The end date must be later than the start date.'),
        },
      },
    },
    '/health': {
      get: {
        tags: ['Health'],
        operationId: 'checkHealth',
        summary: 'Check the API and the database',
        responses: {
          200: {
            description: 'Service available.',
            content: json(ref('Health'), { status: 'ok' }),
          },
          503: {
            description: 'Database unavailable.',
            content: json(ref('Health'), { status: 'unavailable' }),
          },
        },
      },
    },
  },
  components: {
    schemas: {
      CarInput: {
        type: 'object',
        required: ['licensePlate', 'color', 'brand'],
        properties: {
          licensePlate: {
            type: 'string',
            description:
              'License plate in the old or Mercosul format. Stored in uppercase and without a hyphen.',
            example: 'ABC1D23',
          },
          color: { type: 'string', minLength: 1, maxLength: 50, example: 'Black' },
          brand: { type: 'string', minLength: 1, maxLength: 50, example: 'Fiat' },
        },
      },
      Car: {
        type: 'object',
        required: ['id', 'licensePlate', 'color', 'brand'],
        properties: {
          id: idSchema,
          licensePlate: { type: 'string', example: 'ABC1D23' },
          color: { type: 'string', example: 'Black' },
          brand: { type: 'string', example: 'Fiat' },
        },
      },
      DriverInput: {
        type: 'object',
        required: ['name'],
        properties: {
          name: { type: 'string', minLength: 1, maxLength: 150, example: 'Maria Silva' },
        },
      },
      Driver: {
        type: 'object',
        required: ['id', 'name'],
        properties: {
          id: idSchema,
          name: { type: 'string', example: 'Maria Silva' },
        },
      },
      CarUsageInput: {
        type: 'object',
        required: ['driverId', 'carId', 'startDate', 'reason'],
        properties: {
          driverId: idSchema,
          carId: idSchema,
          startDate: inputDateTime(
            'ISO 8601 date and time with a time zone.',
            '2026-01-10T08:00:00-03:00',
          ),
          reason: { type: 'string', minLength: 1, maxLength: 500, example: 'Customer visit' },
        },
      },
      FinishCarUsageInput: {
        type: 'object',
        properties: {
          endDate: inputDateTime(
            'ISO 8601 date and time with a time zone, later than the start date.',
            '2026-01-10T18:00:00-03:00',
          ),
        },
      },
      CarUsage: {
        type: 'object',
        required: ['id', 'startDate', 'endDate', 'reason', 'driver', 'car'],
        properties: {
          id: idSchema,
          startDate: { type: 'string', format: 'date-time', example: '2026-01-10T11:00:00.000Z' },
          endDate: {
            type: ['string', 'null'],
            format: 'date-time',
            description: 'Null while the car usage is in progress.',
            example: null,
          },
          reason: { type: 'string', example: 'Customer visit' },
          driver: ref('Driver'),
          car: ref('Car'),
        },
      },
      Error: {
        type: 'object',
        required: ['error'],
        properties: {
          error: { type: 'string' },
        },
      },
      ValidationError: {
        type: 'object',
        required: ['error', 'details'],
        properties: {
          error: { type: 'string', example: 'Invalid data.' },
          details: {
            type: 'array',
            items: {
              type: 'object',
              required: ['field', 'message'],
              properties: {
                field: { type: 'string', example: 'licensePlate' },
                message: { type: 'string', example: 'Required field.' },
              },
            },
          },
        },
      },
      Health: {
        type: 'object',
        required: ['status'],
        properties: {
          status: { type: 'string', enum: ['ok', 'unavailable'] },
        },
      },
    },
  },
};
