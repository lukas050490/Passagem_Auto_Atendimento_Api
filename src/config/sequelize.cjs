// src/config/sequelize.cjs
const { Sequelize } = require('sequelize');
const config = require('./database.cjs');

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

const sequelize = new Sequelize(
    dbConfig.database,
    dbConfig.username,
    dbConfig.password,
    {
        host: dbConfig.host,
        port: dbConfig.port,
        dialect: dbConfig.dialect,
        logging: dbConfig.logging,
        define: dbConfig.define,
        pool: dbConfig.pool,
    }
);

module.exports = sequelize;