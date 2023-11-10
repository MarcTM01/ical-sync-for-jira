import validator from 'validator';
import { getConfigurationValueFromEnv, SystemEnvs } from '@utils/config';
import { JiraServiceConfig } from '@services/jira';
import { SynchronizationConfiguration } from '@services/jiraDeadlineCalendar';
import { RedisConfiguration } from '@services/jiraDeadlineCalendarCache';

interface ApplicationConfig {
  port: number;
  jira: JiraServiceConfig;
  synchronizationConfig: SynchronizationConfiguration[];
  redis: RedisConfiguration;
}

export function getConfigurationFromEnv(env: SystemEnvs): ApplicationConfig {
  return {
    port: getConfigurationValueFromEnv(env, {
      name: 'PORT',
      stringValidator: validator.isPort,
      converter: parseInt,
      isRequired: false,
      defaultValue: 8080,
    }),
    jira: {
      maxNumberOfApiRequestsPerSynchronization: getConfigurationValueFromEnv(
        env,
        {
          name: 'MAX_NUMBER_OF_API_REQUESTS_PER_SYNCHRONIZATION',
          stringValidator: validator.isInt,
          converter: parseInt,
          isRequired: false,
          defaultValue: 50,
        },
      ),
    },
    redis: {
      url: getConfigurationValueFromEnv(env, {
        name: 'REDIS_URL',
        isRequired: true,
      }),
    },
    synchronizationConfig: getSynchronizationConfigsFromEnv(env),
  };
}

function getSynchronizationConfigsFromEnv(
  env: SystemEnvs,
): SynchronizationConfiguration[] {
  const numberOfSynchronizationConfigs = getConfigurationValueFromEnv(env, {
    name: 'NUMBER_OF_SYNCHRONIZATION_CONFIGS',
    stringValidator: validator.isInt,
    converter: parseInt,
    isRequired: true,
  });
  const synchronizationConfigs = [];

  for (let i = 0; i < numberOfSynchronizationConfigs; i++) {
    synchronizationConfigs.push(
      getSynchronizationConfigFromEnv(env, `CONFIG_${i}`),
    );
  }

  return synchronizationConfigs;
}

function getSynchronizationConfigFromEnv(
  env: SystemEnvs,
  prefix: string,
): SynchronizationConfiguration {
  return {
    id: getConfigurationValueFromEnv<string>(env, {
      name: `${prefix}_ID`,
      isRequired: true,
    }),
    calendarName: getConfigurationValueFromEnv<string>(env, {
      name: `${prefix}_CALENDAR_NAME`,
      isRequired: true,
    }),
    accessTokens: getConfigurationValueFromEnv(env, {
      name: `${prefix}_ACCESS_TOKENS`,
      isRequired: true,
      converter: (envString) => envString.split(','),
      convertedValidator: (key) => key.every((key) => key.length > 0),
    }),
    jiraConfiguration: {
      host: getConfigurationValueFromEnv<string>(env, {
        name: `${prefix}_JIRA_HOST`,
        stringValidator: validator.isURL,
        isRequired: true,
      }),
      jql: getConfigurationValueFromEnv<string | undefined>(env, {
        name: `${prefix}_JQL`,
        isRequired: false,
        defaultValue: 'due is not empty',
      }),
      authentication: {
        basic: {
          email: getConfigurationValueFromEnv<string>(env, {
            name: `${prefix}_EMAIL`,
            isRequired: true,
          }),
          apiToken: getConfigurationValueFromEnv<string>(env, {
            name: `${prefix}_API_TOKEN`,
            isRequired: true,
          }),
        },
      },
    },
    standardTtlInSeconds: getConfigurationValueFromEnv(env, {
      name: `${prefix}_STANDARD_TTL_IN_SECONDS`,
      stringValidator: validator.isInt,
      converter: parseInt,
      isRequired: false,
      defaultValue: 300,
    }),
    extendedTtlInSeconds: getConfigurationValueFromEnv(env, {
      name: `${prefix}_EXTENDED_TTL_IN_SECONDS`,
      stringValidator: validator.isInt,
      converter: parseInt,
      isRequired: false,
      defaultValue: 3600,
    }),
  };
}
