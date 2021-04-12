const mainDriver = require('../main-driver');

module.exports = class driver_N_SERIES extends mainDriver {
    deviceType() {
        return 'N-series';
    }
}