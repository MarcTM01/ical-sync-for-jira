import { Version3Client } from 'jira.js';
import { Issue } from 'jira.js/out/version3/models';
import { Config } from 'jira.js/src/config';
import { Logger } from '@utils/logging';

export interface SimplifiedIssue {
  accessUrl: string;
  summary: string;
  key: string;
  dueDate: string | null;
}

export interface JiraServiceConfig {
  maxNumberOfApiRequestsPerSynchronization: number;
}

export class JiraService {
  private readonly log = Logger.getLogger('services/jira.ts');
  private readonly config: JiraServiceConfig;

  constructor(config: JiraServiceConfig) {
    this.config = config;
  }

  async pollJiraIssues(
    host: string,
    authentication: Config.Authentication,
    jql?: string,
  ): Promise<SimplifiedIssue[]> {
    this.log.debug(`Polling jira issues`, { host: host, jql: jql });
    const client = new Version3Client({
      host: host,
      authentication: authentication,
    });

    const retrievedIssues: SimplifiedIssue[] = [];
    let startIndex: number = 0;
    let requestCounter: number = 0;
    let currentlyRetrievedIssues: Issue[] = [];

    do {
      requestCounter++;
      if (
        requestCounter > this.config.maxNumberOfApiRequestsPerSynchronization
      ) {
        throw new Error(
          `Exceeded the maximum number of API requests per synchronization.`,
        );
      }

      const jiraIssueResponse =
        await client.issueSearch.searchForIssuesUsingJql({
          startAt: startIndex,
          maxResults: 1000,
          fields: ['summary', 'duedate'],
          jql: jql,
        });
      currentlyRetrievedIssues = jiraIssueResponse?.issues ?? [];

      for (const issue of currentlyRetrievedIssues) {
        retrievedIssues.push(this.mapIssueToSimplifiedIssue(host, issue));
      }

      startIndex += currentlyRetrievedIssues.length;
    } while (currentlyRetrievedIssues.length > 0);

    this.log.debug(`Retrieved jira issues`, {
      issueCount: retrievedIssues.length,
      requestCount: requestCounter,
    });
    return retrievedIssues;
  }

  private mapIssueToSimplifiedIssue(
    host: string,
    issue: Issue,
  ): SimplifiedIssue {
    return {
      summary: issue.fields.summary,
      key: issue.key,
      dueDate: issue.fields.duedate,
      accessUrl: `${host}/browse/${issue.key}`,
    };
  }
}
