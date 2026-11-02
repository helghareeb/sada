import { createPipeline, WEB_INPUT_ACCEPT, isProbablyMedia } from "@sada/core";
import { createWebPorts } from "./ports.web";
import { audioDuration } from "./media";

/**
 * The web implementation of the `window.sada` bridge contract (the same shape
 * the Electron preload exposes). Because the shared UI only knows this contract,
 * the identical React app runs unchanged in the browser.
 *
 * Files can't be referenced by path in the browser, so we keep a registry that
 * maps an opaque id (used where desktop uses a path) to the actual File object.
 */

const PROXY_URL = import.meta.env?.VITE_WIT_PROXY_URL || "/api/speech";
const PROJECT_URL = "https://github.com/helghareeb/sada";

const registry = new Map();
let counter = 0;
let pipeline = null;
let progressCb = () => {};

function register(file) {
  const id = `web-${counter++}`;
  registry.set(id, file);
  return id;
}

export const webBridge = {
  isDesktop: false,

  pickFiles() {
    return new Promise((resolve) => {
      const input = document.createElement("input");
      input.type = "file";
      input.multiple = true;
      // audio/* + video/* plus explicit extensions, because Windows in
      // particular reports no MIME type for .opus/.mkv and would grey them out.
      input.accept = WEB_INPUT_ACCEPT;
      input.onchange = () =>
        resolve(Array.from(input.files || []).map((f) => ({ name: f.name, path: register(f) })));
      input.click();
    });
  },

  // A browser folder pick: the whole folder is read in, media files only.
  pickFolder() {
    return new Promise((resolve) => {
      const input = document.createElement("input");
      input.type = "file";
      input.webkitdirectory = true;
      input.onchange = () => {
        const files = Array.from(input.files || [])
          .filter((f) => isProbablyMedia(f.name))
          .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }))
          .map((f) => ({ name: f.name, path: register(f) }));
        resolve({ dir: null, files });
      };
      input.click();
    });
  },

  getPathForFile(file) {
    return register(file);
  },

  async getDurations(files) {
    const out = [];
    for (const f of files) {
      const file = registry.get(f.path);
      if (!file) {
        out.push({ ...f, duration: 0, mediaError: "" });
        continue;
      }
      // Only the cheap <audio> probe runs here: the ffmpeg.wasm fallback has to
      // load a multi-megabyte wasm core and read the whole file into its
      // virtual FS, which is too slow to do while the user is still adding
      // files. A 0 shown in the list is refined at run time, where the port
      // does the full probe and reports a real reason if it fails.
      const duration = await audioDuration(file);
      out.push({ ...f, duration, mediaError: "" });
    }
    return out;
  },

  async chooseFolder() {
    return null; // No folder settings in the browser.
  },

  async chooseOutputDir() {
    return null; // Browser downloads go to the user's Downloads folder.
  },
  openOutputDir() {
    /* no-op on web */
  },
  openLink(url) {
    if (url) window.open(url, "_blank", "noopener,noreferrer");
  },
  minimize() {
    /* no-op on web */
  },
  quit() {
    /* no-op on web */
  },

  start({ files, token }) {
    const inputs = (files || [])
      .map((f) => ({ name: f.name, source: registry.get(f.path) }))
      .filter((i) => i.source);
    const ports = createWebPorts({ token, proxyUrl: PROXY_URL, emit: (e, p) => progressCb(e, p) });
    pipeline = createPipeline(ports);
    pipeline.run(inputs);
  },
  stop() {
    pipeline?.stop();
  },

  async appInfo() {
    return {
      version: typeof __APP_VERSION__ !== "undefined" ? __APP_VERSION__ : "",
      projectUrl: PROJECT_URL,
      defaultOutputDir: "Downloads",
      platform: "web",
    };
  },

  onProgress(cb) {
    progressCb = cb;
    return () => {
      progressCb = () => {};
    };
  },
};
