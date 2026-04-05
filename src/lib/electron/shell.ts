import "./types";

export async function revealItemInDir(path: string): Promise<void> {
  await window.electronAPI.shell.revealItemInDir(path);
}
