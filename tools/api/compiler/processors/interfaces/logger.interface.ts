export interface Logger {
  error: (message: string) => void;
  warn: (message: string) => void;
}