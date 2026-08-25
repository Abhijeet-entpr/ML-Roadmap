export interface AppConfig {
  port: number
  host: string
  intelligenceUrl: string
  corsOrigin: string
}

export function loadConfig(): AppConfig {
  return {
    port: Number(process.env.PORT ?? 3001),
    host: process.env.HOST ?? '0.0.0.0',
    intelligenceUrl: process.env.INTELLIGENCE_URL ?? 'http://localhost:8000',
    corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
  }
}
