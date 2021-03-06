function onHomeyReady(Homey) {
    const _settingsKey = `com.niu.mobility.settings`;

    const initializeSettings = function (err, data) {
        if (err || !data) {
            document.getElementById('error').innerHTML = err;
            return;
        }

        document.getElementById('niu_user').value = data['USERNAME'];
        document.getElementById('niu_pass').value = data['PASSWORD'];
        document.getElementById('niu_token').value = data['TOKEN'];
        document.getElementById('niu_countrycode').value = data['COUNTRY_CODE'];

        setInterval(data);

        initSave(data);
        initClear(data);
    }

    // --------------------------------------------------------------

    Homey.get(_settingsKey, initializeSettings);
    Homey.on('settings.set', (key, data) => {
        if (key == _settingsKey) {
            Homey.get(_settingsKey, initializeSettings);
        }
    });

    Homey.ready();
}

function setInterval(data) {
    const refresh = document.getElementById('niu_refresh');
    for(let i = 0; i < refresh.options.length; i++) {
        if(refresh.options[i].value == `${data['REFRESH']}`) {
            refresh.options[i].selected = true;
        }
    }
}

function initSave(_settings) {
    document.getElementById('save').addEventListener('click', function (e) {
        const error = document.getElementById('error');
        const loading = document.getElementById('loading');
        const success = document.getElementById('success');
        const button = document.getElementById('save');

        const USERNAME = document.getElementById('niu_user').value;
        const PASSWORD = document.getElementById('niu_pass').value;
        const TOKEN = document.getElementById('niu_token').value;
        const REFRESH = parseInt(document.getElementById('niu_refresh').value);
        const COUNTRY_CODE = document.getElementById('niu_countrycode').value;

        const settings = {
            USERNAME,
            PASSWORD,
            TOKEN,
            REFRESH,
            COUNTRY_CODE
        }

        // ----------------------------------------------

        button.disabled = true;
        loading.innerHTML = '<i class="fa fa-spinner fa-spin fa-fw"></i>Logging in. Please wait until all fields are filled in.';
        error.innerHTML = "";
        success.innerHTML = "";

        if(USERNAME && PASSWORD) {
            Homey.api('PUT', '/login', settings, function (err, result) {
                console.log(result, err)
                if (result && result.error) {
                    error.innerHTML = result.error.message;
                    loading.innerHTML = "";
                    button.disabled = false;
                    return Homey.alert(result.error.message);
                } else {
                    button.disabled = false;
                    loading.innerHTML = "";
                    error.innerHTML = "";
                    success.innerHTML = "Saved. Logged in to Niu";
                }
            });
        } else {
            const error = 'Fill in USERNAME and PASSWORD.';
            Homey.alert(error);

            error.innerHTML = error;
            button.disabled = false;
            loading.innerHTML = "";
            success.innerHTML = "";
        }
        
    });
}


function initClear(_settings) {
    document.getElementById('clear').addEventListener('click', function (e) {
        error = document.getElementById('error');
        loading = document.getElementById('loading');
        success = document.getElementById('success');

        document.getElementById('niu_user').value = "";
        document.getElementById('niu_pass').value = "";
        document.getElementById('niu_token').value = "";
        document.getElementById('niu_countrycode').value = "";

        const settings = {
            USERNAME: "",
            PASSWORD: "",
            TOKEN: "",
            REFRESH: 30,
            COUNTRY_CODE: ""
        }

        setInterval(settings);

        Homey.api('PUT', '/settings', settings, function (err, result) {
            if (err) {
                error.innerHTML = err;
                loading.innerHTML = "";
                success.innerHTML = "";
                return Homey.alert(err);
            } else {
                loading.innerHTML = "";
                error.innerHTML = "";
                success.innerHTML = "Cleared & Saved.";
            }
        });
    });
}