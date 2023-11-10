import {
  ApplicationConfig,
  SynchronizationConfiguration,
} from '@services/config';
import { ApiError } from '@utils/errors';
import { JiraService } from './jira';
import { generateCalendarForJiraIssues } from './jiraDeadlineCalendarIssueConverter';
import { JiraDeadlineCalendarCacheService } from '@services/jiraDeadlineCalendarCache';
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

export class JiraDeadlineCalendarService {
  private readonly jiraService: JiraService;
  private readonly jiraDeadlineCalendarCacheService: JiraDeadlineCalendarCacheService;

  constructor(
    jiraService: JiraService,
    jiraDeadlineCalendarCacheService: JiraDeadlineCalendarCacheService,
  ) {
    this.jiraService = jiraService;
    this.jiraDeadlineCalendarCacheService = jiraDeadlineCalendarCacheService;
  }

  private generateNotFoundError(): ApiError {
    return new ApiError(404, 'Unknown calendar');
  }

  private getCalendarConfigurationAndCheckAuthorization(
    calendarId: string,
    accessToken: string,
  ): SynchronizationConfiguration {
    const calendarConfig = ApplicationConfig.synchronizationConfig.find(
      (it) => it.id == calendarId,
    );

    if (!calendarConfig) {
      throw this.generateNotFoundError();
    }

    const authorized = calendarConfig.accessTokens.includes(accessToken);
    if (!authorized) {
      // Throw identical 404 to not leak valid calendar ids to attackers.
      throw this.generateNotFoundError();
    }

    return calendarConfig;
  }

  private async refreshCalendar(
    calendarConfig: SynchronizationConfiguration,
  ): Promise<JiraDeadlineCalendar> {
    const jiraIssues = await this.jiraService.pollJiraIssues(
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

    await this.jiraDeadlineCalendarCacheService.cacheJiraDeadlineCalendar(
      deadlineCalendar,
      calendarConfig.standardTtlInSeconds,
      calendarConfig.extendedTtlInSeconds,
    );

    return deadlineCalendar;
  }

  async getJiraDeadlineCalendar(
    calendarId: string,
    accessToken: string,
  ): Promise<JiraDeadlineCalendar> {
    const calendarConfig = this.getCalendarConfigurationAndCheckAuthorization(
      calendarId,
      accessToken,
    );

    const cachedCalendar =
      await this.jiraDeadlineCalendarCacheService.retrieveJiraDeadlineCalendar(
        calendarId,
      );

    if (cachedCalendar == null) {
      return this.refreshCalendar(calendarConfig);
    } else if (cachedCalendar.standardTtlExpired) {
      try {
        return this.refreshCalendar(calendarConfig);
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
}
