const path = require("path");
const https = require("https");
const { app, BrowserWindow, dialog, shell } = require("electron");

let controlPanelWindow;
let mainScoreboardWindow;

/**
 * CREATE WINDOWS
 */
function createWindows() {
  controlPanelWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    title: "Control Panel",
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  controlPanelWindow.loadFile(path.join(__dirname, "controlpanel.html"));

  mainScoreboardWindow = new BrowserWindow({
    width: 1200,
    height: 700,
    title: "Main Scoreboard",
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  mainScoreboardWindow.loadFile(path.join(__dirname, "mainscoreboard.html"));

  controlPanelWindow.on("closed", () => {
    controlPanelWindow = null;
  });

  mainScoreboardWindow.on("closed", () => {
    mainScoreboardWindow = null;
  });

  // 🔔 Check for updates AFTER windows open
  checkForUpdates();
}

/**
 * MANUAL UPDATE CHECK
 */
function checkForUpdates() {
  const currentVersion = app.getVersion();
  const versionUrl =
    "https://raw.githubusercontent.com/rju23/School-Challenge-Quiz-Scoreboard/main/version.json";

  https
    .get(versionUrl, (res) => {
      let data = "";

      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          const remote = JSON.parse(data);

          if (isNewerVersion(remote.version, currentVersion)) {
            dialog
              .showMessageBox({
                type: "info",
                title: "Update Available",
                message: `A new version (${remote.version}) is available.\n\nYou are running ${currentVersion}.`,
                buttons: ["Download Update", "Later"],
                defaultId: 0
              })
              .then((result) => {
                if (result.response === 0) {
                  shell.openExternal(remote.downloadUrl);
                }
              });
          }
        } catch (err) {
          console.error("Version check failed:", err);
        }
      });
    })
    .on("error", (err) => {
      console.error("Update check error:", err);
    });
}

/**
 * VERSION COMPARISON
 */
function isNewerVersion(remote, local) {
  const r = remote.split(".").map(Number);
  const l = local.split(".").map(Number);

  for (let i = 0; i < r.length; i++) {
    if (r[i] > (l[i] || 0)) return true;
    if (r[i] < (l[i] || 0)) return false;
  }
  return false;
}

/**
 * APP LIFECYCLE
 */
app.whenReady().then(createWindows);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindows();
  }
});
