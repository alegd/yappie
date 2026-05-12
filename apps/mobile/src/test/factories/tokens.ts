export interface TestTokenPair {
  accessToken: string;
  refreshToken: string;
}

export function makeTokenPair(overrides: Partial<TestTokenPair> = {}): TestTokenPair {
  return {
    accessToken: "access-token-test",
    refreshToken: "refresh-token-test",
    ...overrides,
  };
}
