const {ipcRenderer, app} = require('electron')
var path = require('path')
var settings = require(path.join(__dirname, '/settings'))
var request = require('request');
var os = require('os')
var statup_process;
const PORT = 8080;
var home
var statup = getPath()

function getPath() {
    let platform = os.platform()
    if (platform === 'darwin') {
        if (process.env.NODE_ENV === 'test') {
            return path.join(__dirname, '../bin/statup')
        } else {
            return path.join(process.resourcesPath, '/bin/statup')
        }
    }
}

function CheckServices() {
    request('http://www.google.com', function (error, response, body) {
        console.log('error:', error); // Print the error if one occurred
        console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received
        console.log('body:', body); // Print the HTML for the Google homepage.
    });
}

function Kill() {
    statup_process.kill()
}

function Start(location) {
    home = location
    let child_process = require('child_process').execFile;

    statup_process = child_process(statup, ['app', '--port', PORT], {
        env: {
            STATUP_DIR: home
        }
    })

    statup_process.stdout.on('data', (data) => {
        console.log(`stdout: ${data}`);
    });

    statup_process.stderr.on('data', (data) => {
        console.log(`stderr: ${data}`);
    });

    statup_process.on('close', (code) => {
        console.log(`statup process exited with code ${code}`);
    });

    setInterval(function(){
        CheckServices();
    },5*60*1000);
}


function OpenSettings() {
    console.log(settings)
    ipcRenderer.send("openSettings")
}

function Refresh() {
    ipcRenderer.send("refreshMain")
}

function CloseApp() {
    ipcRenderer.send("closeApp")
}

function ServiceDown() {
    ipcRenderer.send("serviceDown", {id: "okokok"})
}

function ServiceUp() {
    ipcRenderer.send("serviceUp", {id: "okokok"})
}

module.exports = {
    Start: Start,
    Check: CheckServices,
    Kill: Kill,
    OpenSettings: OpenSettings,
    Refresh: Refresh,
    CloseApp: CloseApp,
    ServiceDown: ServiceDown,
    PORT: PORT,
    path: getPath()
}
