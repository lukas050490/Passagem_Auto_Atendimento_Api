require('dotenv').config();
const express = require('express');
require('./database');
const cors = require('cors');

const authRoutes = require('./routes/auth.routes');

const app = express();
app.use(cors());
app.use(express.json());
app.use('/auth', authRoutes);

module.exports = app;
