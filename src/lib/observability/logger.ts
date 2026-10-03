import winston from 'winston';

const isProd = process.env.NODE_ENV === 'production';

function createLogger() {
  const transports: winston.transport[] = [];

  if (isProd && process.env.GCP_PROJECT_ID && process.env.PRAXIS_LOCAL_EMULATORS !== 'true') {
    // Dynamic require to avoid breaking builds when package is not installed
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { LoggingWinston } = require('@google-cloud/logging-winston');
      transports.push(new LoggingWinston({
        projectId: process.env.GCP_PROJECT_ID,
        logName: 'praxis-frontend',
      }));
    } catch {
      transports.push(new winston.transports.Console());
    }
  } else {
    transports.push(new winston.transports.Console());
  }

  return winston.createLogger({
    level: isProd ? 'info' : 'debug',
    format: winston.format.json(),
    transports,
  });
}

export const logger = createLogger();

export interface ApiCallLog {
  route: string;
  uid: string;
  situationId?: string;
  toolName?: string;
  latencyMs: number;
  creditsDeducted?: number;
  status: number;
  error?: string;
  providerFallback?: boolean;
}

export function logApiCall(args: ApiCallLog) {
  logger.info('api_call', {
    ...args,
    timestamp: new Date().toISOString(),
  });
}
