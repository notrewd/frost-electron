import "./types";

/**
 * Invoke a command on the Electron main process via IPC.
 */
export async function invoke<T = unknown>(
  command: string,
  args?: Record<string, unknown>,
): Promise<T> {
  return window.electronAPI.invoke(command, args || {}) as Promise<T>;
}
