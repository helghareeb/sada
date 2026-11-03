import path from "path";
import fs from "fs";
import { app, BrowserWindow, ipcMain, dialog, shell } from "electron";
import { createPipeline, ELECTRON_FILE_FILTERS, isProbablyMedia } from "@sada/core";
import { createDesktopPorts, cleanTmp, getDurationSeconds } from "./ports";

const isDev = !app.isPackaged;

/** App directories. Output defaults to a user-visible "Sada" folder in Documents;
 * logs and temp clips live under the per-user app data dir. */
const defaultOutputDir = path.join(app.getPath("documents"), "Sada");
const tmpDir = path.join(app.getPath("userData"), "tmp");
const logsDir = path.join(app.getPath("userData"), "logs");
for (const dir of [defaultOutputDir, tmpDir, logsDir]) {
  fs.mkdirSync(dir, { recursive: true });
}

/** The temp folder chosen in Settings, or the default. Clip mp3s are cut here,
 * so on a small system drive the user can point it at a larger disk. Clips go
 * in a "sada-tmp" subfolder: cleanup deletes *.mp3, and must never touch the
 * user's own files in the folder they picked. */
function resolveTmpDir(chosen) {
  if (typeof chosen === "string" && chosen.trim() !== "") {
    return path.join(chosen.trim(), "sada-tmp");
  }
  return tmpDir;
}

/** Natural order for folder listings: "2.mp3" before "10.mp3". */
const naturalCompare = new Intl.Collator(undefined, { numeric: true, sensitivity: "base" }).compare;

/** Repointed from the original Telegram link to the open-source project. */
const PROJECT_URL = "https://github.com/helghareeb/sada";

let win;
let pipeline = null;

function logError(err) {
  try {
    fs.appendFileSync(path.join(logsDir, "logs.txt"), String(err && err.stack ? err.stack : err) + "\n");
  } catch {
    /* ignore */
  }
}

