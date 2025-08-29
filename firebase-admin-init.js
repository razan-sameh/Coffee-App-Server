// firebase-admin-init.js
const admin = require("firebase-admin");

let serviceAccount;
try {
  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
} catch (e) {
  throw new Error("Invalid FIREBASE_SERVICE_ACCOUNT JSON in environment variables");
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      project_id: serviceAccount.project_id,
      client_email: serviceAccount.client_email,
      private_key: serviceAccount.private_key.replace(/\\n/g, "\n"),
    }),
    databaseURL: "https://coffeeapp-45d44-default-rtdb.firebaseio.com/",
  });
}

module.exports = admin;


