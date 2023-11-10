import { Logger } from '@utils/logging';
import { exit } from 'process';
import packageJson from 'package.json';
import { createApp } from './api/express';
import { createServer } from 'http';
import { setupCalendarRoutes } from './api/calendarRoute';
import { ApplicationConfig } from '@services/config';
import { setupRedisClient } from '@services/jiraDeadlineCalendarCache';

const Log = Logger.getLogger('index.ts');

async function launch() {
  Log.info(`Launching iCal sync for Jira v${packageJson.version}`);

  await setupRedisClient();

  const app = createApp();
  setupCalendarRoutes(app);

  app.set('port', ApplicationConfig.port);

  const httpServer = createServer(app);
  httpServer.listen(ApplicationConfig.port, () => {
    Log.info(`HTTP-Server live at http://127.0.0.1:${ApplicationConfig.port}`);
  });
}

launch().catch((err) => {
  Log.error('Critical error during application launch', err);
  exit(-1);
});
