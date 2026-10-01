export interface MultipartFileField {
  name: string;
  value: File[];
}

export type ApiFetcherData = Record<string, unknown> & { file?: MultipartFileField };

export interface ApiFetcherArgs extends Omit<RequestInit, "headers"> {
  token?: string;
  headers?: Record<string, string>;
  data?: ApiFetcherData;
}

export interface ApiErrorBody {
  message?: string;
  key?: string;
}
