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

    async getBullet() {
        const payload = this.conv.user.profile.payload;
        const userid = payload.sub;
        return db.collection('MoreBulletIntent').doc(String(userid)).get().then(data => {
            return data.data();
        })
    }



    // FIRESTORE LISTEN PATHS

    async supplyBullet() {
        const payload = this.conv.user.profile.payload;
        const userid = payload.sub;
        return db.collection('MoreBulletIntent').doc(String(userid)).set({runout: false, bullet: 50});
    }

    async makeBullet() {
        const payload = this.conv.user.profile.payload;
        const userid = payload.sub;
        return db.collection('MoreBulletIntent').doc(String(userid)).set({runout: false, bullet: 50});
    }
    
    async launchedMissile() {
        const payload = this.conv.user.profile.payload;
        const userid = payload.sub;
        return db.collection('launchmissile').doc(String(userid)).set({launched: true});
    }

    async sendAircrafts() {
        const payload = this.conv.user.profile.payload;
        const userid = payload.sub;
        return db.collection('AircraftIntent').doc(String(userid)).set({sent: true});
    }

    async stopInvaders() {
        const payload = this.conv.user.profile.payload;
        const userid = payload.sub;
        return db.collection('SpaceStopIntent').doc(String(userid)).set({stopped: true});
    }

    async swapWeapon() {
        const payload = this.conv.user.profile.payload;
        const userid = payload.sub;
        return db.collection('OtherWeaponsIntent').doc(String(userid)).set({canChange: true});
    }

    async fetchNotAssisted() {
        const payload = this.conv.user.profile.payload;
        const userid = payload.sub;
        var array = [];
        return db.collection(this.conv.intent).doc(String(userid)).get(snapshot => {
            const documents = snapshot.docs;
            documents.forEach(doc => {
                array.push(doc.data());
            });
            return array;
        })
    }


}

module.exports = Game;