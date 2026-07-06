import { Logger } from 'homebridge';

export interface RetryOptions {
  maxRetries?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  backoffMultiplier?: number;
  timeoutMs?: number;
}

export class TuyaAPIError extends Error {
  constructor(
    public code: string,
    public message: string,
    public originalError?: any,
  ) {
    super(`Tuya API Error [${code}]: ${message}`);
    this.name = 'TuyaAPIError';
  }
}

/**
 * Ejecuta una función con reintentos y backoff exponencial
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {},
  logger?: Logger,
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelayMs = 500,
    maxDelayMs = 10000,
    backoffMultiplier = 2,
    timeoutMs = 15000,
  } = options;

  let lastError: any;
  let delay = initialDelayMs;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await executeWithTimeout(fn, timeoutMs);
    } catch (error) {
      lastError = error;

      const isLastAttempt = attempt === maxRetries;
      const errorMsg = error instanceof Error ? error.message : String(error);
      const shouldRetry = shouldRetryError(error);

      if (logger) {
        if (!shouldRetry || isLastAttempt) {
          logger.error(
            `[API] Attempt ${attempt + 1}/${maxRetries + 1} failed: ${errorMsg}${!shouldRetry ? ' (non-retryable)' : ''}`,
          );
        } else {
          logger.warn(
            `[API] Attempt ${attempt + 1}/${maxRetries + 1} failed: ${errorMsg}. Retrying in ${delay}ms...`,
          );
        }
      }

      if (isLastAttempt || !shouldRetry) {
        break;
      }

      await sleep(delay);
      delay = Math.min(delay * backoffMultiplier, maxDelayMs);
    }
  }

  throw lastError;
}

/**
 * Determina si un error es retryable
 */
function shouldRetryError(error: any): boolean {
  // No reintentar errores de autenticación
  if (error instanceof TuyaAPIError) {
    const nonRetryableCodes = [
      '1000', // Invalid request
      '1001', // Invalid access id
      '1002', // Invalid secret
      '1011', // Invalid token
      '1012', // Token expired - should refresh
    ];
    return !nonRetryableCodes.includes(error.code);
  }

  // Reintentar timeouts y errores de conexión
  const retryableMessages = ['timeout', 'econnrefused', 'enotfound', 'econnreset', 'socket hang up'];
  const message = (error instanceof Error ? error.message : String(error)).toLowerCase();
  return retryableMessages.some((msg) => message.includes(msg)) || error.code === 'ETIMEDOUT';
}

/**
 * Ejecuta una función con timeout
 */
async function executeWithTimeout<T>(fn: () => Promise<T>, timeoutMs: number): Promise<T> {
  let timer: NodeJS.Timeout;
  return Promise.race([
    fn(),
    new Promise<T>((_, reject) => {
      timer = setTimeout(() => {
        reject(new Error(`Operation timeout after ${timeoutMs}ms`));
      }, timeoutMs);
    }),
  ]).finally(() => {
    if (timer) {
      clearTimeout(timer);
    }
  });
}

/**
 * Sleep utility
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Valida respuesta de Tuya API
 */
export function validateTuyaResponse(response: any): boolean {
  if (!response || typeof response !== 'object') {
    throw new TuyaAPIError('INVALID_RESPONSE', 'Response is not a valid object');
  }

  if (response.success === false) {
    const code = response.code ? String(response.code) : 'UNKNOWN';
    const message = response.msg || response.message || 'Unknown error';
    throw new TuyaAPIError(code, message, response);
  }

  if (response.success !== true) {
    throw new TuyaAPIError('MISSING_SUCCESS_FLAG', 'Response missing success flag');
  }

  return true;
}
