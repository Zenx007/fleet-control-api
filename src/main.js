import { createApplication } from './composition-root.js';
import { formatAccessLinks } from './adapters/inbound/http/access-links.js';
import { env } from './config/env.js';

async function start() {
  const application = createApplication({ databaseUrl: env.DATABASE_URL });

  await application.migrate();

  const server = application.app.listen(env.PORT, () => {
    console.log(formatAccessLinks(env.APP_URL));
  });

  let shuttingDown = false;

  const shutdown = () => {
    if (shuttingDown) {
      return;
    }

    shuttingDown = true;
    server.close(async () => {
      await application.close();
      process.exit(0);
    });
    server.closeIdleConnections();
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

start().catch((error) => {
  console.error('Failed to start the application', error);
  process.exit(1);
});
