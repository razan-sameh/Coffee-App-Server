const express = require('express');
const serverless = require('serverless-http');
const admin = require('../firebase-admin-init');

const app = express();
app.use(express.json());

app.delete('/api/user/delete', async (req, res) => {
    const { uid } = req.body;
    if (!uid) return res.status(400).json({ error: 'Missing UID' });

    try {
        await admin.auth().deleteUser(uid);
        res.json({ message: `User ${uid} deleted successfully` });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/user/set-disabled', async (req, res) => {
    const { uid, disabled } = req.body;

    if (!uid || typeof disabled !== 'boolean') {
        return res.status(400).json({ error: 'Missing or invalid uid/disabled' });
    }

    try {
        await admin.auth().updateUser(uid, { disabled });
        res.json({ message: `User ${uid} has been ${disabled ? 'disabled' : 'enabled'}.` });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// 🔹 Update FCM token for a user
app.post("/api/user/update-fcm-token", async (req, res) => {
    try {
        const { uid, fcmToken } = req.body;

        if (!uid || !fcmToken) {
            return res.status(400).json({ error: "Missing uid or fcmToken" });
        }

        await admin.database().ref(`user/${uid}/fcmToken`).set(fcmToken);

        res.json({ success: true, message: "FCM token updated successfully" });
    } catch (err) {
        console.error("Error updating FCM token:", err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = app;
module.exports.handler = serverless(app);