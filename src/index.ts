import { Logger } from '@utils/logging';
import { exit } from 'process';
import packageJson from 'package.json';
import { createApp } from './app/express';
import { createServer } from 'http';


const Log = Logger.getLogger("index.ts")

function launch() {
  Log.info(`Launching iCal sync for Jira v${packageJson.version}`)

  const app = createApp()

  const port = process.env.PORT || 8080;
  app.set('port', port)

  const httpServer = createServer(app);
  httpServer.listen(port, () => {
    Log.info(`HTTP-Server live at http://127.0.0.1:${port}`)
  })
}

try {
  launch()
} catch (err) {
  Log.error("Critical error during application launch", err)
  exit(-1);
}