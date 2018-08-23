// Modules to control application life and create native browser window
const {app, BrowserWindow, ipcMain, Tray, Notification} = require('electron')
var AutoLaunch = require('auto-launch');
const {autoUpdater} = require("electron-updater");
var log = require('electron-log');
var path = require('path')
var url = require('url')
app.dock.hide()

var statup = require(path.join(__dirname, '/lib/statup'))

let tray = undefined
let window = undefined
let settingsWindow = undefined

let mainWindow

autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = "info";

statup.Start()

function createWindow () {
  // Create the browser window.
  mainWindow = new BrowserWindow({
      width: 995,
      height: 750,
      show: false,
      nodeIntegration: false
  })

    mainWindow.loadURL(url.format({
        pathname: path.join(__dirname, '/lib/app.html'),
        protocol: 'file:',
        slashes: true
    }));

    setTimeout(function() {
        ShowNotification("Se33rvice Offline", "sokdksokdosww3")
    }, 3000)

  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    statup.Kill()
    mainWindow = null
  })
}


const createTray = () => {
    tray = new Tray(path.join(__dirname, 'assets/statup.png'))
    tray.on('right-click', toggleWindow)
    tray.on('double-click', toggleWindow)
    tray.on('click', function (event) {
        toggleWindow()

        // Show devtools when command clicked
        if (window.isVisible() && process.defaultApp && event.metaKey) {
            window.openDevTools({mode: 'detach'})
        }
    })
}


const createTrayWindow = () => {
    window = new BrowserWindow({
        width: 355,
        height: 480,
        show: false,
        frame: false,
        fullscreenable: false,
        resizable: false,
        transparent: true,
        webPreferences: {
            // Prevents renderer process code from not running when window is
            // hidden
            backgroundThrottling: false
        }
    })
    window.loadURL(`file://${path.join(__dirname, '/lib/tray.html')}`)

    // window.openDevTools({mode: 'detach'})
    // autoUpdater.checkForUpdates();

    window.on('blur', () => {
        if (!window.webContents.isDevToolsOpened()) {
            window.hide()
        }
    })
}


const toggleWindow = () => {
    if (window.isVisible()) {
        window.hide()
    } else {
        showWindow()
    }
}


const showWindow = () => {
    const position = getWindowPosition()
    window.setPosition(position.x, position.y, false)
    window.show()
    window.focus()
}


const getWindowPosition = () => {
    const windowBounds = window.getBounds()
    const trayBounds = tray.getBounds()

    // Center window horizontally below the tray icon
    const x = Math.round(trayBounds.x + (trayBounds.width / 2) - (windowBounds.width / 2))

    // Position window 4 pixels vertically below the tray icon
    const y = Math.round(trayBounds.y + trayBounds.height + 4)

    return {x: x, y: y}
}

ipcMain.on('show-window', () => {
    showWindow()
})

ipcMain.on('openSettings', () => {
    settingsWindow = new BrowserWindow({
        width: 500,
        height: 480,
        show: true
    })
    settingsWindow.loadURL(`file://${path.join(__dirname, '/lib/settings.html')}`)

    // tray.setToolTip(`${weather.currently.summary} at ${time}`)
    // tray.setImage(path.join(assetsDirectory, 'cloudTemplate.png'))
})


ipcMain.on('serviceDown', (info) => {
    tray.setToolTip("Service is down!")
    tray.setImage(path.join(__dirname, '/assets/statup-error.png'))
});

ipcMain.on('serviceUp', (info) => {
    tray.setImage(path.join(__dirname, '/assets/statup.png'))
});

function ShowNotification(text, body) {
    let myNotification = new Notification(text, {
        body: body
    })

    myNotification.show()

    myNotification.onclick = () => {
        console.log('Notification clicked')
    }
}

autoUpdater.on('checking-for-update', () => {
    log.info('Checking for update...');
})
autoUpdater.on('update-available', (info) => {
    ShowNotification("New Update Available", "Statup is downloading a new version of the application...")
})
autoUpdater.on('update-not-available', (info) => {
    log.info('Update not available.');
})
autoUpdater.on('error', (err) => {
    log.info('Error in auto-updater. ' + err);
})
autoUpdater.on('download-progress', (progressObj) => {
    let log_message = "Download speed: " + progressObj.bytesPerSecond;
    log_message = log_message + ' - Downloaded ' + progressObj.percent + '%';
    log_message = log_message + ' (' + progressObj.transferred + "/" + progressObj.total + ')';
    log.info(log_message);
})

autoUpdater.on('update-downloaded', (info) => {
    log.info('Update downloaded');
    ShowNotification("Statup Update Ready!", "To complete the update, restart Statup.")
});

ipcMain.on("quitAndInstall", (event, arg) => {
    autoUpdater.quitAndInstall();
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', function() {
    createTray()
    createTrayWindow()
    createWindow()
})

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd +
  app.quit()
})

app.on('activate', function () {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
