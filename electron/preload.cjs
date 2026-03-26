const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  // IPC invoke (replaces Tauri's invoke)
  invoke: (command, args) => ipcRenderer.invoke(command, args),

  // Event listening (replaces Tauri's listen)
  on: (eventName, callback) => {
    const handler = (_event, name, payload) => {
      if (name === eventName) {
        callback({ payload });
      }
    };
    ipcRenderer.on("tauri-event", handler);
    // Return unlisten function
    return () => ipcRenderer.removeListener("tauri-event", handler);
  },

  // Event emitting (replaces Tauri's emit)
  emit: (eventName, payload) => {
    ipcRenderer.send("emit-event", eventName, payload);
  },

  // Window operations
  window: {
    minimize: () => ipcRenderer.invoke("window:minimize"),
    toggleMaximize: () => ipcRenderer.invoke("window:toggleMaximize"),
    close: () => ipcRenderer.invoke("window:close"),
    destroy: () => ipcRenderer.invoke("window:destroy"),
    getTitle: () => ipcRenderer.invoke("window:getTitle"),
    isMaximized: () => ipcRenderer.invoke("window:isMaximized"),
    onCloseRequested: () => ipcRenderer.invoke("window:onCloseRequested"),
    forceClose: () => ipcRenderer.invoke("window:forceClose"),
  },

  // Dialog
  dialog: {
    open: (options) => ipcRenderer.invoke("dialog:open", options),
  },

  // OS
  os: {
    type: () => ipcRenderer.invoke("os:type"),
  },

  // Shell
  shell: {
    revealItemInDir: (path) =>
      ipcRenderer.invoke("shell:revealItemInDir", path),
  },
});
