const LINKS = [
  ['Documentation', '/docs'],
  ['Swagger UI', '/docs/swagger/'],
  ['Scalar', '/docs/scalar'],
  ['OpenAPI', '/openapi.json'],
  ['Health check', '/health'],
  ['API', ''],
];

export function formatAccessLinks(appUrl) {
  const width = Math.max(...LINKS.map(([label]) => label.length)) + 2;
  const lines = LINKS.map(([label, path]) => `  ${`${label}:`.padEnd(width)}${appUrl}${path}`);

  return ['', 'Fleet Control API is running', '', ...lines, ''].join('\n');
}
