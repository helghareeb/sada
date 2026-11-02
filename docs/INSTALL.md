# 📥 Installing Sada

**[بالعربية ←](INSTALL.ar.md)**

This page is written for people who just want the app to work. No terminal, no
setup, nothing to install alongside it. If you can install WhatsApp, you can
install Sada. 🙂

Everything Sada needs is **inside the download** — including FFmpeg, the media
engine that reads your files. There is no second thing to install, ever.

---

## 1️⃣ Pick your file

All downloads live on the **[Releases page](https://github.com/helghareeb/sada/releases/latest)**.
Take one file:

| Your computer | Download this | Size |
|---|---|---|
| 🪟 **Windows** | `Sada-Setup-1.2.0.exe` | ~110 MB |
| 🪟 Windows, no install (USB stick) | `Sada-Portable-1.2.0.exe` | ~110 MB |
| 🍎 **Mac — M1/M2/M3/M4** | `Sada-1.2.0-mac-arm64.dmg` | ~115 MB |
| 🍎 **Mac — older Intel** | `Sada-1.2.0-mac-x64.dmg` | ~115 MB |
| 🐧 **Ubuntu / Mint / Debian** | `Sada-1.2.0-amd64.deb` | ~110 MB |
| 🐧 **Fedora / openSUSE** | `Sada-1.2.0-x86_64.rpm` | ~110 MB |
| 🐧 Any other Linux | `Sada-1.2.0-x86_64.AppImage` | ~155 MB |

*(`1.2.0` is the version number — it changes with each release.)*

> 🍎 **Not sure which Mac you have?** Click the  menu (top-left) → **About This
> Mac**. If it says **Apple M1/M2/M3/M4**, take `arm64`. If it says **Intel**,
> take `x64`. Taking the wrong one is not dangerous — the app simply won't open.

---

## 2️⃣ Install it

### 🪟 Windows

1. Double-click **`Sada-Setup-1.2.0.exe`**.
2. Choose your language — **العربية** or **English**. 🌍
3. **You will see a blue warning: "Windows protected your PC."** This is
   expected. Click **More info**, then **Run anyway**.
4. Follow the installer. Sada lands in your Start Menu with a desktop shortcut.

> **Why the warning?** ⚠️ Windows shows it for any program without a paid
> code-signing certificate (about $300–500 a year). Sada is free and has none.
> The warning is about a missing receipt, not about anything found in the file.
> If you would rather not click through it, use the **Portable** version — it
> runs without installing.

**To uninstall:** Start Menu → *Sada* → *Uninstall Sada*, or Settings → Apps.
Your saved token and settings are kept in case you reinstall.

### 🍎 macOS

1. Open the **`.dmg`** you downloaded.
2. Drag the **Sada** icon onto the **Applications** folder shown beside it.
3. **The first time you open it, do NOT double-click.** Instead:
   **right-click** (or Control-click) the Sada icon in Applications →
   **Open** → **Open** in the dialog that appears.
4. After that first time, it opens normally like any other app.

> **If macOS says "Sada is damaged and can't be opened"** 🩹 — it isn't. macOS
> marks every unsigned app downloaded from the internet this way. Open the
> **Terminal** app and paste this one line, then press Enter:
>
> ```bash
> xattr -dr com.apple.quarantine /Applications/Sada.app
> ```
>
> Then open Sada normally. You only ever do this once.

> **Why?** ⚠️ Apple only trusts apps signed with a paid Apple Developer account
> ($99/year). Sada is free and community-built. Nothing is wrong with the file —
> and you can always verify it yourself by building from source.

**To uninstall:** drag `Sada` from Applications to the Trash.

### 🐧 Linux

**Ubuntu, Linux Mint, Debian, Pop!_OS — use the `.deb`:**

Double-click the file and your software centre will install it. Or, in a
terminal:

```bash
sudo apt install ./Sada-1.2.0-amd64.deb
```

**Fedora, openSUSE, RHEL — use the `.rpm`:**

```bash
sudo dnf install ./Sada-1.2.0-x86_64.rpm
```

Either way, Sada appears in your applications menu (as **صدى** if your desktop
is in Arabic 🌍). Everything it needs is installed with it.

**Any other distribution — use the `.AppImage`:**

```bash
chmod +x Sada-1.2.0-x86_64.AppImage
./Sada-1.2.0-x86_64.AppImage
```

> 💡 On Ubuntu 22.04 and newer, AppImages need one library that is no longer
> installed by default. If nothing happens when you run it:
> ```bash
> sudo apt install libfuse2
> ```
> Prefer the `.deb` if you are on Ubuntu — it has no such requirement.

**To uninstall:** `sudo apt remove sada` (or `sudo dnf remove sada`). For the
AppImage, just delete the file.

---

## 3️⃣ First run: one free key 🔑

Sada uses **Wit.ai**, Meta's speech service. It is **free**, there is no paid
tier, and your key stays on your own computer.

When you first open Sada it shows you a short welcome with everything below —
you can paste your key straight into it.

1. Go to **[wit.ai](https://wit.ai)** and sign in with a free Meta account.
2. Create a new **App**, and set its language to **Arabic**. 🗣️
3. Open that app's **Settings** (the ⚙️ gear icon).
4. Copy the **Server Access Token**. ⚠️ *Not* the Client token — they look
   alike and only the Server one works.
5. Paste it into Sada and press **Save**.

That's the whole setup. It takes about two minutes and you never do it again.

---

## 4️⃣ Using it 🎧

1. **Drag your files** onto the window — or click **Add**.
2. Press **Start** ▶️.
3. When it finishes, click **Open folder** to find your `.srt` subtitles and
   `.txt` transcript next to each other.

**What files can I use?** Practically anything: 🎵 voice notes from WhatsApp
(`.opus`), iPhone recordings (`.m4a`, `.mov`), Android recordings (`.amr`,
`.3gp`), `.mp3`, `.wav`, `.flac`, `.wma`, and video files like `.mp4`, `.mkv`,
`.avi`, `.webm` — Sada pulls the sound out of video for you. You never need to
convert anything first. ([full details](FORMATS.md))

---

## 🆘 If something goes wrong

| What you see | What it means |
|---|---|
| "Windows protected your PC" | Normal. **More info** → **Run anyway**. See above. |
| "Sada is damaged and can't be opened" (Mac) | Normal for unsigned apps. Run the `xattr` line above. |
| Nothing happens when I run the AppImage | Install `libfuse2`, or use the `.deb`. |
| "Please enter your Wit.ai token" | Step 3 above — you need the free key. |
| A file has a red ⚠️ next to it | That file has no sound in it. If it came from a video downloader, pick a row that is **not** marked "video only". ([why](FORMATS.md)) |
| It's slow | Normal. Transcription runs in real time-ish and is paced to stay inside Wit.ai's free limits. A one-hour recording takes a while — leave it running. |

Still stuck? Open an issue at
**[github.com/helghareeb/sada/issues](https://github.com/helghareeb/sada/issues)** —
in Arabic or English, both are welcome. 🤝

---

## 🔒 A note on privacy

Your Wit.ai token and your files stay on your computer. Sada sends short audio
clips to Wit.ai to be transcribed — that is how the transcription happens — and
nothing else is collected, uploaded, or tracked. There is no account, no
telemetry, and no server of ours in between.
