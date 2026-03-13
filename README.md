# Adaptive Practice

Adaptive Practice is an Obsidian community plugin that helps you practice and retain knowledge from your notes using spaced repetition and adaptive scheduling.

## Features

- Create practice items directly from your notes.
- Adaptive scheduling based on your performance.
- Tight integration with Obsidian’s native UI.
- Works fully offline inside your vault.

---

## Requirements

- Obsidian v1.0.0 or higher (desktop or mobile; desktop recommended for initial install).
- Node.js (LTS, v18+ recommended) for local builds.
- Git (for install via cloning).

---

## Installation

You can install this plugin in two main ways:

1. **Via Git clone + `npm install` (manual install)**
2. **Via the BRAT plugin (recommended for tracking this repo)**

### 1. Manual Installation (Git clone + npm)

This method is best if you want to develop, tweak, or inspect the source.

1. **Clone the repository**

   ```bash
   cd /path/to/your/vault/.obsidian/plugins
   git clone https://github.com/anuwup/adaptive-practice.git
   cd adaptive-practice
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Build the plugin**

   For a one-time production build:

   ```bash
   npm run build
   ```

   Or for development with watch:

   ```bash
   npm run dev
   ```

   After a successful build, you should have:

   - `main.js`
   - `manifest.json`
   - (optionally) `styles.css`

   at the root of the `adaptive-practice` plugin folder.

4. **Enable the plugin in Obsidian**

   - Open Obsidian.
   - Go to **Settings → Community plugins**.
   - Make sure **Safe mode** is turned off.
   - Select **Browse**, then **Installed plugins**.
   - Find **Adaptive Practice** and toggle it **on**.

---

### 2. Installation via BRAT (Beta Reviewers Auto-update Tester)

If you’d like Obsidian to automatically keep this plugin updated from a GitHub repo, you can use the [**BRAT**](https://obsidian.md/plugins?search=brat) plugin.

1. **Install BRAT**

   - In Obsidian, go to **Settings → Community plugins**.
   - Select **Browse**.
   - Search for **“BRAT”** (Beta Reviewers Auto-update Tester).
   - Install and enable **BRAT**.

2. **Add this plugin as a beta plugin in BRAT**

   - Open **Command palette** (**Cmd/Ctrl+P**) and run:
     - **“BRAT: Add a beta plugin for testing”**
   - When prompted for the GitHub repository, enter:

     ```text
     anuwup/adaptive-practice
     ```

     Replace `anuwup` with your actual GitHub username or organization.

3. **Enable the plugin**

   - BRAT will download the plugin into your vault.
   - Go to **Settings → Community plugins → Installed plugins**.
   - Enable **Adaptive Practice**.

4. **Auto-updates**

   - BRAT can periodically check for updates from the GitHub repo and update the installed plugin.
   - Configure BRAT’s update settings from **Settings → Community plugins → BRAT** as desired.

---

## Development

If you want to modify the plugin:

1. Make sure you are in the plugin directory:

   ```bash
   cd /path/to/your/vault/.obsidian/plugins/adaptive-practice
   ```

2. Run the dev build:

   ```bash
   npm run dev
   ```

3. After each change is built, reload Obsidian (or use **“Reload app without saving”** from the Command palette) to see the changes.

---

## Support & Feedback

- For bugs or feature requests, please open an issue on the GitHub repository.
- If you find this plugin useful, consider starring the repo to show support.

---
