const mainDriver = require('../main-driver');

module.exports = class driver_U_SERIES extends mainDriver {
    deviceType() {
        return 'U-series';
    }
}