export type ConnectionStatus =
  | "disconnected"
  | "connecting"
  | "connected"
  | "error"
  | "error-connecting-to-proxy";

export type HistoryEventType = "info" | "error" | "debug" | "warning";

export interface HistoryEvent {
  type: HistoryEventType;
  timestamp: string;
  source: string;
  message: string;
  details?: Record<string, unknown>;
}
