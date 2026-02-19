export interface ResponseFormat<T = unknown> {
  code: number;
  message: string;
  data: T;
  timestamp: string;
  path: string;
}
