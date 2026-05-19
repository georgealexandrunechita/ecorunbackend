const mysql = require('mysql2');

const rawPool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'ecorun_sevilla',
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
    charset: 'utf8mb4',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
});

rawPool.on('connection', (conn) => {
    conn.query("SET NAMES 'utf8mb4' COLLATE 'utf8mb4_unicode_ci'");
});

const pool = rawPool.promise();

const testConnection = async () => {
    const conn = await pool.getConnection();
    await conn.ping();
    conn.release();
};

module.exports = { pool, testConnection };
