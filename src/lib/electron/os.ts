import "./types";

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

try {
  ensureInit();
} catch {
  // Will be initialized on first call
}

export function type(): string {
  ensureInit();
  return cachedOsType;
}
