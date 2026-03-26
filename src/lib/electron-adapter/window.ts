/**
 * Drop-in replacement for @tauri-apps/api/window
 */

type CloseRequestedEvent = {
  preventDefault: () => void;
};

class ElectronWindow {
  private _closeIntercepted = false;

  async minimize() {
    await window.electronAPI.window.minimize();
  }

  async toggleMaximize() {
    await window.electronAPI.window.toggleMaximize();
  }

  async close() {
    if (this._closeIntercepted) {
      // If close interception is active, use forceClose to bypass the handler
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

    // Register the close interception on main process
    await window.electronAPI.window.onCloseRequested();

    // Listen for close-requested events
    const unlisten = window.electronAPI.on("close-requested", () => {
      let prevented = false;
      callback({
        preventDefault: () => {
          prevented = true;
        },
      });

      // If not prevented, force close
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

let currentWindow: ElectronWindow | null = null;

export function getCurrentWindow(): ElectronWindow {
  if (!currentWindow) {
    currentWindow = new ElectronWindow();
  }
  return currentWindow;
}
