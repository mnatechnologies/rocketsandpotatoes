const IS_DEVELOPMENT = process.env.NODE_ENV === 'development';
const TESTING_MODE = process.env.TESTING_MODE === 'true';

export function createLogger(prefix: string) {
  return {
    log: (...args: any[]) => {
      if (IS_DEVELOPMENT || TESTING_MODE) {
        console.log(`[${prefix}]`, ...args);
      }
    },
    error: (...args: any[]) => {
      // Always log errors
      console.error(`[${prefix}]`, ...args);
    },
    warn: (...args: any[]) => {
      if (IS_DEVELOPMENT || TESTING_MODE) {
        console.warn(`[${prefix}]`, ...args);
      }
    },
  };
}