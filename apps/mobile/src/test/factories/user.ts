export interface TestUser {
  id: string;
  email: string;
  name: string;
}

export function makeUser(overrides: Partial<TestUser> = {}): TestUser {
  return {
    id: "user-1",
    email: "user@example.com",
    name: "Test User",
    ...overrides,
  };
}
