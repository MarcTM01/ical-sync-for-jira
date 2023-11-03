import { Logger } from '@utils/logging';
import { exit } from 'process';
import packageJson from 'package.json';
import { createApp } from './api/express';
import { createServer } from 'http';
import { setupCalendarRoutes } from './api/calendarRoute';

const Log = Logger.getLogger('index.ts');

function launch() {
  Log.info(`Launching iCal sync for Jira v${packageJson.version}`);

  const app = createApp();
  setupCalendarRoutes(app);

  const port = process.env.PORT || 8080;
  app.set('port', port);

  const httpServer = createServer(app);
  httpServer.listen(port, () => {
    Log.info(`HTTP-Server live at http://127.0.0.1:${port}`);
  });
}

try {
  launch();
} catch (err) {
  Log.error('Critical error during application launch', err);
  exit(-1);
}
