const functions = require('firebase-functions');

const { dialogflow, SignIn, Permission, BasicCard, Button } = require('actions-on-google');
const CREDENTIAL = { clientID: '562991921054-t9dej66lmq315pcn90fktaaadrdkg4u7.apps.googleusercontent.com' };
const app = dialogflow({ debug: true, clientId: CREDENTIAL.clientID });
const admin = require('firebase-admin');
var serviceAccount = require("./servicekey.json");
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://weather-21368.firebaseio.com"
});

const db = admin.firestore();
const settings = { timestampsInSnapshots: true };
db.settings(settings);

const Register = require('./register.js');
const Game = require('./game.js');

const weather = require('weather-js');

const Weather = require('./weather.js');


// google API で lat long -> zipcodeに変換したら、gooole home, google asisstnatで天気がきける！

app.intent('Default Welcome Intent', async (conv, params, raw) => {

    // conv.user.last.seen = '';
    const seen = conv.user.last.seen;
    const payload = conv.user.profile.payload;

    if (!seen) {
        conv.ask('こちら宇宙人撃退本部。連絡ありがとう、君は射撃で有名らしいな。もう既に聞いたかと思うが、肉眼では見えないUFOや宇宙人が地球を荒らしている。君の力が必要だ。');
        // 効果音をここに追加　爆発するような音
        conv.ask('まずい！！宇宙人が出現した！！時間がない、今直ぐ本部に君の情報を共有して身分証明証を発行してほしい。いいか？');
        conv.contexts.set('helpyesnocontext', 100);
        return;
    }

    if (!payload) {
        conv.ask('まだ本部にアカウント情報が送信されていないみたいだ。');
        conv.ask('今直ぐにサインインをして身分証明証を発行して欲しい。いいか？');
        conv.contexts.set('helpyesnocontext', 5);
        return;
    }

    const register = new Register(conv);
    const user = await register.fetch();
    console.log(JSON.stringify(user));

    const game = new Game(conv);
    const bulletStatus = await game.getBullet();

    if (user.done) {
        const name = user.name;
        const randomCity = shuffle(['東京', '名古屋', '千葉', '大阪', '沖縄'])[0];
        const msgs = [
            `${randomCity}で宇宙人が多く出現しているとの報告を受けた。もしかしたら君の場所でも宇宙人が出現しやすい天候かもしれない`, 
            `${randomCity}で宇宙人の確認が出現するかもしれない。君の場所に出現するかもしれない`,
            `${randomCity}で負傷者がでた。要注意が必要だ`,
        ]
        
        const welcomeMsg = shuffle(msgs)[0];

        console.log("Bullet Runout --> ", bulletStatus["runout"]);

        if (bulletStatus["runout"]) {
            conv.ask(`${name}、ミサイルがなくなったみたいだな。ミサイル補充だな？`);
            conv.contexts.set('searchweather', 5);
            // conv.contexts.set('missileyesnocontext', 5);
            conv.contexts.set('morebulletcontext', 5);
        } else {
            conv.ask(`${name}、${welcomeMsg}。そこの天気を調べる、今の位置情報を教えてくれ。`);
            conv.contexts.set('searchweather', 5);
        }
    } else {
        register.done();
        await game.initScore();
        await game.supplyBullet();
        conv.close('本部から手続きの確認が取れたとの報告がきた。これからは天気と宇宙人の出現情報が本部から共有される。定期的にコンタクトを取るように。宇宙人の出現報告が出た時は、落ち着いて倒すのだ。幸運を祈る。')
    }
})

// app.intent('MissileYesNoIntent', async (conv, params) => {
//     conv.ask('応援の要請、ミサイル補充、今の天候、なにを聞きたい？');
//     // conv.contexts.set('searchweather', 5);
// })

app.intent('MoreBulletIntent', async (conv, params) => {
    const game = new Game(conv);
    await game.supplyBullet();
    conv.close("ミサイル補充隊が向かっている。すぐにミサイルが補充される。引き続きよろしく頼む。")
})

