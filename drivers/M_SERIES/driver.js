const mainDriver = require('../main-driver');

module.exports = class driver_M_SERIES extends mainDriver {
    deviceType() {
        return 'M-series';
    }
}