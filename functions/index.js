const functions = require('firebase-functions');

const { dialogflow, SignIn, Permission, BasicCard, Button, SimpleResponse } = require('actions-on-google');
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
const Assist = require('./assist.js');
const surface = require('./surface.js');

const ENDPOINT = 'https://weather-21368.firebaseapp.com';

// google API で lat long -> zipcodeに変換したら、gooole home, google asisstnatで天気がきける！
app.intent('Default Welcome Intent', async (conv, params, raw) => {

    const payload = conv.user.profile.payload;

    if (!payload) {
        conv.ask('こちら宇宙人撃退本部。もう既に聞いたかと思うが、肉眼では見えないUFOや宇宙人が地球を侵略しにきた。既に死傷者が出ている。');
        const url = ENDPOINT + '/explosion.mp3';
        const speech = `<speak><audio src="${url}"></audio>まずい！！宇宙人が出現した！！宇宙人を探して倒して欲しい、いいか？</speak>`;
        conv.ask(new SimpleResponse({ speech: speech, text: 'まずい！！宇宙人が出現した！！宇宙人を探して倒して欲しい、いいか？' }));
        conv.contexts.set('helpyesnocontext', 100);
        return;
    }

    const register = new Register(conv);
    const user = await register.fetch();
    console.log(JSON.stringify(user));

    const game = new Game(conv);
    const bulletStatus = await game.getBullet();

    if (user) {
        if (user.done) {
            const assist = new Assist();
            console.log("Bullet Runout --> ", bulletStatus["runout"]);
            if (bulletStatus["runout"]) {
                assist.getMissiles(conv);
                assist.assistAgain(conv)
            } else {
                assist.welcomeAssist(conv);
            }
        }
    } else {
        register.done();
        await game.initScore();
        await game.supplyBullet();
        conv.close('手続きの確認が取れた。宇宙人が出現したら落ち着いて倒そう。繰り返し言うが、悪天候の日には宇宙人が多く発生する。')
        // conv.close('天候は宇宙人の発生率に関係する、天気を気にするように。天気情報は本部にリクエスとすると取得できる。身の危険を感じたら援護する。また連絡をしてくれ。')
        const assist = new Assist();
        assist.weather(conv);
    }
})

app.intent('MoreBulletIntent', async (conv, params) => {
    const game = new Game(conv);
    await game.supplyBullet();
    conv.close("ミサイルを補充した。引き続き倒してくれ。");
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

    const conditions = ["Mostly Sunny", "Cloudy", "Partly Cloudy", "Sunny", "Clear", "Mostly Clear", "Mostly Cloudy", "Partly Sunny", "Light Rain"]
    const sky = shuffle(conditions)[0];

    let skytext = '';

    switch (sky) {
        case "Mostly Sunny":
            skytext = "ほぼ晴れ";
            alienNumber = 10
            break;
        case "Cloudy":
            skytext = "曇り";
            alienNumber = 18
            break;
        case "Partly Cloudy":
            skytext = "晴れのち曇り";
            alienNumber = 11
        case "Sunny":
            skytext = "晴れ";
            alienNumber = 3;
            break;
        case "Clear":
            skytext = "雲1つない快晴";
            alienNumber = 2;
            break;
        case "Mostly Clear":
            skytext = "ほぼ快晴";
            alienNumber = 5;
            break;
        case "Mostly Cloudy":
            skytext = "ほぼ曇り";
            alienNumber = 17;
            break;
        case "Partly Sunny":
            skytext = "所により晴れ";
            alienNumber = 8;
            break;
        case "Light Rain":
            skytext = "小雨";
            alienNumber = 18;
            break;
        default:
            skytext = current.skytext;
            break;
    }

    // const temp = current['temperature'];
    const temp = shuffle([0, 1, 2, 3, 4])[0];

    // console.log(skytext, temp);

    await game.shouldGo(alienNumber);

    let phrase = [];
    if (alienNumber === 0) {
        phrase = ['宇宙人は今近くにはいないみたいだ。', 'いなさそうだ。', '大丈夫そうだ、近くにはいなさそうだ。'];
    } else {
        phrase = ['宇宙人出現するかもしれない。', '周りに既にいるかもしれない。', '少しいるみたいだ。'];
    }

    const w = new Weather(conv);
    await w.add(city, skytext, temp);
    conv.close(`${given_name}, 今日は${temp}度。${skytext}。${phrase[0]}。レーダーに宇宙人が映ったら倒すのだ。`);
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
    console.log(JSON.stringify(conv.device));
    console.log(JSON.stringify(conv));

    if (confirmationGranted) {
        // await aliensBattleWithWeather(conv);
        conv.ask('はろ');
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
    };
});

app.intent('SignIntent', async (conv, params, signin) => {

    if (signin.status != 'OK') {
        conv.ask('エラーが発生した。');
        return;
    }

    const register = new Register(conv);
    await register.register();

    conv.close(`情報共有、ありがとう。曇りの日にはUFOがよく出現すると言われている。我々と連絡を取り周辺の天気情報が取得してくれ。`);
    if (surface.output(conv)) {
        conv.close('次に、戦うために必要なレーダーをAppStoreに用意した。君を管理するために、同じアカウントのメールアドレスを提出するように。手続きはこの下のリンクからいける。自分のメールアドレスを確認してから武器を入手してくれ。準備が終わったら、また直ぐに連絡を。');
        conv.close(new BasicCard({
            text: 'inradar' + '\n\n',
            buttons: new Button({
                title: 'inradarを入手 Link',
                url: 'https://github.com/kboy-silvergym/ARKit-Emperor',
            })
        }));
    } else {
        conv.close('次に、戦うために必要なレーダーをAppStoreに用意した。インレーダーというアプリだ。君を管理するために、同じアカウントのメールアドレスを提出するように。自分のメールアドレスを確認してから武器を入手してくれ。準備が終わったら、また直ぐに連絡を。');
    }
})

app.intent('NoInputIntent', async (conv, params) => {
    const repromptCount = parseInt(conv.arguments.get('REPROMPT_COUNT'));
    console.log(repromptCount)
    const payload = conv.user.profile.payload;
    if (repromptCount === 2) {
        conv.close('身の危険を感じたらまた連絡を。いつでも助ける準備ができている。')
        return;
    }

    if (payload) {
        const assist = new Assist();
        await assist.assist(conv);
        console.log('no input called');
    } else {
        console.log('no input called without payload');
    }
})

app.intent('YesNoBulletIntent', async (conv, parms) => {
    const game = new Game(conv);
    await game.noMissileNeeded(conv);
    const assit = new Assist();
    await assit.assistAgain(conv);
})

app.intent('OtherWeaponsIntent', async (conv, params) => {
    const game = new Game(conv);
    await game.swapWeapon();
    conv.ask('購入画面を確認してくれださい。')
    const assit = new Assist();
    await assit.assistAgain(conv);
})

app.intent('AircraftIntent', async (conv, params) => {
    const game = new Game(conv);
    await game.sendAircrafts();
    conv.ask('仲間が向かった。')
    const assit = new Assist();
    await assit.assistAgain(conv);
})

app.intent('StpoSpaceIntent', async (conv, params) => {
    const game = new Game(conv);
    await game.stopInvaders();
    conv.ask('相手の動きを止めた。10秒だけだ、急いで倒せ。');
    const assit = new Assist();
    await assit.assistAgain(conv);
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
