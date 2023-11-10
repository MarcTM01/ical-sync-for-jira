import { createClient } from 'redis';
import { ApplicationConfig } from '@services/config';
import { Logger } from '@utils/logging';
import { JiraDeadlineCalendar } from '@services/jiraDeadlineCalendar';

const Log = Logger.getLogger('services/redis.ts');

export interface CalendarCacheResponse {
  calendar: JiraDeadlineCalendar;
  standardTtlExpired: boolean;
}

let redisClient: ReturnType<typeof createClient>;

export async function setupRedisClient() {
  Log.info('Connecting to redis database');
  redisClient = await createClient({
    url: ApplicationConfig.redis.url,
  })
    .on('error', (err) => Log.error('Redis client error', err))
    .connect();
}

export async function cacheJiraDeadlineCalendar(
  calendar: JiraDeadlineCalendar,
  standardTtlInSeconds: number,
  extendedTtlInSeconds: number,
) {
  Log.debug(`Caching calendar '${calendar.calendarId}' to redis`, {
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

function checkIfStandardTtlExpired(
  redisStandardExpiryTime: string | null,
): boolean {
  if (!redisStandardExpiryTime) return false;
  return Date.now() > parseInt(redisStandardExpiryTime);
}

export async function retrieveJiraDeadlineCalendar(
  calendarId: string,
): Promise<CalendarCacheResponse | null> {
  const redisResponse = await redisClient.hmGet(calendarId, [
    'standardExpiryTime',
    'creationTime',
    'calendarIcs',
  ]);

  if (!redisResponse[1] || !redisResponse[2]) {
    Log.debug(`Cache miss on calendar '${calendarId}'`);
    return null;
  }

  const standardTtlExpired = checkIfStandardTtlExpired(redisResponse[0]);
  if (standardTtlExpired) {
    Log.debug(`Expired cache hit on calendar '${calendarId}'`);
  } else {
    Log.debug(`Cache hit on calendar '${calendarId}'`);
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
