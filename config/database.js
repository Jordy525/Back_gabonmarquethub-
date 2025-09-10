const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    // Configuration pour connexion distante avec timeouts étendus
    connectTimeout: 60000, // 60 secondes pour établir la connexion
    reconnect: true,
    // Options de connexion MySQL
    ssl: false, // Désactiver SSL si problème de certificat
    multipleStatements: false
});

module.exports = pool;