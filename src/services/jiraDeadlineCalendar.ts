import {
  ApplicationConfig,
  SynchronizationConfiguration,
} from '@services/config';
import { ApiError } from '@utils/errors';
import { pollJiraIssues } from './jira';
import { generateCalendarForJiraIssues } from './jiraDeadlineCalendarIssueConverter';
import {
  cacheJiraDeadlineCalendar,
  retrieveJiraDeadlineCalendar,
} from '@services/jiraDeadlineCalendarCache';
import { Logger } from '@utils/logging';

const Log = Logger.getLogger('services/jiraDeadlineCalendar.ts');

export class JiraDeadlineCalendar {
  readonly calendarId: string;
  readonly creationTime: Date;
  readonly calendarIcs: string;

  constructor(calendarId: string, creationTime: Date, calendarIcs: string) {
    this.calendarId = calendarId;
    this.creationTime = creationTime;
    this.calendarIcs = calendarIcs;
  }
}

function generateNotFoundError(): ApiError {
  return new ApiError(404, 'Unknown calendar');
}

function getCalendarConfigurationAndCheckAuthorization(
  calendarId: string,
  accessToken: string,
): SynchronizationConfiguration {
  const calendarConfig = ApplicationConfig.synchronizationConfig.find(
    (it) => it.id == calendarId,
  );

  if (!calendarConfig) {
    throw generateNotFoundError();
  }

  const authorized = calendarConfig.accessTokens.includes(accessToken);
  if (!authorized) {
    // Throw identical 404 to not leak valid calendar ids to attackers.
    throw generateNotFoundError();
  }

  return calendarConfig;
}

async function refreshCalendar(
  calendarConfig: SynchronizationConfiguration,
): Promise<JiraDeadlineCalendar> {
  const jiraIssues = await pollJiraIssues(
    calendarConfig.jiraConfiguration.host,
    calendarConfig.jiraConfiguration.authentication,
    calendarConfig.jiraConfiguration.jql,
  );

  const convertedCalendar = generateCalendarForJiraIssues(
    calendarConfig.calendarName,
    jiraIssues,
  );
  const deadlineCalendar = new JiraDeadlineCalendar(
    calendarConfig.id,
    new Date(),
    convertedCalendar.toString(),
  );

  await cacheJiraDeadlineCalendar(
    deadlineCalendar,
    calendarConfig.standardTtlInSeconds,
    calendarConfig.extendedTtlInSeconds,
  );

  return deadlineCalendar;
}

export async function getJiraDeadlineCalendar(
  calendarId: string,
  accessToken: string,
): Promise<JiraDeadlineCalendar> {
  const calendarConfig = getCalendarConfigurationAndCheckAuthorization(
    calendarId,
    accessToken,
  );

  const cachedCalendar = await retrieveJiraDeadlineCalendar(calendarId);

  if (cachedCalendar == null) {
    return refreshCalendar(calendarConfig);
  } else if (cachedCalendar.standardTtlExpired) {
    try {
      return refreshCalendar(calendarConfig);
    } catch (e) {
      Log.error(`Error while refreshing calendar. Serving stale cache.`, e, {
        calendarId: calendarId,
      });
      return cachedCalendar.calendar;
    }
  } else {
    return cachedCalendar.calendar;
  }
}
