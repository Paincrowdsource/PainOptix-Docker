/**
 * Get the application URL dynamically based on environment
 * Works in both client and server contexts
 */
export function getAppUrl(): string {
  // In production, always use the environment variable
  if (process.env.NODE_ENV === 'production') {
    if (!process.env.NEXT_PUBLIC_APP_URL) {
      throw new Error('NEXT_PUBLIC_APP_URL is required in production');
    }
    return process.env.NEXT_PUBLIC_APP_URL;
  }
  
  // In development, use env variable if set, otherwise default to localhost
  return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
}

/**
 * Ensure URL has proper protocol
 */
export function ensureProtocol(url: string): string {
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  // Default to https in production, http in development
  const protocol = process.env.NODE_ENV === 'production' ? 'https://' : 'http://';
  return `${protocol}${url}`;
}

/**
 * Join URL paths safely
 */
export function joinUrlPaths(base: string, ...paths: string[]): string {
  const cleanBase = base.endsWith('/') ? base.slice(0, -1) : base;
  const cleanPaths = paths.map(path => {
    // Remove leading and trailing slashes
    return path.replace(/^\/+|\/+$/g, '');
  }).filter(Boolean);
  
  return [cleanBase, ...cleanPaths].join('/');
}