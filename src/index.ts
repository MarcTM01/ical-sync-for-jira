import { Logger } from '@utils/logging';
import { exit } from 'process';
import packageJson from 'package.json';
import { createApp } from './api/express';
import { createServer } from 'http';
import { CalendarRouteController } from './api/calendarRoute';
import { getConfigurationFromEnv } from '@services/config';
import { JiraDeadlineCalendarCacheService } from '@services/jiraDeadlineCalendarCache';
import { JiraService } from '@services/jira';
import { JiraDeadlineCalendarService } from '@services/jiraDeadlineCalendar';

const Log = Logger.getLogger('index.ts');

async function launch() {
  Log.info(`Launching iCal sync for Jira v${packageJson.version}`);
  const ApplicationConfig = getConfigurationFromEnv(process.env);

  const jiraDeadlineCalendarCacheService = new JiraDeadlineCalendarCacheService(
    ApplicationConfig.redis,
  );
  await jiraDeadlineCalendarCacheService.connect();

  const jiraService = new JiraService(ApplicationConfig.jira);
  const jiraDeadlineCalendarService = new JiraDeadlineCalendarService(
    jiraService,
    jiraDeadlineCalendarCacheService,
    ApplicationConfig.synchronizationConfig,
  );

  const app = createApp();

  const calendarController = new CalendarRouteController(
    jiraDeadlineCalendarService,
  );
  calendarController.setupCalendarRoutes(app);

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
