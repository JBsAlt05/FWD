const express = require('express');
const session = require('express-session');
const cors = require('cors');
const path = require('path');

const app = express();

// Middleware
app.use(cors({
  origin: true,
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: 'fwd_secret_key',
  resave: false,
  saveUninitialized: false
}));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.get('/', (req, res) => res.send('FWD backend is running'));

const authRoutes = require('./routes/auth');
app.use('/auth', authRoutes);

const workOrdersRoutes = require('./routes/workOrders');
app.use('/work-orders', workOrdersRoutes);

const workOrderDetailsRoutes = require('./routes/workOrderDetails');
app.use('/work-orders', workOrderDetailsRoutes);

const adminWorkOrders = require('./routes/adminWorkOrders');
app.use('/admin/work-orders', adminWorkOrders);

const dispatcherWorkOrders = require('./routes/dispatcherWorkOrders');
app.use('/dispatcher/work-orders', dispatcherWorkOrders);

const teamLeaderWorkOrders = require('./routes/teamLeaderWorkOrders');
app.use('/team-leader/work-orders', teamLeaderWorkOrders);

const usersRoutes = require('./routes/users');
app.use('/users', usersRoutes);

const techniciansRoutes = require('./routes/technicians');
app.use('/technicians', techniciansRoutes);

// ✅ These must be BEFORE listen
const clientsRoutes = require('./routes/clients');
app.use('/clients', clientsRoutes);

const storesRoutes = require('./routes/stores');
app.use('/stores', storesRoutes);

// Start LAST
const PORT = 3001;
app.listen(PORT, () => console.log(`✅ FWD backend running on port ${PORT}`));