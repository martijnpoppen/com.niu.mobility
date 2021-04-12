const Homey = require('homey');
const { sleep, calcCrow } = require('../lib/helpers');

let _niuClient = undefined;

module.exports = class mainDevice extends Homey.Device {
    async onInit() {
		this.homey.app.log('[Device] - init =>', this.getName());
        this.homey.app.setDevices(this);

        _niuClient = this.homey.app.getNiuClient();

        await this.checkCapabilities();

        this.registerCapabilityListener('locked', this.onCapability_locked.bind(this));

        await this.setCapabilityValues();
        await this.setAvailable();
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
            const getBatteryInfo = await _niuClient.getBatteryInfo({sn: device_sn});
            const getMotorInfo = await _niuClient.getMotorInfo({sn: device_sn});
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
            await this.setCapabilityValue('locked', lockStatus === 1);
            await this.setLocation(postion);
        } catch (error) {
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