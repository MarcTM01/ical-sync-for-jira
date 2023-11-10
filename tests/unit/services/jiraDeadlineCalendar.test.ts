import {
  JiraDeadlineCalendar,
  JiraDeadlineCalendarService,
} from '@services/jiraDeadlineCalendar';
import { JiraDeadlineCalendarCacheService } from '@services/jiraDeadlineCalendarCache';
import { JiraService } from '@services/jira';

jest.mock('@services/jiraDeadlineCalendarCache');
jest.mock('@services/jira');

describe('Unit tests for the Jira Deadline Calendar Service', () => {
  interface DeadlineCalendarTestEnvironment {
    jiraService: JiraService;
    cacheService: JiraDeadlineCalendarCacheService;
    calendarService: JiraDeadlineCalendarService;
  }

  function setupTestEnvironment(): DeadlineCalendarTestEnvironment {
    const MockedJiraService = JiraService as jest.Mock<JiraService>;

    const MockedDeadlineCalendarCacheService =
      JiraDeadlineCalendarCacheService as jest.Mock<JiraDeadlineCalendarCacheService>;

    MockedJiraService.mockClear();
    MockedDeadlineCalendarCacheService.mockClear();

    const mockedJiraService = new MockedJiraService();
    const mockedDeadlineCalendarCacheService =
      new MockedDeadlineCalendarCacheService();
    const service = new JiraDeadlineCalendarService(
      mockedJiraService,
      mockedDeadlineCalendarCacheService,
      [
        {
          id: calendarId,
          calendarName: 'calendar-name',
          accessTokens: [calendarAccessToken],
          jiraConfiguration: {
            host: 'localhost',
            authentication: {
              basic: {
                email: 'email',
                apiToken: 'apiToken',
              },
            },
          },
          standardTtlInSeconds: 10,
          extendedTtlInSeconds: 30,
        },
      ],
    );

    return {
      cacheService: mockedDeadlineCalendarCacheService,
      calendarService: service,
      jiraService: mockedJiraService,
    };
  }

  const calendarId = 'calendar-id';
  const calendarAccessToken = 'access-token';

  const sampleCalendar = new JiraDeadlineCalendar(
    calendarId,
    new Date(),
    'calendar-ics',
  );

  it('Should return a cached calendar entry when available', async () => {
    const testEnv = setupTestEnvironment();

    const spy = jest
      .spyOn(testEnv.cacheService, 'retrieveJiraDeadlineCalendar')
      .mockImplementation(() =>
        Promise.resolve({
          calendar: sampleCalendar,
          standardTtlExpired: false,
        }),
      );

    const response = await testEnv.calendarService.getJiraDeadlineCalendar(
      calendarId,
      calendarAccessToken,
    );
    expect(response).toEqual(sampleCalendar);
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('Should return a stale calendar cache entry when refreshing fails', async () => {
    const testEnv = setupTestEnvironment();

    const cacheSpy = jest
      .spyOn(testEnv.cacheService, 'retrieveJiraDeadlineCalendar')
      .mockImplementation(() =>
        Promise.resolve({
          calendar: sampleCalendar,
          standardTtlExpired: true,
        }),
      );

    const refreshSpy = jest
      .spyOn(testEnv.jiraService, 'pollJiraIssues')
      .mockImplementation(() => Promise.reject('ASD'));

    const response = await testEnv.calendarService.getJiraDeadlineCalendar(
      calendarId,
      calendarAccessToken,
    );
    expect(response).toEqual(sampleCalendar);
    expect(cacheSpy).toHaveBeenCalledTimes(1);
    expect(refreshSpy).toHaveBeenCalledTimes(1);
  });

  it('Should refresh the calendar on cache miss', async () => {
    const testEnv = setupTestEnvironment();

    const cacheSpy = jest
      .spyOn(testEnv.cacheService, 'retrieveJiraDeadlineCalendar')
      .mockImplementation(() => Promise.resolve(null));

    const refreshSpy = jest
      .spyOn(testEnv.jiraService, 'pollJiraIssues')
      .mockImplementation(() => Promise.resolve([]));

    const cacheStoreSpy = jest.spyOn(
      testEnv.cacheService,
      'cacheJiraDeadlineCalendar',
    );

    const response = await testEnv.calendarService.getJiraDeadlineCalendar(
      calendarId,
      calendarAccessToken,
    );

    expect(response.calendarId).toEqual(calendarId);
    expect(cacheSpy).toHaveBeenCalledTimes(1);
    expect(refreshSpy).toHaveBeenCalledTimes(1);
    expect(cacheStoreSpy).toHaveBeenCalledWith(response, 10, 30);
  });

  it('Should throw an error if an unknown calendar id is supplied', async () => {
    const testEnv = setupTestEnvironment();
    await expect(
      testEnv.calendarService.getJiraDeadlineCalendar('unknown', 'unknown'),
    ).rejects.toThrow('Unknown calendar');
  });

  it('Should throw an error if an unknown access token is supplied', async () => {
    const testEnv = setupTestEnvironment();
    await expect(
      testEnv.calendarService.getJiraDeadlineCalendar(calendarId, 'unknown'),
    ).rejects.toThrow('Unknown calendar');
  });
});
