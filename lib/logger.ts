export type LogLevel = "debug" | "info" | "warn" | "error";

type LogPayload = Record<string, unknown>;

function hash8(value: string) {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

function toPayload(meta?: unknown): LogPayload {
  if (meta === null || meta === undefined) return {};
  if (typeof meta === "object" && !Array.isArray(meta)) {
    return meta as LogPayload;
  }
  return { value: meta };
}

function sanitize(data: LogPayload): LogPayload {
  return JSON.parse(
    JSON.stringify(data, (_key, value) => {
      if (typeof value === "string" && value.includes("@")) {
        return `***${hash8(value)}`;
      }
      return value;
    }),
  );
}

export function log(
  event: string,
  data: LogPayload = {},
  level: LogLevel = "info",
) {
  const safe = sanitize(data);
  const line = {
    ts: new Date().toISOString(),
    env: process.env.NODE_ENV || "dev",
    level,
    event,
    ...safe,
  };
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(line));
}

function normaliseError(error: unknown) {
  if (error instanceof Error) {
    return { name: error.name, message: error.message, stack: error.stack };
  }
  return error;
}

function merge(base: LogPayload, meta?: unknown): LogPayload {
  return { ...base, ...toPayload(meta) };
}

class StructuredLogger {
  private shouldLogDebug() {
    return process.env.NODE_ENV !== "production";
  }

  debug(message: string, meta?: unknown) {
    if (!this.shouldLogDebug()) return;
    log("logger.debug", merge({ message }, meta), "debug");
  }

  info(message: string, meta?: unknown) {
    log("logger.info", merge({ message }, meta));
  }

  warn(message: string, meta?: unknown) {
    log("logger.warn", merge({ message }, meta), "warn");
  }

  error(message: string, error?: unknown, meta?: unknown) {
    log(
      "logger.error",
      merge({ message, error: normaliseError(error) }, meta),
      "error",
    );
  }

  service(name: string, status: "initialized" | "failed", details?: string) {
    log("service.status", merge({ name, status, details }, undefined));
  }

  apiError(endpoint: string, error: unknown, context?: unknown) {
    log(
      "api.error",
      merge({ endpoint, error: normaliseError(error) }, context),
      "error",
    );
  }

  metric(name: string, value: number, unit: string = "ms", tags?: unknown) {
    if (!this.shouldLogDebug()) return;
    log("metric", merge({ name, value, unit }, tags), "debug");
  }
}

export const logger = new StructuredLogger();
export const winstonLogger = logger;
export class Logger extends StructuredLogger {}
export class EnhancedLogger extends StructuredLogger {}

export const logHelpers = {
  assessment: (action: string, assessmentId: string, details?: unknown) => {
    logger.info("assessment.event", merge({ action, assessmentId }, details));
  },
  payment: (action: string, sessionId: string, details?: unknown) => {
    logger.info("payment.event", merge({ action, sessionId }, details));
  },
  pdf: (action: string, details?: unknown) => {
    logger.info("pdf.event", merge({ action }, details));
  },
  email: (action: string, recipient: string, details?: unknown) => {
    logger.info(
      "email.event",
      merge({ action, recipient: `***${hash8(recipient)}` }, details),
    );
  },
  admin: (
    action: string,
    adminId: string,
    resourceType: string,
    resourceId?: string,
    metadata?: unknown,
  ) => {
    logger.info(
      "admin.event",
      merge(
        {
          action,
          resourceType,
          resourceId,
          adminId: `***${hash8(adminId)}`,
        },
        metadata,
      ),
    );
  },
};

export function runWithRequestContext<T>(
  _context: { requestId?: string; userId?: string },
  callback: () => T,
): T {
  return callback();
}

export function requestLoggingMiddleware(
  _req: unknown,
  _res: unknown,
  next: () => void,
) {
  next();
}

export const winston = undefined;
