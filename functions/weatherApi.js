
var weather = require('weather-js');

class WeatherApi {
    constructor() { }

    fetch(search) {
        weather.find({search: search,degreeType:'C'}, function(err, result) {
            if (err) console.log(err);
            console.log(JSON.stringify(result, null, 2));
        });
    }
}

module.exports = WeatherApi;