const admin = require('firebase-admin');
const db = admin.firestore();

class Weather {

    constructor(conv) {
        this.conv = conv;
    }

    async add(location, condition, temp) {
        const payload = this.conv.user.profile.payload;
        const userid = payload.sub;
        return db.collection('weather').doc(String(userid)).set({userid: userid, location: location, condition: condition, temp: temp})
    }

    async fetch() {
        const payload = this.conv.user.profile.payload;
        const userid = payload.sub;
        return db.collection('weather').doc(String(userid)).get().then(data => {
            return data.data();
        })
    }
}

module.exports = Weather;