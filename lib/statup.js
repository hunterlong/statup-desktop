const {ipcRenderer} = require('electron')
var path = require('path')
var settings = require(path.join(__dirname, '/settings'))
var request = require('request');
var exec = require('child_process').exec
var os = require('os')
var statup = path.join(__dirname, '../bin/statup')
var statup_process;

const PORT = 3834;

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

function Start() {
    const { spawn } = require('child_process');
    statup_process = spawn(statup, ['--port', PORT, 'app']);

    statup_process.stdout.on('data', (data) => {
        console.log(`stdout: ${data}`);
    });

    statup_process.stderr.on('data', (data) => {
        console.log(`stderr: ${data}`);
    });

    statup_process.on('close', (code) => {
        console.log(`child process exited with code ${code}`);
    });
}


function OpenSettings() {
    console.log(settings)
    ipcRenderer.send("openSettings")
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
    ServiceDown: ServiceDown,
    PORT: PORT
}