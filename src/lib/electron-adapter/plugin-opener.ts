/**
 * Drop-in replacement for @tauri-apps/plugin-opener
 */

export async function revealItemInDir(path: string): Promise<void> {
  await window.electronAPI.shell.revealItemInDir(path);
}
