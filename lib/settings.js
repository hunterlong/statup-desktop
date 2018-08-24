var AutoLaunch = require('auto-launch');
const Store = require('electron-store');
const store = new Store();

class Settings {
    constructor() {
        this.settings = {
            api: "",
        }
        this.Launcher = new AutoLaunch({
            name: 'Statup',
            path: '/Applications/Statup.app',
        });
    }
    static Save(set) {
        store.save('settings', JSON.stringify(set))
        this.settings = set
    }
    static Load(set) {
        let data = store.get('settings')
        this.settings = JSON.parse(data)
    }
    static All() {
        return this.settings
    }
    static EnableAutoLaunch() {
        this.Launcher.isEnabled()
            .then(function(isEnabled){
                if(isEnabled){
                    return;
                }
                this.Launcher.enable();
            })
            .catch(function(err){
                // handle error
            });
    }
    static EnableAutoLaunch(enable=true) {
        if (enable) {
            this.Launcher.enable();
        } else {
            this.Launcher.disable();
        }
    }
}

module.exports = new Settings()
