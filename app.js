"use strict";

const Homey = require("homey");
const niuCloudConnector = require("./lib/niu-cloud-connector");
// const { log } = require("./logger.js");

const _settingsKey = `${Homey.manifest.id}.settings`;
let _niuClient = undefined;

class App extends Homey.App {
  log() {
    console.log.bind(this, "[log]").apply(this, arguments);

    // if(this.appSettings && this.appSettings.SET_DEBUG) {
    //     return log.info.apply(log, arguments)
    // }
  }

  error() {
    console.error.bind(this, "[error]").apply(this, arguments);

    // if(this.appSettings && this.appSettings.SET_DEBUG) {
    //     return log.info.apply(log, arguments)
    // }
  }

  // -------------------- INIT ----------------------

  async onInit() {
    this.log(`${this.homey.manifest.id} - ${this.homey.manifest.version} started...`);

    await this.initSettings();

    this.log("onInit - Loaded settings", {...this.appSettings, 'USERNAME': 'LOG', PASSWORD: 'LOG'});
  }

  // -------------------- SETTINGS ----------------------

  async initSettings() {
    try {
      let settingsInitialized = false;
      this.homey.settings.getKeys().forEach((key) => {
        if (key == _settingsKey) {
          settingsInitialized = true;
        }
      });

      if (settingsInitialized) {
        this.log("initSettings - Found settings key", _settingsKey);
        this.appSettings = this.homey.settings.get(_settingsKey);
        
        if (!_niuClient) {
            _niuClient = await this.setNiuClient(this.appSettings);
        }

        if(this.appSettings.TOKEN) {
            this.log("initSettings - setSessionToken", this.appSettings.TOKEN);
            await _niuClient.setSessionToken({token: this.appSettings.TOKEN});
        }
        

        return;
      }

      this.log(`Initializing ${_settingsKey} with defaults`);
      this.updateSettings({
        USERNAME: "",
        PASSWORD: "",
        COUNTRY_CODE: "",
        TOKEN: ""
      });
    } catch (err) {
      this.error(err);
    }
  }

 updateSettings(settings) {
    this.log("updateSettings - New settings:",  {...settings, 'USERNAME': 'LOG', PASSWORD: 'LOG'});
    _niuClient = undefined;
    this.appSettings = settings;
    this.saveSettings();
  }

  saveSettings() {
    if (typeof this.appSettings === "undefined") {
      this.log("Not saving settings; settings empty!");
      return;
    }

    this.log("Saved settings.");
    this.homey.settings.set(_settingsKey, this.appSettings);
  }

  // -------------------- EUFY LOGIN ----------------------

  async niuLogin(data) {
    try {
      let settings = data;
      this.log("niuLogin - New settings:",  {...settings, 'USERNAME': 'LOG', PASSWORD: 'LOG'});
      this.log(`niuLogin - Found username and password. Logging in to Niu`);

      _niuClient = await this.setNiuClient(data);
      const token = await _niuClient.createSessionToken({account: settings.USERNAME, password: settings.PASSWORD, countryCode: settings.COUNTRY_CODE});

      if(token && token.result) {
          settings.TOKEN = token.result;
      }

      this.appSettings = settings;
      this.saveSettings();
      this.log("niuLogin - Loaded settings", {...this.appSettings, 'USERNAME': 'LOG', PASSWORD: 'LOG'});


      return;
    } catch (err) {
      this.error(err);
      return err;
    }
  }

  // ---------------------------- GETTERS/SETTERS ----------------------------------

  getSettings() {
    return this.appSettings;
  }

  async setNiuClient() {
    try {
      return new niuCloudConnector.Client();
    } catch (err) {
      this.error(err);
    }
  }

  getNiuClient() {
      return _niuClient;
  }

  setDevices(device) {
    _devices.push(device);
  }

  getDevices() {
      return _devices;
  }
}

module.exports = App;
