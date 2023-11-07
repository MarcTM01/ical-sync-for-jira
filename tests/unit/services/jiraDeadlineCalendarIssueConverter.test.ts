import { SimplifiedIssue } from '@services/jira';
import { generateCalendarForJiraIssues } from '@services/jiraDeadlineCalendarIssueConverter';
import * as fs from 'fs';

describe('Unit tests for the jira issue to iCal converter', () => {
  it('Should convert issues to iCalendar entries', () => {
    const testIssues: SimplifiedIssue[] = [
      {
        accessUrl: 'https://example.com/issue-1',
        key: 'ISSUE-1',
        dueDate: '2024-01-01',
        summary: 'Implement unit tests',
      },
    ];

    const convertedIcal = generateCalendarForJiraIssues(
      'Test-Calendar',
      testIssues,
    )
      .toString()
      .replace(/\r\n/gm, '\n') // Normalize line endings
      .replace(/^DTSTAMP:.*$/gm, 'DTSTAMP:0'); // Replace DTSTAMP as it is set to the current time

    const expectedIcal = fs.readFileSync(
      'tests/unit/services/testIssueICalendar.ical',
      'utf-8',
    );
    expect(convertedIcal.toString()).toBe(expectedIcal);
  });
});
