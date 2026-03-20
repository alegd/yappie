export const STORAGE_ADAPTER = "STORAGE_ADAPTER";

export interface StorageAdapter {
  save(key: string, buffer: Buffer): Promise<string>;
  get(key: string): Promise<Buffer | null>;
  delete(key: string): Promise<void>;
}
