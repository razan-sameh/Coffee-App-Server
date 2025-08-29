const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const paymentRoutes = require('./routes/payment');
const userRoutes = require('./routes/user');
const notificationRoutes = require('./routes/notification');
const app = express();

app.use(cors());
app.use(bodyParser.json());
// ✅ Register your route modules
app.use('/api/payment', paymentRoutes);
app.use('/api/user', userRoutes);
app.use('/api/notification', notificationRoutes);

// ✅ Listen on configured port
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