function createWindow() {
  win = new BrowserWindow({
    width: 480,
    height: 800,
    frame: false,
    resizable: false,
    transparent: true,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "../preload/index.js"),
      sandbox: false, // preload needs webUtils.getPathForFile
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  win.setMenuBarVisibility(false);
  win.once("ready-to-show", () => win.show());

  if (isDev && process.env.ELECTRON_RENDERER_URL) {
    win.loadURL(process.env.ELECTRON_RENDERER_URL);
  } else {
    win.loadFile(path.join(__dirname, "../renderer/index.html"));
  }
}

app.whenReady().then(() => {
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

// ---- IPC: window controls -------------------------------------------------
ipcMain.on("window:minimize", () => win?.minimize());
ipcMain.on("window:quit", () => app.quit());
ipcMain.on("shell:openLink", (_e, link) => {
  if (typeof link === "string" && /^https?:\/\//.test(link)) shell.openExternal(link);
});
ipcMain.on("shell:openOutputDir", (_e, dir) => {
  shell.openPath(dir && dir !== "null" && dir !== "" ? dir : defaultOutputDir);
});

// ---- IPC: file selection --------------------------------------------------
ipcMain.handle("dialog:pickFiles", async () => {
  const result = await dialog.showOpenDialog(win, {
    title: "Select audio or video files",
    buttonLabel: "Select",
    properties: ["openFile", "multiSelections"],
    // ELECTRON_FILE_FILTERS ends with "All Files": the extension lists are a
    // convenience for the common case, never a gate. FFmpeg decides what is
    // readable by probing content, so a correctly-encoded file under an odd
    // name must stay selectable.
    filters: ELECTRON_FILE_FILTERS,
  });
  if (result.canceled) return [];
  return result.filePaths.map((p) => ({ name: path.basename(p), path: p }));
});

ipcMain.handle("dialog:chooseOutputDir", async () => {
  const result = await dialog.showOpenDialog(win, {
    title: "Choose output directory",
    properties: ["openDirectory", "createDirectory"],
  });
  if (result.canceled) return null;
  return result.filePaths[0] || null;
});

// A folder for the Settings rows (input / temp). Returns the path or null.
ipcMain.handle("dialog:chooseFolder", async (_e, opts) => {
  const result = await dialog.showOpenDialog(win, {
    title: opts?.title || "Choose folder",
    defaultPath: opts?.defaultPath || undefined,
    properties: ["openDirectory", "createDirectory"],
  });
  if (result.canceled) return null;
  return result.filePaths[0] || null;
});

// Add every media file directly inside a folder, in natural order
// (2 before 10), so a numbered series queues in reading order. Sidecar files
// (.json, .csv, .txt) sit next to the audio in most collections; only names
// with a media extension are taken here — a file picked one by one is still
// never gated by its extension.
ipcMain.handle("dialog:pickFolder", async (_e, opts) => {
  const result = await dialog.showOpenDialog(win, {
    title: "Select a folder of audio or video files",
    buttonLabel: "Select",
    defaultPath: opts?.defaultPath || undefined,
    properties: ["openDirectory"],
  });
  if (result.canceled || !result.filePaths[0]) return { dir: null, files: [] };
  const dir = result.filePaths[0];
  let names = [];
  try {
    names = fs
      .readdirSync(dir, { withFileTypes: true })
      .filter((d) => d.isFile() && isProbablyMedia(d.name))
      .map((d) => d.name)
      .sort(naturalCompare);
  } catch (err) {
    logError(err);
  }
  return { dir, files: names.map((name) => ({ name, path: path.join(dir, name) })) };
});

// Compute durations for a list of { name, path }.
ipcMain.handle("audio:getDurations", async (_e, files) => {
  const ports = createDesktopPorts({ token: "", outputDir: defaultOutputDir, tmpDir, sendProgress: () => {} });
  const out = [];
  for (const f of files) {
    let duration = 0;
    let mediaError = "";
    try {
      duration = await getDurationSeconds(f.path, f.name);
    } catch (err) {
      // Keep the file in the list but carry the reason, so the row can say
      // "no audio track" up front instead of the user discovering it after a
      // long run that produced an empty .srt.
      logError(err);
      mediaError = err?.message || "Unreadable file";
    }
    out.push({ ...f, duration, mediaError });
  }
  return out;
});

// ---- IPC: transcription lifecycle ----------------------------------------
ipcMain.on("transcribe:start", async (_e, payload) => {
  const { files, token, outputDir, tmpDir: chosenTmpDir } = payload || {};
  const effectiveOutputDir = outputDir && outputDir !== "" ? outputDir : defaultOutputDir;
  const runTmpDir = resolveTmpDir(chosenTmpDir);

  cleanTmp(runTmpDir);
  const sendProgress = (event, data) => win?.webContents.send("progress", { event, payload: data });

  let ports;
  try {
    ports = createDesktopPorts({ token, outputDir: effectiveOutputDir, tmpDir: runTmpDir, sendProgress });
  } catch (err) {
    // An unwritable output or temp folder (unplugged drive, no permission).
    logError(err);
    sendProgress("error", "Error: " + (err?.message || err));
    sendProgress("processComplete");
    return;
  }
  pipeline = createPipeline(ports);

  const inputs = (files || []).map((f) => ({ name: f.name, source: f.path }));
  try {
    await pipeline.run(inputs);
  } catch (err) {
    logError(err);
    sendProgress("error", "Error: " + (err?.message || err));
    sendProgress("processComplete");
  } finally {
    cleanTmp(runTmpDir);
    pipeline = null;
  }
});

ipcMain.on("transcribe:stop", () => {
  pipeline?.stop();
});

ipcMain.handle("app:info", () => ({
  version: app.getVersion(),
  projectUrl: PROJECT_URL,
  defaultOutputDir,
  defaultTmpDir: tmpDir,
  platform: process.platform,
}));
