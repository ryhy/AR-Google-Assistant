
const Game = require('./game.js')

class Assist {

    constructor() { }

    setAll(conv) {
        ['morebulletcontext', 'searchweather', 'otherweaponscontext', 'aircraftcontext', 'stopspacecontext'].forEach(context => {
            conv.contexts.set(context, 100);
        })
        console.log(JSON.stringify(conv.contexts));
    }

    clear(conv) {
        ['morebulletcontext', 'searchweather', 'otherweaponscontext', 'aircraftcontext', 'stopspacecontext'].forEach(context => {
            conv.contexts.delete(context, 100);
        })
        console.log(JSON.stringify(conv.contexts));
    }

    async assist(conv) {
        switch (randomItem([0, 1, 2, 3, 4])) {
            case 0:
                this.weather(conv);
                break;
            case 1:
                this.sendAircrafts(conv);
                break;
            case 2:
                this.swapWeapons(conv);
                break;
            case 3:
                this.stopSpace(conv);
                break;
            case 4:
                this.communicationError(conv);
                break;
            default: break;
        }
    }

    getMissiles(conv) {
        const name = conv.user.profile.payload.name;
        conv.ask(`${name}、ミサイルを補充するか？`);
        conv.contexts.set('searchweather', 5);
        conv.contexts.set('morebulletcontext', 5);
        conv.contexts.set('bulletnocontext', 5);
    }

    weather(conv) {
        const name = conv.user.profile.payload.name;
        const randomCity = randomItem(['東京', '名古屋', '千葉', '大阪', '沖縄']);
        const msgs = [
            `${randomCity}で宇宙人が多く出現しているとの報告を受けた。もしかしたら君の場所でも宇宙人が出現しやすい天候かもしれない`,
            `${randomCity}で宇宙人が君の場所に出現するかもしれない。`,
            `${randomCity}で負傷者がでた。要注意が必要だ`
        ];
        const welcomeMsg = randomItem(msgs);
        conv.ask(`${name}、${welcomeMsg}。もし天気が知りたければ、現在地を教えてくれ。`);
        // conv.contexts.set('searchweather', 5);
    }

    welcomeAssist(conv) {
        const name = conv.user.profile.payload.name;
        const skillsAvailable = [
            'ミサイル補充がなくなったら本部に連絡を。', 
            '仲間が必要であれば送ることができる。', 
            '相手の動きが早いか？相手を止めることができるぞ。', 
            '武器を入手することもできるぞ。',
        ]
        conv.ask(`${name}、どうした？${randomItem(skillsAvailable)}天気予報が知りたければ、現在地を。`);
        // conv.contexts.set('searchweather', 5);
        this.setAll(conv);
    }

    assistAgain(conv) {
        // const name = conv.user.profile.payload.name;
        const skillsAvailable = [
            'ミサイル補充がなくなったら本部に連絡を。', 
            '仲間が必要であれば送ることができる。', 
            '相手の動きが早いか？相手を止めることができるぞ。', 
            '武器を入手することもできるぞ。',
            '天気予報が知りたければ、現在地を。'
        ]
        conv.ask(`他にしたいことはあるか？${randomItem(skillsAvailable)}`);
        // conv.contexts.set('searchweather', 5);
        this.setAll(conv);
    }

    noMissileNeeded(conv) {
        const name = conv.user.profile.payload.name;
        const skillsAvailable = [
            'ミサイルが必要であれば言ってくれ。', 
            '仲間が必要であれば送ることができる。', 
            '相手の動きが早いか？相手を止めることもできるぞ。', 
            '武器を入手することもできるぞ。'
        ];
        conv.ask(`${name}、了解。${randomItem(skillsAvailable)}。または、天気予報が知りたければ、現在地を。`);
        // conv.contexts.set('searchweather', 5);
        this.setAll(conv);
    }

    sendAircrafts(conv) {
        const name = conv.user.profile.payload.name;
        conv.ask(`${name}、一人で大丈夫か？応援が必要であれば、出動させるぞ。必要か？`);
        conv.contexts.set('aircraftcontext', 5);
    }

    swapWeapons(conv) {
        conv.ask(`他の武器に交換するか？`);
        conv.contexts.set('otherweaponscontext', 5);
    }
    
    stopSpace(conv) {
        conv.ask('相手の動きが早い。。ストップ機能を使うか？');
        conv.contexts.set('stopspacecontext', 5);
    }

    async sendMissile(conv) {
        const game = new Game(conv);
        await game.launchedMissile();
        const name = conv.user.profile.payload.name;
        conv.close(`${name}、ここからミサイルを飛ばす。`);
    }

    communicationError(conv) {
        const name = conv.user.profile.payload.name;
        conv.close(`${name}、宇宙人に信号を妨害されている。また連絡をしてくれ`);
    }

}

function randomItem(array) {
    return array[Math.floor(Math.random() * array.length)];
}
module.exports = Assist; 