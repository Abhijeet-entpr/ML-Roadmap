import { loadConfig } from './config.js'
import { buildApp } from './app.js'

async function main() {
  const config = loadConfig()
  const app = await buildApp(config)

  try {
    await app.listen({ port: config.port, host: config.host })
    app.log.info(`API listening on http://${config.host}:${config.port}`)
    app.log.info(`Swagger UI at http://localhost:${config.port}/docs`)
    app.log.info(`Intelligence URL: ${config.intelligenceUrl}`)
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}

main()
