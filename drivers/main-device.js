const Homey = require('homey');
const { sleep, calcCrow } = require('../lib/helpers');

module.exports = class mainDevice extends Homey.Device {
    async onInit() {
		this.homey.app.log('[Device] - init =>', this.getName());
        this.homey.app.setDevices(this);

        this._niuClient = this.homey.app.getNiuClient();

        await this.checkCapabilities();
        await this.setCapabilityValues();

        this.registerCapabilityListener('locked', this.onCapability_locked.bind(this));

        await sleep(2000);
        const { REFRESH } = this.homey.app.getSettings();
        const REFRESH_INTERVAL = 1000 * (REFRESH * 60);
        
        this.homey.app.log(`[Device] ${this.getName()} - onPollInterval =>`, REFRESH, REFRESH_INTERVAL);

        this.onPollInterval = setInterval(this.setCapabilityValues.bind(this), REFRESH_INTERVAL);
    }

    onDeleted() {
        if( this.onPollInterval ) {
          clearInterval(this.onPollInterval);
        }
    }

    async checkCapabilities() {
        const driverManifest = this.driver.manifest;
        const driverCapabilities = driverManifest.capabilities;
        
        const deviceCapabilities = this.getCapabilities();

        this.homey.app.log(`[Device] ${this.getName()} - Found capabilities =>`, deviceCapabilities);
        
        if(driverCapabilities.length > deviceCapabilities.length) {      
            await this.updateCapabilities(driverCapabilities);
        }

        return deviceCapabilities;
    }

    async updateCapabilities(driverCapabilities) {
        this.homey.app.log(`[Device] ${this.getName()} - Add new capabilities =>`, driverCapabilities);
        try {
            driverCapabilities.forEach(c => {
                this.addCapability(c);
            });
            await sleep(2000);
        } catch (error) {
            this.homey.app.log(error)
        }
    }

    async setCapabilityValues() {
        const { device_sn } = this.getData();
        this.homey.app.log(`[Device] ${this.getName()} - setCapabilityValues`);

        try {    
            const getBatteryInfo = await this._niuClient.getBatteryInfo({sn: device_sn});
            const getMotorInfo = await this._niuClient.getMotorInfo({sn: device_sn});
            const {batteryCharging, temperature, energyConsumedTody, gradeBattery} = getBatteryInfo.batteries.compartmentA;
            const {lockStatus, isCharging, estimatedMileage, postion} = getMotorInfo;

            this.homey.app.log(`[Device] ${this.getName()} - getBatteryInfo =>`, getBatteryInfo);
            this.homey.app.log(`[Device] ${this.getName()} - getMotorInfo =>`, getMotorInfo);
            
            await this.setCapabilityValue('measure_battery', parseInt(batteryCharging));
            await this.setCapabilityValue('measure_temperature', parseInt(temperature));
            await this.setCapabilityValue('measure_mileage', parseInt(estimatedMileage));
            await this.setCapabilityValue('measure_consumed_today', parseInt(energyConsumedTody));
            await this.setCapabilityValue('measure_health', parseInt(gradeBattery));
            await this.setCapabilityValue('measure_is_charging', isCharging === 1);
            await this.setCapabilityValue('locked', lockStatus === 0);
            await this.setLocation(postion);
            await this.setAvailable();
        } catch (error) {
            this.setUnavailable(err)
            this.homey.app.log(error);
        }
    }

    async setLocation(postion) {
        try {
            const HomeyLat = this.homey.geolocation.getLatitude();
            const HomeyLng = this.homey.geolocation.getLongitude();
            const setLocation = calcCrow(HomeyLat, HomeyLng, postion.lat, postion.lng);

            this.homey.app.log(`[Device] ${this.getName()} - setLocation =>`, setLocation);
            await this.setCapabilityValue('measure_is_home', setLocation <= 1);
        } catch (error) {
            this.homey.app.log(error);
        }
    }

    async onCapability_locked() {
        try {
            throw new Error('(Un)Locking not possible');
        } catch (e) {
            this.homey.app.error(e);
            return Promise.reject(e);
        }
    }
}