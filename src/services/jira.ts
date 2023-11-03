import { Version3Client } from 'jira.js';
import { Issue } from 'jira.js/out/version3/models';
import { ApplicationConfig } from '@utils/config';
import { Config } from 'jira.js/src/config';
import { Logger } from '@utils/logging';

const Log = Logger.getLogger('services/jira.ts');

export interface SimplifiedIssue {
  accessUrl: string;
  summary: string;
  key: string;
  dueDate: string | null;
}

export async function pollJiraIssues(
  host: string,
  authentication: Config.Authentication,
  jql?: string,
): Promise<SimplifiedIssue[]> {
  Log.debug(`Polling jira issues from host ${host} with jql ${jql}`);
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
      requestCounter >
      ApplicationConfig.jira.maxNumberOfApiRequestsPerSynchronization
    ) {
      throw new Error(
        `Exceeded the maximum number of API requests per synchronization.`,
      );
    }

    const jiraIssueResponse = await client.issueSearch.searchForIssuesUsingJql({
      startAt: startIndex,
      maxResults: 1000,
      fields: ['summary', 'duedate'],
      jql: jql,
    });
    currentlyRetrievedIssues = jiraIssueResponse?.issues ?? [];

    for (const issue of currentlyRetrievedIssues) {
      retrievedIssues.push(mapIssueToSimplifiedIssue(host, issue));
    }

    startIndex += currentlyRetrievedIssues.length;
  } while (currentlyRetrievedIssues.length > 0);

  Log.debug(
    `Retrieved ${retrievedIssues.length} jira issues using ${requestCounter} API calls`,
  );
  return retrievedIssues;
}

function mapIssueToSimplifiedIssue(
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
