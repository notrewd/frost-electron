/**
 * Drop-in replacement for @tauri-apps/plugin-os
 *
 * Tauri's type() is synchronous. We cache the OS type at init time
 * and return it synchronously to match the original API.
 */

let cachedOsType: string = "unknown";
let initialized = false;

function ensureInit() {
  if (!initialized && typeof window !== "undefined" && window.electronAPI) {
    initialized = true;
    window.electronAPI.os.type().then((t: string) => {
      cachedOsType = t;
    });
  }
}

// Try to initialize eagerly
try {
  ensureInit();
} catch {
  // Will be initialized on first call
}

export function type(): string {
  ensureInit();
  return cachedOsType;
}
