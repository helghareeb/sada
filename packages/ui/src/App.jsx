import React, { useCallback, useState, useRef, useEffect, useContext } from "react";
import "./App.css";
import { useDropzone } from "react-dropzone";
import {
  faPowerOff,
  faGear,
  faPlayCircle,
  faWindowClose,
  faFile,
  faTrashCan,
  faAdd,
  faClock,
  faClose,
  faKey,
  faFolder,
  faFolderOpen,
  faRotateLeft,
  faStop,
  faMinus,
  faCircleInfo,
  faGlobe,
  faLink,
  faCode,
  faBug,
  faTriangleExclamation,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { secondsToHHMMSS } from "./util";
import loc from "./localization";
import Context from "./Context/Context";
import { bridge } from "./bridge";
import textToSpeechImg from "./assets/text-to-speech.png";

const WIT_URL = "https://wit.ai";

// Author / brand links — kept in sync with the personal-brand kit (@helghareeb).
const LINKS = {
  website: "https://helghareeb.github.io",
  linkedin: "https://www.linkedin.com/in/helghareeb",
  youtube: "https://youtube.com/@helghareeb",
  github: "https://github.com/helghareeb",
  source: "https://github.com/helghareeb/sada",
  issues: "https://github.com/helghareeb/sada/issues",
};

const AboutModal = ({ onClose, appInfo }) => {
  const link = (icon, label, url) => (
    <button
      className="btn btn-ghost btn-sm justify-start rounded-lg"
      onClick={() => bridge.openLink(url)}
    >
      <FontAwesomeIcon icon={icon} fixedWidth className="text-success" />
      <span className="mx-1">{label}</span>
    </button>
  );
  return (
    <div className="justify-center items-center flex overflow-x-hidden overflow-y-auto fixed inset-0 z-[60] bg-slate-200 bg-opacity-50">
      <div className="card bg-base-100 shadow p-8 w-96 text-start">
        <div className="absolute top-2 right-2">
          <button className="btn btn-ghost btn-square btn-sm mx-1" onClick={onClose}>
            <FontAwesomeIcon icon={faClose} fixedWidth size="lg" />
          </button>
        </div>
        <h2 className="font-bold text-lg mb-1">
          {loc.app_name} · {loc.tagline}
        </h2>
        <p className="text-sm mb-4">{loc.about_project}</p>

        <div className="text-sm font-bold">{loc.author}</div>
        <div className="text-sm">{loc.author_name}</div>
        <div className="text-xs text-slate-400 mb-3">{loc.author_role}</div>

        <div className="text-sm font-bold mb-1">{loc.contact_connect}</div>
        <div className="grid grid-cols-2 gap-1">
          {link(faGlobe, loc.website, LINKS.website)}
          {link(faLink, loc.linkedin, LINKS.linkedin)}
          {link(faLink, loc.youtube, LINKS.youtube)}
          {link(faCode, loc.github_profile, LINKS.github)}
          {link(faCode, loc.source_code, LINKS.source)}
          {link(faBug, loc.report_issue, LINKS.issues)}
        </div>

        <div className="text-xs text-slate-400 mt-4">
          {loc.license_note} · {loc.version_label} {appInfo?.version || ""}
        </div>
      </div>
    </div>
  );
};

const FileItem = ({ name, id, duration, mediaError, deleteFile }) => {
  const shortName = name.length > 14 ? name.substring(0, 12) + "…" : name;
  const numberOfClips = Math.max(1, Math.round(duration / 18));
  // A file whose duration could not be read is shown flagged rather than hidden
  // or silently dropped: the user chose it, so they get to see why it will not
  // work and can remove it or fetch a better copy before starting a long run.
  return (
    <div className="card bg-base-100 p-2 my-1 rounded-none border-b-2">
      <div className="flex flex-row justify-between items-center">
        <div className="text-ellipsis">
          <FontAwesomeIcon
            icon={mediaError ? faTriangleExclamation : faFile}
            fixedWidth
            size="lg"
            className={mediaError ? "text-error" : "text-neutral"}
          />
          {shortName}
        </div>
        <div className="flex flex-row items-center">
          {!mediaError && (
            <>
              <span className="badge badge-success mx-2 p-3">{numberOfClips}</span>
              <span className="badge badge-success-content mx-2 p-3">
                <div className="text-white">
                  <FontAwesomeIcon icon={faClock} fixedWidth size="lg" />
                  {secondsToHHMMSS(duration)}
                </div>
              </span>
            </>
          )}
          <button
            className="btn btn-square btn-outline btn-sm btn-error rounded-lg"
            onClick={() => deleteFile(id)}
          >
            <FontAwesomeIcon icon={faWindowClose} fixedWidth size="lg" />
          </button>
        </div>
      </div>
      {mediaError && (
        <div className="text-xs text-error mt-1 break-words">{mediaError}</div>
      )}
    </div>
  );
};

const TokenHelpModal = ({ onClose, zClass = "z-[60]" }) => (
  <div
    className={`justify-center items-center flex overflow-x-hidden overflow-y-auto fixed inset-0 ${zClass} bg-slate-200 bg-opacity-50`}
  >
    <div className="card bg-base-100 shadow p-8 w-96 text-start">
      <div className="absolute top-2 right-2">
        <button className="btn btn-ghost btn-square btn-sm mx-1" onClick={onClose}>
          <FontAwesomeIcon icon={faClose} fixedWidth size="lg" />
        </button>
      </div>
      <h2 className="font-bold text-lg mb-1">{loc.token_help_title}</h2>
      <p className="text-sm text-success mb-3">{loc.free_note}</p>
      <ol className="list-decimal ms-5 space-y-2 text-sm">
        <li>{loc.token_step1}</li>
        <li>{loc.token_step2}</li>
        <li>{loc.token_step3}</li>
        <li>{loc.token_step4}</li>
        <li>{loc.token_step5}</li>
      </ol>
      <button
        className="btn btn-sm btn-success rounded-lg mt-4"
        onClick={() => bridge.openLink(WIT_URL)}
      >
        {loc.open_wit}
      </button>
    </div>
  </div>
);

/**
 * First-run guide.
 *
 * Sada needs exactly one piece of setup — a free Wit.ai token — and before this
 * existed nothing said so. The app opened on an empty window; the only mention
 * of a token was behind the gear icon, and the first time most people learned
 * they needed one was an error message after they had already added files and
 * pressed Start. For anyone who does not build software, that reads as "the app
 * is broken".
 *
 * So: say it first, say what it costs (nothing), and take the token right here
 * rather than sending them off to find Settings. Shown whenever no token has
 * been saved yet, so postponing it is safe — it comes back next launch.
 */
const WelcomeModal = ({ onClose, onOpenHelp }) => {
  const { setApiKey } = useContext(Context);
  const [draft, setDraft] = useState("");

  const saveAndClose = () => {
    const token = draft.trim();
    if (token) setApiKey(token);
    onClose();
  };

  return (
    <div className="justify-center items-center flex overflow-x-hidden overflow-y-auto fixed inset-0 z-[70] bg-slate-200 bg-opacity-50">
      <div className="card bg-base-100 shadow-xl p-8 w-[26rem] text-start">
        <h2 className="font-bold text-xl mb-2">{loc.welcome_title}</h2>
        <p className="text-sm mb-4">{loc.welcome_intro}</p>

        <ol className="space-y-2 text-sm mb-4">
          <li>{loc.welcome_step_1}</li>
          <li>{loc.welcome_step_2}</li>
          <li>{loc.welcome_step_3}</li>
        </ol>

        {/* Stacked, not side by side: the two labels are long in both languages
            and ran off the edge of the card when laid out in a row. */}
        <div className="flex flex-col items-start gap-1 mb-3">
          <button className="btn btn-sm btn-success rounded-lg" onClick={() => bridge.openLink(WIT_URL)}>
            <FontAwesomeIcon icon={faKey} fixedWidth />
            <span className="mx-1">{loc.welcome_get_token}</span>
          </button>
          <button className="btn btn-xs btn-ghost text-info rounded-lg" onClick={onOpenHelp}>
            <FontAwesomeIcon icon={faCircleInfo} fixedWidth />
            <span className="mx-1">{loc.how_to_get_token}</span>
          </button>
        </div>

        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={loc.welcome_paste_here}
          className="input input-bordered w-full mb-2"
        />
        <div className="text-xs text-success mb-4">{loc.welcome_privacy}</div>

        <div className="flex flex-row items-center justify-between">
          <button className="btn btn-ghost btn-sm rounded-lg" onClick={onClose}>
            {loc.welcome_skip}
          </button>
          <button
            className="btn btn-sm btn-success rounded-lg"
            onClick={saveAndClose}
            disabled={!draft.trim()}
          >
            {loc.welcome_save_and_start}
          </button>
        </div>
      </div>
    </div>
  );
};

/** One folder setting: label, pick button, reset-to-default, current path. */
const FolderSetting = ({ label, value, placeholder, onChoose, onReset }) => (
  <div className="mb-2">
    <div className="text-start my-1">
      <span className="mx-1">{label}</span>
      <button className="btn btn-ghost btn-xs mx-1 rounded-lg" onClick={onChoose} title={label}>
        <FontAwesomeIcon icon={faFolder} fixedWidth className="text-warning" />
      </button>
      {value && (
        <button className="btn btn-ghost btn-xs rounded-lg" onClick={onReset} title={loc.use_default}>
          <FontAwesomeIcon icon={faRotateLeft} fixedWidth />
        </button>
      )}
    </div>
    <input
      type="text"
      value={value}
      disabled
      dir={value ? "ltr" : undefined}
      placeholder={placeholder}
      className="input input-bordered w-full max-w-xs text-xs"
    />
    <hr />
  </div>
);

const SettingsModal = ({ toggleModal, appInfo }) => {
  const {
    speechLanguage, setSpeechLanguage,
    apiKey, setApiKey,
    interfaceLanguage, setInterfaceLanguage,
    outputDirectory, setOutputDirectory,
    inputDirectory, setInputDirectory,
    tmpDirectory, setTmpDirectory,
    conversionEngine, setConversionEngine,
    setTheme, theme,
  } = useContext(Context);
  const [tokenHelp, setTokenHelp] = useState(false);

  const chooseDir = async () => {
    const dir = await bridge.chooseOutputDir();
    if (dir) setOutputDirectory(dir);
  };
  const chooseInputDir = async () => {
    const dir = await bridge.chooseFolder?.({ title: loc.choose_input_directory, defaultPath: inputDirectory });
    if (dir) setInputDirectory(dir);
  };
  const chooseTmpDir = async () => {
    const dir = await bridge.chooseFolder?.({ title: loc.choose_temp_directory, defaultPath: tmpDirectory });
    if (dir) setTmpDirectory(dir);
  };

  return (
    <div className="justify-center items-center flex overflow-x-hidden overflow-y-auto fixed inset-0 z-50 bg-slate-200 bg-opacity-50">
      {tokenHelp && <TokenHelpModal onClose={() => setTokenHelp(false)} />}
      <div className="card bg-base-100 shadow p-10 w-96">
        <div className="absolute top-2 right-2">
          <button className="btn btn-ghost btn-square btn-sm mx-1" onClick={toggleModal}>
            <FontAwesomeIcon icon={faClose} fixedWidth size="lg" />
          </button>
        </div>

        <div className="mb-2">
          <div className="text-start">{loc.speech_language}</div>
          <select
            className="select w-full max-w-xs"
            value={speechLanguage}
            onChange={(e) => setSpeechLanguage(e.target.value)}
          >
            <option value="ar">{loc.arabic}</option>
          </select>
          <hr />
        </div>

        <div className="mb-2">
          <div className="text-start">{loc.conversion_engine}</div>
          <select
            className="select w-full max-w-xs"
            value={conversionEngine}
            onChange={(e) => setConversionEngine(e.target.value)}
          >
            <option value="wit">Wit.ai</option>
          </select>
          <hr />
        </div>

        <div className="mb-2">
          <div className="text-start">{loc.interface_language}</div>
          <select
            className="select w-full max-w-xs"
            value={interfaceLanguage}
            onChange={(e) => setInterfaceLanguage(e.target.value)}
          >
            <option value="ar">{loc.arabic}</option>
            <option value="en">{loc.english}</option>
          </select>
          <hr />
        </div>

        <div className="mb-2">
          <div className="text-start">{loc.theme}</div>
          <select
            className="select w-full max-w-xs"
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
          >
            <option value="light">{loc.light}</option>
            <option value="dark">{loc.dark}</option>
          </select>
          <hr />
        </div>

        {bridge.isDesktop && (
          <FolderSetting
            label={loc.choose_input_directory}
            value={inputDirectory}
            placeholder={loc.input_directory_hint}
            onChoose={chooseInputDir}
            onReset={() => setInputDirectory("")}
          />
        )}

        <FolderSetting
          label={loc.choose_output_directory}
          value={outputDirectory}
          placeholder={appInfo?.defaultOutputDir || "output"}
          onChoose={chooseDir}
          onReset={() => setOutputDirectory("")}
        />

        {bridge.isDesktop && (
          <FolderSetting
            label={loc.choose_temp_directory}
            value={tmpDirectory}
            placeholder={appInfo?.defaultTmpDir || "temp"}
            onChoose={chooseTmpDir}
            onReset={() => setTmpDirectory("")}
          />
        )}

        <div className="mb-2">
          <div className="text-start my-1 flex items-center justify-between">
            <span className="mx-1">
              {loc.enter_wit_api_key}
              <FontAwesomeIcon icon={faKey} fixedWidth className="text-warning mx-2" />
            </span>
            <button
              className="btn btn-ghost btn-xs text-info"
              onClick={() => setTokenHelp(true)}
            >
              <FontAwesomeIcon icon={faCircleInfo} fixedWidth />
              <span className="mx-1">{loc.how_to_get_token}</span>
            </button>
          </div>
          <input
            type="text"
            value={apiKey}
            className="input input-bordered w-full max-w-xs"
            onChange={(e) => setApiKey(e.target.value)}
          />
          <hr />
        </div>

        <button className="btn btn-sm btn-success rounded-lg" onClick={toggleModal}>
          {loc.save}
        </button>

        <div className="mt-8 flex flex-row items-center justify-between">
          <div className="text-slate-400">
            {loc.version_label} {appInfo?.version || ""}
          </div>
          <button
            className="btn btn-ghost btn-xs"
            onClick={() => bridge.openLink(appInfo?.projectUrl || "")}
          >
            {loc.project_updates}
          </button>
        </div>
      </div>
    </div>
  );
};

const MessageModal = () => {
  const { setError, error } = useContext(Context);
  return (
    <div className="justify-center items-center flex overflow-x-hidden overflow-y-auto fixed inset-0 z-50 bg-slate-200 bg-opacity-50">
      <div className="card bg-base-100 shadow p-10 w-96">
        <div className="absolute top-2 right-2">
          <button className="btn btn-ghost btn-square btn-sm mx-1" onClick={() => setError("")}>
            <FontAwesomeIcon icon={faClose} fixedWidth size="lg" />
          </button>
        </div>
        <div className="mb-2 whitespace-pre-wrap break-words">{error}</div>
      </div>
    </div>
  );
};

const LoadingModal = () => (
  <div className="justify-center items-center flex fixed inset-0 z-50 bg-slate-200 bg-opacity-50">
    <div className="card bg-base-100 shadow p-10 w-96">
      <span className="loading loading-spinner loading-lg mx-auto" />
    </div>
  </div>
);

function MyDropzone() {
  const {
    filesToProcess, setFilesToProcess, setLoading, outputDirectory, setError,
    inputDirectory, setInputDirectory,
  } = useContext(Context);

  const addFiles = (files) => {
    setFilesToProcess((prev) => {
      const existing = new Set(prev.map((f) => f.path));
      const fresh = files.filter((f) => f.path && !existing.has(f.path));
      return [...fresh, ...prev];
    });
  };

  const handleNewFiles = async (files) => {
    if (!files.length) return;
    setLoading(true);
    try {
      const withDurations = await bridge.getDurations(files);
      addFiles(withDurations);
    } catch (err) {
      setError(String(err?.message || err));
    } finally {
      setLoading(false);
    }
  };

  const onDrop = useCallback((acceptedFiles) => {
    const files = acceptedFiles
      .map((file) => ({ name: file.name, path: bridge.getPathForFile(file) }))
      .filter((f) => f.path);
    handleNewFiles(files);
  }, []);

  const pickFiles = async () => {
    const files = await bridge.pickFiles();
    handleNewFiles(files);
  };

  // A whole folder, in natural order. New files go to the top of the list, so
  // reverse to keep the folder's own order reading top to bottom.
  const pickFolder = async () => {
    const res = await bridge.pickFolder?.({ defaultPath: inputDirectory });
    if (!res) return;
    if (res.dir) setInputDirectory(res.dir);
    if (!res.files.length) {
      if (res.dir) setError(loc.no_media_in_folder);
      return;
    }
    handleNewFiles([...res.files].reverse());
  };

  const addFolderButton = bridge.pickFolder ? (
    <button className="btn btn-success btn-sm btn-outline rounded-lg ms-2" onClick={pickFolder}>
      <FontAwesomeIcon icon={faFolderOpen} fixedWidth size="lg" />
      <span>{loc.add_folder}</span>
    </button>
  ) : null;

  // Deliberately no `accept`: react-dropzone would silently swallow anything
  // outside the list, and an extension is not evidence about a file's contents.
  // FFmpeg probes the bytes and is the only thing entitled to reject an input,
  // which it does with a message naming the file. The old five-extension list
  // rejected .opus, .webm, .mp4 and every video container that the bundled
  // FFmpeg had always been able to read.
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    noClick: true,
  });

  const openOutputDir = () => bridge.openOutputDir(outputDirectory);
  const clearFiles = () => setFilesToProcess([]);
  const deleteFile = (id) => setFilesToProcess((prev) => prev.filter((f) => f.path !== id));

  return (
    <div
      {...getRootProps()}
      className="card content-center items-center mb-3 mt-1 bg-base-100 rounded-lg p-2"
    >
      <input {...getInputProps()} />
      {filesToProcess?.length !== 0 ? (
        <div>
          <div className="flex flex-row justify-evenly my-2">
            <button className="btn btn-success btn-sm rounded-lg" onClick={pickFiles}>
              <FontAwesomeIcon icon={faAdd} fixedWidth size="lg" />
              <span>{loc.add}</span>
            </button>
            {addFolderButton}
            <button className="btn btn-success btn-sm btn-outline rounded-lg mx-2" onClick={openOutputDir}>
              <FontAwesomeIcon icon={faFolder} fixedWidth size="lg" />
              <span>{loc.open_out_dir}</span>
            </button>
            <button className="btn btn-error btn-sm btn-outline rounded-lg" onClick={clearFiles}>
              <FontAwesomeIcon icon={faTrashCan} fixedWidth size="lg" />
              <span>{loc.clear}</span>
            </button>
          </div>
          <div className="overflow-y-auto h-96">
            {filesToProcess.map((file) => (
              <FileItem
                key={file.path}
                id={file.path}
                name={file.name}
                duration={file.duration}
                mediaError={file.mediaError}
                deleteFile={deleteFile}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="border-2 border-dashed h-72 flex flex-col justify-center items-center w-full">
          <img className="opacity-10" src={textToSpeechImg} width="128" height="128" alt="" />
          {isDragActive ? (
            <p>{loc.drop_files_here}</p>
          ) : (
            <div>
              <p>{loc.drag_and_drop_or_click_select_button}</p>
              <p className="text-xs opacity-60 mt-1">{loc.supported_formats_hint}</p>
              <div className="flex flex-row items-center justify-center mt-2">
                <button className="btn btn-success btn-sm rounded-lg" onClick={pickFiles}>
                  <FontAwesomeIcon icon={faAdd} fixedWidth size="lg" />
                  <span>{loc.add}</span>
                </button>
                {addFolderButton}
                <button className="btn btn-success btn-sm btn-outline rounded-lg mx-2" onClick={openOutputDir}>
                  <FontAwesomeIcon icon={faFolder} fixedWidth size="lg" />
                  <span>{loc.open_out_dir}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const ProcessStats = () => {
  const {
    setProcessStarted, processStarted, totalFiles, numApiRequests,
    filesToProcess, outputDirectory, timePerClip, totalClipsInFile,
    apiKey, setError, setNumApiRequests, tmpDirectory,
  } = useContext(Context);

  const start = () => {
    if (!filesToProcess.length) return setError(loc.pleaseAddSomeFiles);
    if (!apiKey || apiKey === "null") return setError(loc.pleaseEnterApiKey);
    setNumApiRequests(0);
    setProcessStarted(true);
    bridge.start({ files: filesToProcess, token: apiKey, outputDir: outputDirectory, tmpDir: tmpDirectory });
  };
  const stop = () => {
    setProcessStarted(false);
    bridge.stop();
  };

  const eta = secondsToHHMMSS((timePerClip * totalClipsInFile * (totalFiles || 1)) / 1000)
    .split(":")
    .map((s) => Math.round(Number(s)));

  return (
    <div className="card">
      <div className="stats stats-horizontal shadow mb-1 rounded-lg flex">
        {!processStarted ? (
          <div className="stat items-center">
            <button className="btn btn-circle btn-success" onClick={start}>
              <FontAwesomeIcon icon={faPlayCircle} fixedWidth size="lg" className="text-accent-content" />
            </button>
            <div className="mt-2 text-lg font-bold">{loc.start}</div>
          </div>
        ) : (
          <div className="stat items-center">
            <button className="btn btn-circle btn-error" onClick={stop}>
              <FontAwesomeIcon icon={faStop} fixedWidth size="lg" />
            </button>
            <div className="mt-2 text-lg font-bold">{loc.stop}</div>
          </div>
        )}
        <div className="stat">
          <div className="stat-title">{loc.files}</div>
          <div className="text-lg font-bold">{totalFiles}</div>
        </div>
        <div className="stat">
          <div className="stat-title">{loc.estimated_time}</div>
          <div className="text-lg font-bold">{eta[0]} {loc.hour}</div>
          <div className="text-lg font-bold">{eta[1]} {loc.min}</div>
        </div>
        <div className="stat">
          <div className="stat-title">{loc.network}</div>
          <div className="stat-title">{loc.requests}</div>
          <div className="text-lg font-bold">{numApiRequests}</div>
        </div>
      </div>
    </div>
  );
};

const TitleBar = ({ closeApp, toggleModal, minimizeApp, openAbout }) => (
  <div className="flex flex-row justify-between items-center fixed top-0 bg-success w-full">
    <div className="flex flex-row justify-start items-center p-2">
      <button className="btn btn-ghost btn-square btn-error btn-sm" onClick={closeApp}>
        <FontAwesomeIcon icon={faPowerOff} fixedWidth size="lg" />
      </button>
      <button className="btn btn-ghost btn-square btn-error btn-sm" onClick={minimizeApp}>
        <FontAwesomeIcon icon={faMinus} fixedWidth size="lg" />
      </button>
      <button className="btn btn-ghost btn-square btn-sm mx-1" onClick={toggleModal}>
        <FontAwesomeIcon icon={faGear} fixedWidth size="lg" />
      </button>
      <button className="btn btn-ghost btn-square btn-sm" onClick={openAbout} title={loc.about}>
        <FontAwesomeIcon icon={faCircleInfo} fixedWidth size="lg" />
      </button>
    </div>
    <div className="title-bar top-1 text-base-100"> </div>
  </div>
);

const Progress = () => {
  const { currentClip, totalClipsInFile, step } = useContext(Context);
  let progressPercent = Math.round((currentClip / totalClipsInFile) * 100);
  if (!progressPercent || !Number.isFinite(progressPercent)) progressPercent = 0;
  return (
    <div>
      {step === 0 ? (
        <div
          className="radial-progress text-success font-bold ml-5 animate-spin"
          style={{ "--value": 50, "--thickness": "15px", "--size": "5rem" }}
        />
      ) : (
        <div
          className="radial-progress text-success font-bold ml-5"
          style={{ "--value": progressPercent, "--thickness": "15px", "--size": "5rem" }}
        >
          {progressPercent}%
        </div>
      )}
    </div>
  );
};

const FileStats = () => {
  const { currentFile, currentClip, totalClipsInFile, step, currentSubtitle } = useContext(Context);
  return (
    <div className="card bg-base-100 shadow-xl p-3 rounded-lg">
      <div className="text-sm">{currentFile?.name || currentFile}</div>
      <div className="flex flex-row justify-between items-center">
        <div className="w-1/3">
          <Progress />
        </div>
        <div className="w-2/3">
          <ul className="steps steps-vertical">
            <li className={`step step-${step === 0 ? "success" : "neutral"}`}>
              <div className="text-l">{loc.split_audio_files}</div>
            </li>
            <div className="font-bold text-xl">{totalClipsInFile}</div>
            <li className={`step step-${step === 1 ? "success" : "neutral"}`}>
              <div className="text-l">{loc.upload_to_server}</div>
            </li>
            <div className="font-bold text-xl">{totalClipsInFile} / {currentClip}</div>
          </ul>
        </div>
      </div>
      <div className="whitespace-pre-wrap break-words">{currentSubtitle}</div>
    </div>
  );
};

/** Sound-wave mark: seven bars, as on the app icon. */
const WaveMark = () => (
  <svg width="56" height="56" viewBox="0 0 56 56" aria-hidden="true">
    <circle cx="28" cy="28" r="28" fill="#5ec4a0" opacity="0.12" />
    {[10, 20, 30, 38, 30, 20, 10].map((h, i) => (
      <rect key={i} x={12.7 + i * 5} y={28 - h / 2} width="2.6" height={h} rx="1.3" fill="#5ec4a0" />
    ))}
  </svg>
);

/** Drawn as text rather than an image so it carries the app's own name
 * (the old splash.png still read "المفرغ") and follows the interface language. */
const SplashScreen = () => (
  <div className="App justify-center items-center flex">
    <div
      className="flex flex-col items-center justify-center gap-1 rounded-2xl"
      style={{ width: 480, height: 250, background: "#eeeeee", color: "#111" }}
    >
      <WaveMark />
      <div style={{ fontSize: 72, fontWeight: 700, lineHeight: 1.15 }} lang="ar" dir="rtl">
        صدى
      </div>
      <div style={{ fontSize: 14, letterSpacing: 5, opacity: 0.55 }} lang="en" dir="ltr">
        SADA
      </div>
      <div style={{ fontSize: 18 }}>{loc.tagline}</div>
    </div>
  </div>
);

const App = () => {
  const [modal, setModal] = useState(false);
  const [about, setAbout] = useState(false);
  const [welcome, setWelcome] = useState(false);
  const [welcomeHelp, setWelcomeHelp] = useState(false);
  const [appReady, setAppReady] = useState(false);
  const [appInfo, setAppInfo] = useState(null);
  const ctx = useContext(Context);
  const currentFileNameRef = useRef("");

  useEffect(() => {
    bridge.appInfo?.().then(setAppInfo).catch(() => {});

    const off = bridge.onProgress((event, payload) => {
      switch (event) {
        case "numberOfClips":
          ctx.setTotalClipsInFile(payload);
          break;
        case "clipCreated":
          ctx.setTotalClipsInFile((n) => n + 1);
          break;
        case "APIHit":
          ctx.setNumApiRequests((n) => n + 1);
          break;
        case "currentClip":
          ctx.setCurrentClip(payload);
          break;
        case "currentFile":
          currentFileNameRef.current = payload?.name || "";
          ctx.setCurrentFile(payload);
          break;
        case "timePerClip":
          ctx.setTimePerClip(payload);
          break;
        case "step":
          if (payload === 0) {
            ctx.setTotalClipsInFile(0);
            ctx.setCurrentClip(0);
          }
          ctx.setStep(payload);
          break;
        case "currentSubtitle":
          ctx.setCurrentSubtitle(payload);
          break;
        case "fileComplete": {
          const name = currentFileNameRef.current;
          if (name) ctx.setFilesToProcess((prev) => prev.filter((f) => f.name !== name));
          break;
        }
        case "processComplete":
          ctx.setProcessStarted(false);
          ctx.resetStats();
          break;
        case "error":
          ctx.setError(payload);
          break;
        default:
          break;
      }
    });

    const t = setTimeout(() => setAppReady(true), 1500);
    return () => {
      off?.();
      clearTimeout(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  loc.setLanguage(ctx.interfaceLanguage || "ar");

  // Wait for the splash to clear so the guide is the first thing on screen
  // rather than something that appears behind it.
  useEffect(() => {
    if (appReady && !ctx.apiKey) setWelcome(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appReady]);

  if (!appReady) return <SplashScreen />;

  return (
    <div
      className="App bg-neutral-content text-accent-content"
      data-theme={ctx.theme === "dark" ? "dark" : "light"}
      dir={ctx.interfaceLanguage === "en" ? "ltr" : "rtl"}
    >
      {welcome && (
        <WelcomeModal
          onClose={() => {
            setWelcome(false);
            setWelcomeHelp(false);
          }}
          onOpenHelp={() => setWelcomeHelp(true)}
        />
      )}
      {welcomeHelp && <TokenHelpModal onClose={() => setWelcomeHelp(false)} zClass="z-[80]" />}
      {modal && <SettingsModal toggleModal={() => setModal(!modal)} appInfo={appInfo} />}
      {about && <AboutModal onClose={() => setAbout(false)} appInfo={appInfo} />}
      {ctx.loading && <LoadingModal />}
      {ctx.error && <MessageModal />}
      <section className="z-0 bg-success" />
      <TitleBar
        closeApp={() => bridge.quit()}
        toggleModal={() => setModal(!modal)}
        minimizeApp={() => bridge.minimize()}
        openAbout={() => setAbout(true)}
      />
      <div className="mx-5 pt-16">
        <ProcessStats />
        <FileStats />
        <MyDropzone />
      </div>
    </div>
  );
};

export default App;
