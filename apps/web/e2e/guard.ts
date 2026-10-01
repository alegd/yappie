const REDIS_DB_INDEX_PATH = /^\/(\d+)\/?$/;
const E2E_DB_NAME = /e2e/i;

export interface E2eTargetEnv {
  NODE_ENV?: string;
  DB_NAME?: string;
  REDIS_URL?: string;
}

function hasNonDefaultRedisDbIndex(redisUrl: string | undefined): boolean {
  if (!redisUrl) return false;

  let pathname: string;
  try {
    pathname = new URL(redisUrl).pathname;
  } catch {
    return false;
  }

  const match = REDIS_DB_INDEX_PATH.exec(pathname);
  if (!match) return false;
  return Number(match[1]) !== 0;
}

export function assertE2eTarget(env: E2eTargetEnv): void {
  const isSafe =
    env.NODE_ENV === "test" &&
    E2E_DB_NAME.test(env.DB_NAME ?? "") &&
    hasNonDefaultRedisDbIndex(env.REDIS_URL);

  if (isSafe) return;

  throw new Error(
    `Web e2e refused: unsafe target (NODE_ENV=${env.NODE_ENV}, DB_NAME=${env.DB_NAME}, REDIS_URL=${env.REDIS_URL}). ` +
      `Expected NODE_ENV=test, an e2e database, and a REDIS_URL with a non-zero database index. ` +
      `Run through "pnpm e2e:web", which loads apps/api/.env.e2e.`,
  );
}
