/**
 * Drop-in replacement for @tauri-apps/api/core
 * Maps Tauri's invoke() to Electron IPC
 */

declare global {
  interface Window {
    electronAPI: {
      invoke: (command: string, args?: Record<string, unknown>) => Promise<unknown>;
      on: (event: string, callback: (event: { payload: unknown }) => void) => () => void;
      emit: (event: string, payload?: unknown) => void;
      window: {
        minimize: () => Promise<void>;
        toggleMaximize: () => Promise<void>;
        close: () => Promise<void>;
        destroy: () => Promise<void>;
        getTitle: () => Promise<string>;
        isMaximized: () => Promise<boolean>;
        onCloseRequested: () => Promise<void>;
        forceClose: () => Promise<void>;
      };
      dialog: {
        open: (options: Record<string, unknown>) => Promise<unknown>;
      };
      os: {
        type: () => Promise<string>;
      };
      shell: {
        revealItemInDir: (path: string) => Promise<void>;
      };
    };
  }
}

/**
 * Invoke a command on the Electron main process.
 * Translates Tauri's invoke(command, {arg1, arg2}) convention to Electron IPC.
 */
export async function invoke<T = unknown>(command: string, args?: Record<string, unknown>): Promise<T> {
  return window.electronAPI.invoke(command, args || {}) as Promise<T>;
}
