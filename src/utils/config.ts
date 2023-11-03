import { Config } from 'jira.js/src/config';

export interface SynchronizationConfiguration {
  id: string;
  calendarName: string;
  jiraConfiguration: {
    host: string;
    authentication: Config.Authentication;
    jql?: string;
  };
  accessTokens: string[];
}

export const ApplicationConfig = {
  jira: {
    maxNumberOfApiRequestsPerSynchronization: 50,
  },
  synchronizationConfig: <SynchronizationConfiguration[]>[],
};
