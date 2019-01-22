
const weather = require('weather-js');


// weather.find({search: '千葉県', degreeType: 'C'}, function(err, result) {
//     if(err) console.log(err);
//     console.log(JSON.stringify(result, null, 2));
//   });

async function requestWeather(city) {
    return new Promise(function (resolve, reject) {
        weather.find({ search: city, degreeType: 'C' }, function (err, result) {
            console.log('WEATHER FIND')
            console.log(JSON.stringify(result));
            if (err) {
                reject(err);
            } else {
                resolve(result);
            }
        });
    })
}

requestWeather('東京');