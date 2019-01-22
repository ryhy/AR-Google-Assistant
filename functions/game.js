const admin = require('firebase-admin');
const db = admin.firestore();

class Game {

    constructor(conv) {
        this.conv = conv;
    }

    async shouldGo(aliensnumber) {
        const payload = this.conv.user.profile.payload;
        const userid = payload.sub;
        return db.collection('alert').doc(String(userid)).set({go: true, numbers: aliensnumber});
    }
    
    async initScore() {
        const payload = this.conv.user.profile.payload;
        const userid = payload.sub;
        return db.collection('score').doc(String(userid)).set({numbers: 0});
    }

    async stayAlert() {
        const payload = this.conv.user.profile.payload;
        const userid = payload.sub;
        return db.collection('alert').doc(String(userid)).set({go: false, numbers: 0});
    }

    async supplyBullet() {
        const payload = this.conv.user.profile.payload;
        const userid = payload.sub;
        return db.collection('bullet').doc(String(userid)).set({runout: false, bullet: 50});
    }

    async makeBullet() {
        const payload = this.conv.user.profile.payload;
        const userid = payload.sub;
        return db.collection('bullet').doc(String(userid)).set({runout: false, bullet: 50});
    }

    async getBullet() {
        const payload = this.conv.user.profile.payload;
        const userid = payload.sub;
        return db.collection('bullet').doc(String(userid)).get().then(data => {
            return data.data();
        })
    }
}

module.exports = Game;