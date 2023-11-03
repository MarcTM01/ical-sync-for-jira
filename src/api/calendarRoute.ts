import express from 'express';
import { ApiError } from '@utils/errors';
import { getJiraDeadlineCalendar } from '../services/jiraDeadlineCalendar';
import { asyncRequestHandler } from '@utils/api';

export function setupCalendarRoutes(app: express.Application) {
  app.get(
    '/calendars/:calendarId/ical',
    asyncRequestHandler(async (req, resp) => {
      const calendarId = req.params.calendarId;
      const accessToken = req.query.accessToken;

      if (typeof accessToken !== 'string') {
        throw new ApiError(
          400,
          'You must provide an accessToken query param to access calendars.',
        );
      }

      const calendar = await getJiraDeadlineCalendar(calendarId, accessToken);

      resp.statusCode = 200;
      resp.setHeader('Content-Type', 'text/calendar; charset=utf-8');
      resp.setHeader(
        'Content-Disposition',
        'attachment; filename="calendar.ics"',
      );
      resp.end(calendar.calendarIcs);
    }),
  );
}
