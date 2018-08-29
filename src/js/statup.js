const {
  ipcRenderer,
  shell
} = require('electron')
var path = require('path')
var os = require('os')
const PORT = 8080;
var home
var AutoLaunch = require('auto-launch');
const Store = require('electron-store');
const fs = require('fs');
const yaml = require('js-yaml');
let store = new Store();

class Statup {

  constructor(remote) {
    this.app = remote
    this.bin = this.getBin()
    this.settings = {
      connection: "local",
      url: "http://localhost:8080",
      key: "",
      secret: "",
      type: "sqlite",
      host: "localhost",
      port: "",
      username: "",
      password: "",
      onboot: false,
      notification: true
    }
    this.process = null
  }

  Save(name, value) {
    store.save(name, value)
    this.settings[name] = value
  }

  SaveSettings(arr) {
    store.set('saved', 'now');
    console.log(arr)
    console.log(arr.length)
    arr.forEach(function(set) {
      console.log("saving: ", set.name, set.value)
      store.set(set.name, set.value)
      this.settings[set.name] = set.value
    })
    return settings
  }


  ConfigPath() {
    return this.app.getPath("userData")
  }


  LoadYaml() {
    var self = this;
    let path = this.ConfigPath()
    fs.readFile(path + "/config.yml", 'utf8', function (err, data) {
      if (err) {
        return console.log(err);
      }
      var config = yaml.load(data)
      console.log(config.api_key)
      self.settings.key = config.api_key;
      self.settings.secret = config.api_secret;
      // store.set('connection', config.connection)
      // store.set('server', config.host)
      // store.set('port', config.port)
      // store.set('user', config.user)
      // store.set('password', config.password)
      // store.set('database', config.database)
      // store.set('key', config.api_key)
      // store.set('secret', config.api_secret)
      return self.settings
    });
  }



  Load() {
    this.settings.connection = store.get('connection')
    this.settings.host = store.get('host')
    this.settings.port = store.get('port')
    this.settings.key = store.get('key')
    this.settings.secret = store.get('secret')
    this.settings.onboot = store.get('onboot')
    return settings
  }


  getBin() {
    let platform = os.platform()
    if (platform === 'darwin') {
      if (process.env.NODE_ENV === 'test') {
        return path.join(__dirname, '../../bin/statup')
      } else {
        return path.join(process.resourcesPath, '/bin/statup')
      }
    } else if (platform === 'win32') {
      return path.join(process.resourcesPath, '/bin/statup')
    } else if (platform === 'linux') {
      return path.join(process.resourcesPath, '/bin/statup')
    }
  }


  OpenURL(url) {
    shell.openExternal(url)
  }

  Kill() {
    statup_process.kill()
  }

  Start(location) {
    home = location
    let child_process = require('child_process').execFile;

    this.process = child_process(this.bin, ['--port', PORT, 'app'], {
      env: {
        STATUP_DIR: home
      }
    })

    this.process.stdout.on('data', (data) => {
      // console.log(`stdout: ${data}`);
    });

    this.process.stderr.on('data', (data) => {
      // console.log(`stderr: ${data}`);
    });

    this.process.on('close', (code) => {
      // console.log(`statup process exited with code ${code}`);
    });

  }

  OpenSettings() {
    DockIcon(true)
    app.openSettings()
  }

  CloseSettings() {
    DockIcon(false)
    ipcRenderer.send("closeSettings")
  }

  Refresh() {
    ipcRenderer.send("refreshMain")
  }

  CloseApp() {
    DockIcon(false)
    ipcRenderer.send("closeApp")
  }

  CloseMainWindow() {
    DockIcon(false)
    ipcRenderer.send("closeMain")
  }

  OpenApp() {
    DockIcon(true)
    ipcRenderer.send("openApp")
  }

  ServiceDown() {
    ipcRenderer.send("serviceDown", {
      id: "okokok"
    })
  }

  ServiceUp() {
    ipcRenderer.send("serviceUp", {
      id: "okokok"
    })
  }

  OpenDataDirectory() {
    ipcRenderer.send("openDataDir")
  }

  DockIcon(show) {
    ipcRenderer.send("openDock", {
      open: show
    })
  }

  URL() {
    return "http://localhost:8080"
  }

  DeleteData() {
    this.Kill();
    var dir = this.ConfigPath();
    console.log(dir + "/statup.db")
    fs.unlinkSync(dir + "/statup.db");
    fs.unlinkSync(dir + "/config.yml");
    this.Start(dir)
  }

}

module.exports = Statup
