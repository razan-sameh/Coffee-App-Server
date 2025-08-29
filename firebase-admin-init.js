// firebase-admin-init.js
const admin = require('firebase-admin');
const serviceAccount = require('./config/serviceAccountKey.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: 'https://coffeeapp-45d44-default-rtdb.firebaseio.com/'
});

module.exports = admin;

