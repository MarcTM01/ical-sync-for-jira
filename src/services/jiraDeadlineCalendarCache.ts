import { createClient } from 'redis';
import { Logger } from '@utils/logging';
import { JiraDeadlineCalendar } from '@services/jiraDeadlineCalendar';
export interface CalendarCacheResponse {
  calendar: JiraDeadlineCalendar;
  standardTtlExpired: boolean;
}

export interface RedisConfiguration {
  url: string;
}

export class JiraDeadlineCalendarCacheService {
  private redisClient: ReturnType<typeof createClient> | undefined;
  private readonly redisConfig: RedisConfiguration;
  private readonly log = Logger.getLogger('services/redis.ts');

  constructor(redisConfig: RedisConfiguration) {
    this.redisConfig = redisConfig;
  }

  private checkIfStandardTtlExpired(
    redisStandardExpiryTime: string | null,
  ): boolean {
    if (!redisStandardExpiryTime) return false;
    return Date.now() > parseInt(redisStandardExpiryTime);
  }

  private getRedisClient(): ReturnType<typeof createClient> {
    if (this.redisClient) {
      return this.redisClient;
    } else {
      throw new Error('Redis client uninitialized');
    }
  }

  async connect() {
    this.log.info('Connecting to redis database');
    this.redisClient = await createClient({
      url: this.redisConfig.url,
    })
      .on('error', (err) => this.log.error('Redis client error', err))
      .connect();
  }

  async cacheJiraDeadlineCalendar(
    calendar: JiraDeadlineCalendar,
    standardTtlInSeconds: number,
    extendedTtlInSeconds: number,
  ) {
    const redisClient = this.getRedisClient();
    this.log.debug(`Caching calendar to redis`, {
      calendarId: calendar.calendarId,
      standardTtlInSeconds: standardTtlInSeconds,
      extendedTtlInSeconds: extendedTtlInSeconds,
    });
    const epochCreationTime = calendar.creationTime.getTime();
    const standardExpiryTime =
      standardTtlInSeconds > 0
        ? epochCreationTime + 1000 * standardTtlInSeconds
        : -1;

    await redisClient.hSet(calendar.calendarId, {
      creationTime: epochCreationTime,
      standardExpiryTime: standardExpiryTime,
      calendarIcs: calendar.calendarIcs,
    });

    if (extendedTtlInSeconds > 0) {
      await redisClient.expire(calendar.calendarId, extendedTtlInSeconds);
    }
  }

  async retrieveJiraDeadlineCalendar(
    calendarId: string,
  ): Promise<CalendarCacheResponse | null> {
    const redisClient = this.getRedisClient();
    const redisResponse = await redisClient.hmGet(calendarId, [
      'standardExpiryTime',
      'creationTime',
      'calendarIcs',
    ]);

    if (!redisResponse[1] || !redisResponse[2]) {
      this.log.debug('Calendar cache miss', { calendarId: calendarId });
      return null;
    }

    const standardTtlExpired = this.checkIfStandardTtlExpired(redisResponse[0]);
    if (standardTtlExpired) {
      this.log.debug('Expired calendar cache hit', { calendarId: calendarId });
    } else {
      this.log.debug(`Cache hit on calendar`, { calendarId: calendarId });
    }

    return {
      standardTtlExpired: standardTtlExpired,
      calendar: {
        calendarId: calendarId,
        creationTime: new Date(redisResponse[1]),
        calendarIcs: redisResponse[2],
      },
    };
  }
}
