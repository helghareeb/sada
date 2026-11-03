import { contextBridge, ipcRenderer, webUtils } from "electron";

/**
 * The single, minimal, typed surface the renderer is allowed to touch.
 * Everything crosses an explicit IPC channel — the renderer has no direct
 * access to Node, fs, or Electron internals (contextIsolation is on).
 *
 * This object also defines the cross-platform "bridge" contract: the web app
 * implements the same shape against the in-browser pipeline, so the shared UI
 * is identical on both targets.
 */
const bridge = {
  isDesktop: true,

  // File selection
  pickFiles: () => ipcRenderer.invoke("dialog:pickFiles"),
  // Documented Electron pattern for resolving a dropped File to its path.
  getPathForFile: (file) => {
    try {
      return webUtils.getPathForFile(file);
    } catch {
      return "";
    }
  },
  getDurations: (files) => ipcRenderer.invoke("audio:getDurations", files),
  chooseOutputDir: () => ipcRenderer.invoke("dialog:chooseOutputDir"),
  // Settings folders (input / temp): resolves to a path or null.
  chooseFolder: (opts) => ipcRenderer.invoke("dialog:chooseFolder", opts),
  // Every media file in one folder: resolves to { dir, files: [{ name, path }] }.
  pickFolder: (opts) => ipcRenderer.invoke("dialog:pickFolder", opts),

  // Shell / window
  openOutputDir: (dir) => ipcRenderer.send("shell:openOutputDir", dir),
  openLink: (url) => ipcRenderer.send("shell:openLink", url),
  minimize: () => ipcRenderer.send("window:minimize"),
  quit: () => ipcRenderer.send("window:quit"),

  // Transcription
  start: (payload) => ipcRenderer.send("transcribe:start", payload),
  stop: () => ipcRenderer.send("transcribe:stop"),
  appInfo: () => ipcRenderer.invoke("app:info"),

  // Progress stream: cb(event, payload). Returns an unsubscribe function.
  onProgress: (cb) => {
    const handler = (_e, msg) => cb(msg.event, msg.payload);
    ipcRenderer.on("progress", handler);
    return () => ipcRenderer.removeListener("progress", handler);
  },
};

contextBridge.exposeInMainWorld("sada", bridge);
