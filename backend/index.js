require('dotenv').config();

const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

// ✅ ADD THIS FIRST (health check)
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Backend is live 🚀' });
});

// routes
app.use('/api/v1/auth', require('./src/routes/auth'));
app.use('/api/v1/users', require('./src/routes/users'));
app.use('/api/v1/companies', require('./src/routes/companies'));
app.use('/api/v1/customers', require('./src/routes/customers'));
app.use('/api/v1/routes', require('./src/routes/routes'));
app.use('/api/v1/journey-plans', require('./src/routes/journeyPlans'));
app.use('/api/v1/visits', require('./src/routes/visits'));
app.use('/api/v1/stats', require('./src/routes/stats'));
app.use('/api/v1/vehicles', require('./src/routes/vehicles'));
app.use('/api/v1/warehouses', require('./src/routes/warehouses'));

// ✅ CRITICAL
const PORT = process.env.PORT || 8080;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
