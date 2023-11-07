import { Logger } from '@utils/logging';
import { exit } from 'process';
import packageJson from 'package.json';
import { createApp } from './api/express';
import { createServer } from 'http';
import { setupCalendarRoutes } from './api/calendarRoute';
import { ApplicationConfig } from '@services/config';

const Log = Logger.getLogger('index.ts');

function launch() {
  Log.info(`Launching iCal sync for Jira v${packageJson.version}`);

  const app = createApp();
  setupCalendarRoutes(app);

  app.set('port', ApplicationConfig.port);

  const httpServer = createServer(app);
  httpServer.listen(ApplicationConfig.port, () => {
    Log.info(`HTTP-Server live at http://127.0.0.1:${ApplicationConfig.port}`);
  });
}

try {
  launch();
} catch (err) {
  Log.error('Critical error during application launch', err);
  exit(-1);
}
