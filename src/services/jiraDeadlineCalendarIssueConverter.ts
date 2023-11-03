import { SimplifiedIssue } from './jira';
import ical, { ICalCalendar } from 'ical-generator';

export function generateCalendarForJiraIssues(
  calendarName: string,
  issues: SimplifiedIssue[],
): ICalCalendar {
  const cal = ical({
    name: calendarName,
    prodId: {
      company: 'MarcTM01',
      product: 'ical-sync-for-jira',
    },
  });

  issues.forEach((it) => {
    if (it.dueDate == null) return;
    cal.createEvent({
      id: `jira-${it.key}`,
      summary: `${it.key} ${it.summary} Deadline`,
      description: `For details visit: ${it.accessUrl}`,
      start: new Date(Date.parse(it.dueDate)),
      allDay: true,
    });
  });

  return cal;
}
