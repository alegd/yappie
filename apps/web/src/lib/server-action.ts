export type ServerActionResult<T> = T | { success: boolean; error: string };

export class ServerActionError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.name = "ServerActionError";
    this.statusCode = statusCode;
  }
}

export function createServerAction<Return, Args extends unknown[] = []>(
  callback: (...args: Args) => Promise<Return>,
): (...args: Args) => Promise<ServerActionResult<Return>> {
  return async (...args: Args) => {
    try {
      const value = await callback(...args);
      return value;
    } catch (error) {
      if (error instanceof ServerActionError) {
        return { success: false, error: error.message, statusCode: error.statusCode };
      }

      throw error;
    }
  };
}
