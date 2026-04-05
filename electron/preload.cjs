const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  invoke: (command, args) => ipcRenderer.invoke(command, args),

  on: (eventName, callback) => {
    const handler = (_event, name, payload) => {
      if (name === eventName) {
        callback({ payload });
      }
    };
    ipcRenderer.on("app-event", handler);
    return () => ipcRenderer.removeListener("app-event", handler);
  },

  emit: (eventName, payload) => {
    ipcRenderer.send("emit-event", eventName, payload);
  },

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

  dialog: {
    open: (options) => ipcRenderer.invoke("dialog:open", options),
  },

  os: {
    type: () => ipcRenderer.invoke("os:type"),
  },

  shell: {
    revealItemInDir: (path) =>
      ipcRenderer.invoke("shell:revealItemInDir", path),
  },
});
