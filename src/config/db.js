const sql = require('mssql');

const getConfig = () => ({
    server:   process.env.DB_HOST || 'localhost\\SQLEXPRESS',
    user:     process.env.DB_USER,
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME     || 'ecorun_sevilla',
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

// Convert ? placeholders to @p0, @p1, ... and inject OUTPUT INSERTED.id for INSERTs
const prepareSQL = (sqlText) => {
    let i = 0;
    let converted = sqlText.replace(/\?/g, () => `@p${i++}`);
    const upper = converted.trim().toUpperCase();
    if (upper.startsWith('INSERT') && !upper.includes('OUTPUT')) {
        converted = converted.replace(/\bVALUES\b/i, 'OUTPUT INSERTED.id VALUES');
    }
    return converted;
};

// mysql2-compatible wrapper: returns [rows] for SELECT, [{ insertId, affectedRows }] for INSERT,
// [{ affectedRows }] for UPDATE/DELETE
const runQuery = async (sqlText, params = []) => {
    const p = await getPool();
    const req = p.request();
    params.forEach((val, i) => req.input(`p${i}`, val));

    const prepared = prepareSQL(sqlText);
    const result = await req.query(prepared);

    const upper = sqlText.trim().toUpperCase();
    if (upper.startsWith('INSERT')) {
        return [{ insertId: result.recordset?.[0]?.id ?? null, affectedRows: result.rowsAffected?.[0] ?? 0 }];
    }
    if (upper.startsWith('UPDATE') || upper.startsWith('DELETE')) {
        return [{ affectedRows: result.rowsAffected?.[0] ?? 0 }];
    }
    return [result.recordset ?? []];
};

const pool = {
    query:   runQuery,
    execute: runQuery,
};

const testConnection = async () => {
    const p = await getPool();
    await p.request().query('SELECT 1 AS ok');
};

module.exports = { pool, testConnection };
