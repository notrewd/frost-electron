import "./types";

type CloseRequestedEvent = {
  preventDefault: () => void;
};

class AppWindow {
  async minimize() {
    await window.electronAPI.window.minimize();
  }

  async toggleMaximize() {
    await window.electronAPI.window.toggleMaximize();
  }

  async close() {
    await window.electronAPI.window.close();
  }

  async destroy() {
    await window.electronAPI.window.destroy();
  }

  async title() {
    return window.electronAPI.window.getTitle();
  }

  async isMaximized() {
    return window.electronAPI.window.isMaximized();
  }

  async onCloseRequested(
    callback: (event: CloseRequestedEvent) => void,
  ): Promise<() => void> {
    await window.electronAPI.window.onCloseRequested();

    const unlisten = window.electronAPI.on("close-requested", () => {
      let prevented = false;
      callback({
        preventDefault: () => {
          prevented = true;
        },
      });

      if (!prevented) {
        window.electronAPI.window.forceClose();
      }
    });

    return unlisten;
  }
}

let currentWindow: AppWindow | null = null;

export function getCurrentWindow(): AppWindow {
  if (!currentWindow) {
    currentWindow = new AppWindow();
  }
  return currentWindow;
}
