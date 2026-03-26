/**
 * Drop-in replacement for @tauri-apps/plugin-dialog
 */

interface OpenDialogOptions {
  directory?: boolean;
  multiple?: boolean;
  title?: string;
  filters?: Array<{ name: string; extensions: string[] }>;
}

export async function open(
  options?: OpenDialogOptions & { multiple: true },
): Promise<string[] | null>;
export async function open(
  options?: OpenDialogOptions,
): Promise<string | null>;
export async function open(
  options?: OpenDialogOptions,
): Promise<string | string[] | null> {
  return window.electronAPI.dialog.open(
    (options || {}) as unknown as Record<string, unknown>,
  ) as Promise<string | string[] | null>;
}
