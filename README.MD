# iCalendar sync for Jira
Ical Sync for Jira scans Jira issues for deadlines and assembles them into an iCalendar file,
which you can subscribe to from your favorite calendar software to stay on top of deadlines.

This software creates an iCalendar file from the deadlines of your Jira Issues.
A full-day event is created for every issue with a deadline.

**This software is in no way affiliated with Jira or Atlassian.**

## Quick-Start
To use iCalendar sync for Jira with Jira Cloud, you need the hostname of your instance 
(e.g., `https://<NAME>.atlassian.net`), the email address of your Atlassian ID,
and an API token (see https://support.atlassian.com/atlassian-account/docs/manage-api-tokens-for-your-atlassian-account/).

Once acquired, feel free to use the following docker-compose template to get started:
Set `CALENDAR_ACCESS_TOKEN` to a strong password. Anyone with access to this value can read the 
contents of the calendar.

```yml
---
version: '3.8'
services:
  ical-sync-for-jira:
    image: ghcr.io/marctm01/ical-sync-for-jira
    environment:
      NUMBER_OF_SYNCHRONIZATION_CONFIGS: 1
      REDIS_URL: "redis://jira-redis"
      CONFIG_0_ID: "my-calendar"
      CONFIG_0_CALENDAR_NAME: "My Calendar"
      CONFIG_0_ACCESS_TOKENS: ${CALENDAR_ACCESS_TOKEN}
      CONFIG_0_JIRA_HOST: ${JIRA_HOST}
      CONFIG_0_EMAIL: ${JIRA_EMAIL}
      CONFIG_0_API_TOKEN: ${JIRA_API_TOKEN}
    ports:
      - "127.0.0.1:8080:8080"

  jira-redis:
    image: redis:alpine
```

After everything has started, you may access the iCalendar file at 
http://127.0.0.1:8080/calendars/my-calendar/ical?accessToken=${CALENDAR_ACCESS_TOKEN}.
I strongly recommend running this software behind a TLS-terminating reverse proxy for any deployment 
(especially when facing the internet).

## Maintenance
This software is a personal project of mine I developed for myself. Feel free to use it if you find it useful!

This repository is configured for automated dependency updates. That should cover most of the maintenance required for this project.
Nevertheless, be mindful that I won't commit to actively supporting this project.

## Configuration
This software is fully configured by environment variables.

#### `PORT`

The port for the Express.js web server. Defaults to `8080` when not specified.

#### `MAX_NUMBER_OF_API_REQUESTS_PER_SYNCHRONIZATION`

Determines how many API requests against Jira are permitted per calendar refresh. Defaults to `50`.

#### `REDIS_URL`
Example: `redis://jira-redis`.
The URI to a redis instance. This software uses redis for caching retrieved calendars to reduce load on the Jira API.

#### - `NUMBER_OF_SYNCHRONIZATION_CONFIGS`
Example: `1`. How many different iCalendar files do you want to serve?

#### - `CONFIG_X_ID`
Example: `my-calendar`. A unique identifier for a calendar. 
The calendar will be available at: http://127.0.0.1:8080/calendars/{ID}/ical?accessToken={TOKEN}.

#### - `CONFIG_X_CALENDAR_NAME`
Example: `My Calendar`. A name for the iCal calendar.

#### - `CONFIG_X_ACCESS_TOKENS`
Example: `test-token`. A comma-separated list of valid access tokens.
Anyone with an access token can retrieve the calendar.

#### - `CONFIG_X_JIRA_HOST`
Example: `https://<NAME>.atlassian.net`. The base-URL of the Jira instance (without trailing `/`).

#### - `CONFIG_X_EMAIL`
Example: `test@example.com`. The E-Mail address of the authenticating user.

#### - `CONFIG_X_API_TOKEN`
A valid API token for the account 
(see https://support.atlassian.com/atlassian-account/docs/manage-api-tokens-for-your-atlassian-account/).

#### - `CONFIG_X_JQL`
Example: `due is not empty`. A JQL expression for filtering the issues that are to be displayed in this calendar.
Defaults to `due is not empty`.

#### - `CONFIG_X_STANDARD_TTL_IN_SECONDS`
Example: `300`. The duration for which a retrieved calendar will be cached in seconds.
After the TTL of a cached entry expires, subsequent requests will trigger a refresh. Defaults to `300`.

#### - `CONFIG_X_EXTENDED_TTL_IN_SECONDS`
Example: `3600`. Sometimes, a calendar cannot be refreshed (e.g., Jira is not reachable).
In these cases, it may be desirable to serve a cached version of the calendar whose standard TTL has expired
instead of throwing an error. The extended TTL controls for how long this is acceptable.