// Wait for Vite dev server to be ready before launching Electron
import http from "http";

const PORT = 1420;
const MAX_RETRIES = 30;
const RETRY_DELAY = 1000;

let retries = 0;

function check() {
  return new Promise((resolve) => {
    const req = http.get(`http://localhost:${PORT}`, () => resolve(true));
    req.on("error", () => resolve(false));
    req.end();
  });
}

async function waitForVite() {
  while (retries < MAX_RETRIES) {
    if (await check()) {
      console.log("Vite dev server is ready!");
      return;
    }
    retries++;
    await new Promise((r) => setTimeout(r, RETRY_DELAY));
  }
  console.error("Vite dev server did not start in time");
  process.exit(1);
}

waitForVite();