app.intent('SearchWeatherIntent', async (conv, params) => {

    const given_name = conv.user.profile.payload.given_name;
    const city = conv.contexts.get('searchweather').parameters.location.city;

    conv.contexts.delete('searchweather');

    console.log(city);

    const game = new Game(conv);
    let alienNumber;// random

    // const weather = await requestWeather(city);

    if (weather.length <= 0) {
        conv.ask('場所を取得できなかった。今どこにいる？もう一度言ってくれ。');
        conv.contexts.set('searchweather', 5);
        return;
    }

    // const current = weather[0].current;
    const conditions = ["Mostly Sunny", "Cloudy", "Partly Cloudy", "Sunny", "Clear", "Mostly Clear", "Mostly Cloudy", "Partly Sunny", "Light Rain"]
    // const sky = current['skytext'];
    const sky = shuffle(conditions)[0];

    let skytext = '';

    switch (sky) {
        case "Mostly Sunny":
            skytext = "ほぼ晴れ";
            alienNumber = 40
            break;
        case "Cloudy":
            skytext = "曇り";
            alienNumber = 120
            break;
        case "Partly Cloudy":
            skytext = "晴れのち曇り";
            alienNumber = 60
            break;
        case "Sunny":
            skytext = "晴れ";
            alienNumber = 10
            break;
        case "Clear":
            skytext = "雲1つない快晴";
            alienNumber = 10
            break;
        case "Mostly Clear":
            skytext = "ほぼ快晴";
            alienNumber = 20
            break;
        case "Mostly Cloudy":
            skytext = "ほぼ曇り";
            alienNumber = 90
            break;
        case "Partly Sunny":
            skytext = "所により晴れ";
            alienNumber = 70
            break;
        case "Light Rain":
            skytext = "小雨";
            alienNumber = 50
            break;
        default:
            skytext = current.skytext;
            break
    }

    // const temp = current['temperature'];
    const temp = shuffle([0, 1, 2, 3, 4])[0];

    // console.log(skytext, temp);

    await game.shouldGo(alienNumber);

    let phrase = [];
    if (alienNumber === 0) {
        phrase = ['宇宙人はいないみたいだ', 'いなさそうだ', '大丈夫そうだ、いなさそうだ。'];
    } else {
        phrase = ['もしかしたら宇宙人がいるかもしれない', 'かなりいるかもしれない', '少しいるみたいだ。倒そう'];
    }

    const w = new Weather(conv);
    await w.add(city, skytext, temp);

    conv.close(`${given_name}, 今日は${temp}度。${skytext}みたいだな。${phrase[0]}。地球を救ってくれ。幸運を祈る。`);
})

app.intent('HelpYesNoIntent', async (conv, params) => {
    const okaytohelp = conv.contexts.get('helpyesnocontext').parameters.helpyesno === 'はい' ? true : false
    if (okaytohelp) {
        conv.contexts.delete('helpyesnocontext');
        conv.ask(new SignIn('アカウント情報を取得するため'));
    } else {
        conv.ask('俺たちは宇宙人と戦っているんだぞ。協力するよな？');
    }
})

app.intent('GetLocationIntent', async (conv, params, confirmationGranted) => {

    const given_name = conv.user.profile.payload.given_name;

    console.log(JSON.stringify(conv.user));

    if (confirmationGranted) {
        await aliensBattleWithWeather(conv);
    } else {
        const game = new Game(conv);
        const alienNumber = 10; // random
        await game.shouldGo(alienNumber);
        let phrase;
        if (alienNumber === 0) {
            phrase = ['もしかしたら宇宙人がいるかもしれない', 'かなりいるかもしれない', '少しいるみたいだ。倒そう'];
        } else {
            phrase = ['もしかしたら宇宙人がいるかもしれない', 'かなりいるかもしれない', '少しいるみたいだ。倒そう'];
        }
        await game.stayAlert();
        conv.close(`${given_name}, ${phrase[0]}。みたいだ。`);
    }
});

app.intent('SignIntent', async (conv, params, signin) => {

    if (signin.status != 'OK') {
        conv.ask('エラーが発生した。');
        return;
    }

    const register = new Register(conv);
    await register.register();

    conv.close(`本部に君の情報を送信した。曇り空の日にはUFOがよく出現すると言われている。本部に連絡を取ると周辺の天気情報が取得できる。`);
    conv.close('よし、次に、戦うために必要な武器をAppStoreに用意した。そこに入隊契約書も入っている、よく読んでくれ。手続きはこの下のリンクからいける。同じアカウントを使用して身分を証明するように。準備が終わったら、また直ぐに連絡をしてくれ。');

    conv.close(new BasicCard({
        text: 'アプリ名' + '\n\n',
        buttons: new Button({
            title: 'App Store Link',
            url: 'https://github.com/kboy-silvergym/ARKit-Emperor',
        })
    }));

})



exports.weather = functions.https.onRequest(app);

// 外部APIに繋がっているため、データを取得することができない。

function requestWeather(city) {
    return new Promise(function (resolve, reject) {
        weather.find({ search: city, degreeType: 'C' }, function (err, result) {
            console.log('WEATHER FIND');
            console.log(JSON.stringify(result));
            if (err) {
                reject(err);
            } else {
                resolve(result);
            }
        });
    })
}

function requestPermission(conv) {
    // UNSPECIFIED_PERMISSION, DEVICE_PRECISE_LOCATION, DEVICE_COARSE_LOCATION, UPDATE
    const options = {
        context: '宇宙人対峙に必要な天気情報を取得するため',
        permissions: ['NAME', 'DEVICE_PRECISE_LOCATION', 'DEVICE_COARSE_LOCATION'],
    };
    conv.ask(new Permission(options));
}


function shuffle(array) {
    var currentIndex = array.length, temporaryValue, randomIndex;
  
    // While there remain elements to shuffle...
    while (0 !== currentIndex) {
  
      // Pick a remaining element...
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex -= 1;
  
      // And swap it with the current element.
      temporaryValue = array[currentIndex];
      array[currentIndex] = array[randomIndex];
      array[randomIndex] = temporaryValue;
    }
  
    return array;
  }
  