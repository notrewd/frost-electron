import "./types";

type CloseRequestedEvent = {
  preventDefault: () => void;
};

class AppWindow {
  private _closeIntercepted = false;

  async minimize() {
    await window.electronAPI.window.minimize();
  }

  async toggleMaximize() {
    await window.electronAPI.window.toggleMaximize();
  }

  async close() {
    if (this._closeIntercepted) {
      await window.electronAPI.window.forceClose();
    } else {
      await window.electronAPI.window.close();
    }
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
    this._closeIntercepted = true;

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

    return () => {
      this._closeIntercepted = false;
      unlisten();
    };
  }
}

let currentWindow: AppWindow | null = null;

export function getCurrentWindow(): AppWindow {
  if (!currentWindow) {
    currentWindow = new AppWindow();
  }
  return currentWindow;
}
