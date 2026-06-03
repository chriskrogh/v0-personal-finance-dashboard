const isDev = process.env.NODE_ENV !== "production";

/** Server-side logging: debug only in development. */
export const logger = {
  debug: (...args: unknown[]) => {
    if (isDev) console.log(...args);
  },
  error: (...args: unknown[]) => {
    console.error(...args);
  },
};
