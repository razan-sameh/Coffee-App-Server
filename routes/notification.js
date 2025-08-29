const express = require("express");
const router = express.Router();
const { statusMessages, enmOrderStatus } = require("../enums/orderStatus");
const admin = require("../firebase-admin-init");
const fetch = require("node-fetch");

// ✅ Keep track of active simulations (so multiple orders can run independently)
const activeSimulations = {};

// Utility: fetch full OSRM route (array of coordinates)
const fetchRoute = async (start, destination) => {
  const url = `https://router.project-osrm.org/route/v1/driving/${start.longitude},${start.latitude};${destination.longitude},${destination.latitude}?overview=full&geometries=geojson`;
  const response = await fetch(url);
  const data = await response.json();
  if (data.routes?.length > 0) {
    return {
      points: data.routes[0].geometry.coordinates.map(c => ({
        latitude: c[1],
        longitude: c[0],
      })),
      duration: data.routes[0].duration // ✅ مدة الرحلة بالثواني
    };
  }
  return { points: [], duration: 0 };
};

const enmRole = {
  admin: 'Admin',
  user: 'User',
  manager: 'Manager',
  customer: 'Customer',
  driver: 'Driver',
};
const getRandomDriver = async () => {
  const snapshot = await admin.database().ref("user").once("value");
  const users = snapshot.val() || {};

  // Filter only drivers
  const drivers = Object.entries(users)
    .filter(([uid, user]) => user.role === enmRole.driver)
    .map(([uid, user]) => ({ uid, ...user }));

  if (drivers.length === 0) {
    throw new Error("No drivers available");
  }

  // Pick a random driver
  const randomIndex = Math.floor(Math.random() * drivers.length);
  return drivers[randomIndex];
};

// Send FCM + update status
const sendNotification = async (uid, status, orderId) => {
  const snapshot = await admin.database().ref(`user/${uid}/fcmToken`).once("value");
  const fcmToken = snapshot.val();

  if (!fcmToken) throw new Error("No token for user");
  if (!statusMessages[status]) throw new Error("Invalid status");

  const { title, body } = statusMessages[status](orderId);
  const message = { token: fcmToken, notification: { title, body } };

  await admin.database().ref(`order/${orderId}/status`).set(status);
  await admin.messaging().send(message);
};

// 🚀 Main simulation route
router.post("/simulate-order/:uid/:orderId", async (req, res) => {
  const { uid, orderId } = req.params;

  try {
    // ✅ Pick a random driver
    const driver = await getRandomDriver();
    // ✅ Assign driver ID to order
    await admin.database().ref(`order/${orderId}/driver`).set(driver.uid);

    // Get delivery destination
    const orderSnap = await admin.database().ref(`order/${orderId}/deliveryInfo/address`).once("value");
    const addressData = orderSnap.val() || {};
    const destination = {
      latitude: addressData.latitude ?? 31.2001,
      longitude: addressData.longitude ?? 29.9187,
    };

    // Starting point
    const driverLocation = {
      latitude: 31.233804468506055,
      longitude: 29.949878491206622,
    };

    await admin.database().ref(`order/${orderId}/driverLocation`).set(driverLocation);

    // ✅ Get route + duration
    const { points: route, duration } = await fetchRoute(driverLocation, destination);
    if (route.length === 0) {
      throw new Error("No route found");
    }

    // ✅ حساب الوقت المتوقع للوصول ETA
    const now = new Date();
    const arrivalTime = new Date(now.getTime() + duration * 1000); // duration بالثواني
    const hh = arrivalTime.getHours().toString().padStart(2, "0");
    const mm = arrivalTime.getMinutes().toString().padStart(2, "0");
    const etaFormatted = `${hh}:${mm}`;

    // ✅ Store ETA in Firebase
    await admin.database().ref(`order/${orderId}/estimatedTime`).set(etaFormatted);

    // Simulation timing
    const stepIntervalMs = 5000;
    let step = 0;

    if (activeSimulations[orderId]) {
      clearInterval(activeSimulations[orderId]);
    }

    activeSimulations[orderId] = setInterval(async () => {
      if (step >= route.length) {
        clearInterval(activeSimulations[orderId]);
        delete activeSimulations[orderId];

        await admin.database().ref(`order/${orderId}/driverLocation`).set(destination);
        await sendNotification(uid, enmOrderStatus.Delivered, orderId);
        return;
      }

      const currentPoint = route[step];
      await admin.database().ref(`order/${orderId}/driverLocation`).set(currentPoint);

      step++;
    }, stepIntervalMs);

    // Send status notifications
    setTimeout(() => sendNotification(uid, enmOrderStatus.Brewing, orderId), 1000);
    setTimeout(() => sendNotification(uid, enmOrderStatus.Ready, orderId), 3000);
    setTimeout(() => sendNotification(uid, enmOrderStatus.OutForDelivery, orderId), 5000);

    // ✅ رجع ETA في الريسبونس
    res.json({
      success: true,
      message: "Driver simulation started",
      steps: route.length,
      estimatedArrival: etaFormatted
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});


module.exports = router;
