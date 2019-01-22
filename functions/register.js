const admin = require('firebase-admin');
const db = admin.firestore();

class Register {

    constructor(conv) {
        this.conv = conv;
    }

    async register() {
        const payload = this.conv.user.profile.payload;
        const userid = payload.sub;
        const name = payload.name;
        const email = payload.email;
        return db.collection('members').doc(String(userid)).set({userid: userid, name: name, email: email, done: false})
    }

    async fetch() {
        const payload = this.conv.user.profile.payload;
        const userid = payload.sub;
        return db.collection('members').doc(String(userid)).get().then(user => {
            return user.data();
        })
    }

    async done() {
        const payload = this.conv.user.profile.payload;
        const userid = payload.sub;
        const name = payload.name;
        const email = payload.email;
        return db.collection('members').doc(String(userid)).set({userid: userid, name: name, email: email, done: true})
    }

    async update(latitude, longitude) {
        const payload = this.conv.user.profile.payload;
        const userid = payload.sub;
        const name = payload.name;
        const email = payload.email;
        return db.collection('members').doc(String(userid)).set({userid: userid, name: name, email: email, done: true, latitude: latitude, longitude: longitude})
    }



}

module.exports = Register;