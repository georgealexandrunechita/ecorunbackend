const DB_TYPE = process.env.DB_TYPE || (process.env.NODE_ENV === 'production' ? 'mysql' : 'mssql');

let pool;
let testConnection;

if (DB_TYPE === 'mysql') {
    const mysql = require('mysql2');

    const rawPool = mysql.createPool({
        host:            process.env.DB_HOST     || 'localhost',
        user:            process.env.DB_USER     || 'root',
        password:        process.env.DB_PASSWORD || '',
        database:        process.env.DB_NAME     || 'ecorun_sevilla',
        port:            process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
        charset:         'utf8mb4',
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit:      0,
    });

    rawPool.on('connection', (conn) => {
        conn.query("SET NAMES 'utf8mb4' COLLATE 'utf8mb4_unicode_ci'");
    });

    const mysqlPool = rawPool.promise();

    pool = {
        query:   (sql, params) => mysqlPool.query(sql, params),
        execute: (sql, params) => mysqlPool.execute(sql, params),
    };

    testConnection = async () => {
        const conn = await mysqlPool.getConnection();
        await conn.ping();
        conn.release();
    };

} else {
    const sql = require('mssql');

    const getConfig = () => ({
        server:   process.env.DB_HOST || 'localhost\\SQLEXPRESS',
        user:     process.env.DB_USER,
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME    || 'ecorun_sevilla',
        port:     Number(process.env.DB_PORT) || 1433,
        options: {
            trustServerCertificate: true,
            encrypt: true,
        },
        pool: { max: 10, min: 0, idleTimeoutMillis: 30000 },
    });

    let _pool = null;

    const getPool = async () => {
        if (!_pool) _pool = await sql.connect(getConfig());
        return _pool;
    };

    // Convert ? to @p0, @p1, ... and inject OUTPUT INSERTED.id for INSERTs
    const prepareSQL = (sqlText) => {
        let i = 0;
        let converted = sqlText.replace(/\?/g, () => `@p${i++}`);
        const upper = converted.trim().toUpperCase();
        if (upper.startsWith('INSERT') && !upper.includes('OUTPUT')) {
            converted = converted.replace(/\bVALUES\b/i, 'OUTPUT INSERTED.id VALUES');
        }
        return converted;
    };

    // mysql2-compatible response format
    const runQuery = async (sqlText, params = []) => {
        const p = await getPool();
        const req = p.request();
        params.forEach((val, i) => req.input(`p${i}`, val));

        const result = await req.query(prepareSQL(sqlText));

        const upper = sqlText.trim().toUpperCase();
        if (upper.startsWith('INSERT')) {
            return [{ insertId: result.recordset?.[0]?.id ?? null, affectedRows: result.rowsAffected?.[0] ?? 0 }];
        }
        if (upper.startsWith('UPDATE') || upper.startsWith('DELETE')) {
            return [{ affectedRows: result.rowsAffected?.[0] ?? 0 }];
        }
        return [result.recordset ?? []];
    };

    pool = { query: runQuery, execute: runQuery };

    testConnection = async () => {
        const p = await getPool();
        await p.request().query('SELECT 1 AS ok');
    };
}

module.exports = { pool, testConnection };
