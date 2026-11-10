import { fileURLToPath } from 'node:url';
import { apiReference } from '@scalar/express-api-reference';
import { Router } from 'express';
import swaggerUi from 'swagger-ui-express';
import { openapi } from './openapi.js';

const CHOOSER_PAGE = fileURLToPath(new URL('./index.html', import.meta.url));
const TITLE = 'Fleet Control API';

export function createDocsRoutes() {
  const router = Router();

  router.get('/', (req, res) => res.redirect('/docs'));
  router.get('/docs', (req, res) => res.sendFile(CHOOSER_PAGE));
  router.get('/openapi.json', (req, res) => res.json(openapi));

  router.use(
    '/docs/swagger',
    swaggerUi.serve,
    swaggerUi.setup(openapi, {
      customSiteTitle: `${TITLE} - Swagger`,
      swaggerOptions: { docExpansion: 'list', tryItOutEnabled: true },
    }),
  );

  router.use(
    '/docs/scalar',
    apiReference({
      url: '/openapi.json',
      pageTitle: `${TITLE} - Scalar`,
      showDeveloperTools: 'never',
    }),
  );

  return router;
}
