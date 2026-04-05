import "./types";

type UnlistenFn = () => void;
type EventCallback<T = unknown> = (event: { payload: T }) => void;

export async function listen<T = unknown>(
  eventName: string,
  callback: EventCallback<T>,
): Promise<UnlistenFn> {
  return window.electronAPI.on(eventName, callback as EventCallback);
}

export async function emit(
  eventName: string,
  payload?: unknown,
): Promise<void> {
  window.electronAPI.emit(eventName, payload);
}
