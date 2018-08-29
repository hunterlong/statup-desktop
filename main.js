// Modules to control application life and create native browser window
const {app, BrowserWindow, ipcMain, Tray, shell} = require('electron')
// app.dock.hide()
var AutoLaunch = require('auto-launch');
const {autoUpdater} = require("electron-updater");
var log = require('electron-log');
var path = require('path')
var url = require('url')
var os = require('os')
var request = require('request');
const notifier = require('node-notifier');

var services = [];
log.transports.console.level = true;

var Statup = require(path.join(__dirname, '/src/js/statup'))
var statup = new Statup(app)

let tray = undefined
let window = undefined
let settingsWindow = undefined
let home
let mainWindow

autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = "info";

app.StatupLib = () => {
  return statup
}

app.Settings = () => {
  return statup.settings
}

function CheckServices() {
  log.warn(statup.settings)
  let secret = statup.settings.secret
  log.warn("checking with api: ", statup.URL()+"/api/services", secret)
    request({
        url : statup.URL()+"/api/services",
        headers : {
            "Authorization" : secret
        }
    }, function (error, response, body) {
        services = JSON.parse(body)
        CheckOnlineServices()
    });
}


function CheckOnlineServices() {
    services.forEach(function(service) {
        if (!service.online) {
            var notification = {title: "Service Offline", body: "Your service '"+service.name+"' is currently offline!"}
            log.warn(notification)

            // ShowNotification(notification.title, notification.body)

        }
    });
}


function createWindow () {
  // Create the browser window.
  mainWindow = new BrowserWindow({
      width: 995,
      height: 780,
      show: false,
      frame: false,
      fullscreenable: false,
      resizable: false,
      transparent: true,
      webPreferences: {
          backgroundThrottling: false
      }
  })

    log.info("statup path: ", statup.path)

    setTimeout(function() {
        mainWindow.loadURL(url.format({
            pathname: path.join(__dirname, '/src/html/app.html'),
            protocol: 'file:',
            slashes: true
        }));

    }, 2500)

    // mainWindow.openDevTools()

    mainWindow.onbeforeunload = (e) => {
        e.returnValue = false;
        mainWindow.hide()
    }

    mainWindow.on('ready-to-show', function () {
        // mainWindow.show()
        // mainWindow = null
        setInterval(function() {
          CheckServices();
        }, 30000)

    })

    mainWindow.on('minimized', function () {
        mainWindow.hide()
    })
}


function createSettingsWindow() {
    settingsWindow = new BrowserWindow({
        width: 600,
        height: 480,
        show: false,
        frame: false,
        fullscreenable: false,
        resizable: false,
        transparent: true,
        webPreferences: {
            backgroundThrottling: false
        }
    })
    settingsWindow.loadURL(`file://${path.join(__dirname, '/src/html/settings.html')}`)
}


function LoadTrayIcon() {
    var count = 1;
    setInterval(function(){
        if (count>7) {
            setTimeout(function() {
                tray.setImage(path.join(__dirname, 'images/statup.png'))
                return false;
            }, 1200)
            return false;
        }
        tray.setImage(path.join(__dirname, 'images/icons/'+count+'.png'))
        count++
    }, 250);
}


const createTray = () => {
    tray = new Tray(path.join(__dirname, 'images/statup.png'))
    tray.on('right-click', toggleWindow)
    tray.on('double-click', toggleWindow)
    tray.on('click', function (event) {
        toggleWindow()

        tray.setHighlightMode('selection')

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
            backgroundThrottling: false
        }
    })

    setTimeout(function() {
        window.loadURL(`file://${path.join(__dirname, '/src/html/tray.html')}`)
        // ShowNotification("Statup is Online", "Statup is currently monitoring your services, click the logo for more details.")
    }, 2500)

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

app.openApp = () => {
    mainWindow.show()
}

app.closeMain = () => {
    mainWindow.hide()
}

app.openSettings = () => {
    statup.LoadYaml()
    settingsWindow.show()
    // tray.setToolTip(`${weather.currently.summary} at ${time}`)
    // tray.setImage(path.join(assetsDirectory, 'cloudTemplate.png'))
}


app.closeSettings = () => {
    settingsWindow.hide()
    // tray.setToolTip(`${weather.currently.summary} at ${time}`)
    // tray.setImage(path.join(assetsDirectory, 'cloudTemplate.png'))
}


ipcMain.on('serviceDown', (info) => {
    tray.setToolTip("Service is down!")
    tray.setImage(path.join(__dirname, '/images/statup-error.png'))
});

ipcMain.on('serviceUp', (info) => {
    tray.setImage(path.join(__dirname, '/images/statup.png'))
});

app.refreshMain = () => {
    window.loadURL(`file://${path.join(__dirname, '/src/html/tray.html')}`)
    LoadTrayIcon()
}

app.closeApp = () => {
    statup.Kill()
    tray.destroy()
    app.quit()
}


app.openDataDir = () => {
    shell.openItem(home)
}


app.sendNotification = (info, data) => {
    ShowNotification(data.title, data.body)
}


app.openDock = (e, data) => {
   if (data.open) {
       app.dock.show()
   } else {
       app.dock.hide()
   }
}

function ShowNotification(text, body) {
    log.warn("new notification", text, body, path.join(__dirname, '/src/sounds/notification.wav'))

    notifier.notify({
      title: text,
      message: body,
      sound: 'Ping'
    });

    notifier.on('click', function(notifierObject, options) {
      // Triggers if `wait: true` and user clicks notification
    });
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
    home = app.getPath('userData')
    log.warn("path: ", home)
    log.warn("app is ready ", os.platform(), statup.path)
    statup.Start(home)
    createTray()
    createTrayWindow()
    createWindow()
    createSettingsWindow()
    LoadTrayIcon()
    log.info("app completed ready event")
})

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd +
  // statup.Kill()
  // app.quit()
    log.info("app has all windows closed")
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
