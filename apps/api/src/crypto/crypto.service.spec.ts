import { describe, it, expect, vi, beforeEach } from "vitest";
import { CryptoService } from "./crypto.service.js";

// 32 bytes = 64 hex chars
const TEST_KEY = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

function createMockConfig() {
  return {
    get: vi.fn((key: string) => {
      if (key === "ENCRYPTION_KEY") return TEST_KEY;
      return undefined;
    }),
  };
}

describe("CryptoService", () => {
  let service: CryptoService;

  beforeEach(() => {
    service = new CryptoService(createMockConfig() as never);
  });

  it("should encrypt and decrypt a string", () => {
    const plaintext = "my-secret-jira-token-12345";
    const encrypted = service.encrypt(plaintext);

    expect(encrypted).not.toBe(plaintext);

    const decrypted = service.decrypt(encrypted);
    expect(decrypted).toBe(plaintext);
  });

  it("should produce different ciphertexts for the same input (random IV)", () => {
    const plaintext = "same-input";
    const encrypted1 = service.encrypt(plaintext);
    const encrypted2 = service.encrypt(plaintext);

    expect(encrypted1).not.toBe(encrypted2);

    // Both should decrypt to the same value
    expect(service.decrypt(encrypted1)).toBe(plaintext);
    expect(service.decrypt(encrypted2)).toBe(plaintext);
  });

  it("should handle empty strings", () => {
    const encrypted = service.encrypt("");
    const decrypted = service.decrypt(encrypted);
    expect(decrypted).toBe("");
  });

  it("should handle long tokens", () => {
    const longToken = "a".repeat(2048);
    const encrypted = service.encrypt(longToken);
    const decrypted = service.decrypt(encrypted);
    expect(decrypted).toBe(longToken);
  });

  it("should throw on tampered ciphertext", () => {
    const encrypted = service.encrypt("secret");
    const tampered = encrypted.slice(0, -2) + "XX";

    expect(() => service.decrypt(tampered)).toThrow();
  });
});
