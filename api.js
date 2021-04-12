module.exports = {
    async login({ homey, body}) {
        return await homey.app.niuLogin( body );
    },
    async settings({ homey, body }){
        return homey.app.updateSettings( body );
    }
};