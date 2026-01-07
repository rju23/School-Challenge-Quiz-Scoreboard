const { app, BrowserWindow } = require('electron');
const path = require('path');

let controlPanelWindow;
let mainScoreboardWindow;

function createWindows() {
  // Control Panel Window
  controlPanelWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    title: "Control Panel"
  });

  controlPanelWindow.loadFile('controlpanel.html');

  // Main Scoreboard Window
  mainScoreboardWindow = new BrowserWindow({
    width: 1200,
    height: 700,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    title: "Main Scoreboard"
  });

  mainScoreboardWindow.loadFile('mainscoreboard.html');

  // Optional: Position windows side by side
  controlPanelWindow.setBounds({ x: 0, y: 0, width: 1000, height: 700 });
  mainScoreboardWindow.setBounds({ x: 1010, y: 0, width: 1200, height: 700 });

  // Handle window close
  controlPanelWindow.on('closed', () => { controlPanelWindow = null; });
  mainScoreboardWindow.on('closed', () => { mainScoreboardWindow = null; });
}

app.whenReady().then(createWindows);

// Quit when all windows are closed
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
