const { pool } = require('../src/config/db');
const { AppError } = require('../src/middleware/errorHandler');


// Converts ISO 8601 ("2026-03-26T08:00:00.000Z") to MySQL DATETIME format ("2026-03-26 08:00:00")
const toMySQL = (iso) => iso ? iso.replace('T', ' ').replace(/\.\d{3}Z$/, '').replace('Z', '') : null;

class RunService {
    static async createRun(runData) {
        const {
            user_id, run_name, description, distance_km, duration_minutes,
            start_time, end_time, run_date, points_earned
        } = runData;

        const calculatedPoints = points_earned || Math.round(distance_km * 10);

        const [result] = await pool.query(
            `INSERT INTO runs (
                user_id, run_name, description, distance_km,
                duration_minutes, start_time, end_time, run_date, points_earned
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                user_id,
                run_name,
                description || null,
                distance_km,
                duration_minutes,
                toMySQL(start_time),
                toMySQL(end_time),
                toMySQL(run_date),
                calculatedPoints
            ]
        );

        const [createdRun] = await pool.query(
            'SELECT * FROM runs WHERE id = ?',
            [result.insertId]
        );

        await pool.query(
            'UPDATE users SET eco_points = eco_points + ? WHERE id = ?',
            [calculatedPoints, user_id]
        );

        await RunService.updateChallengeProgress(user_id);

        const [[{ eco_points }]] = await pool.query(
            'SELECT eco_points FROM users WHERE id = ?',
            [user_id]
        );

        return { ...createdRun[0], user_eco_points: eco_points };
    }

    static async updateChallengeProgress(userId) {
        const [activeChallenges] = await pool.query(
            `SELECT uc.id AS uc_id, uc.challenge_id, c.goal_type, c.goal_value
             FROM user_challenges uc
             JOIN challenges c ON uc.challenge_id = c.id
             WHERE uc.user_id = ? AND uc.status = 'in_progress'`,
            [userId]
        );

        if (activeChallenges.length === 0) return;

        const [[{ total_km, run_count }]] = await pool.query(
            `SELECT COALESCE(SUM(distance_km), 0) AS total_km, COUNT(*) AS run_count
             FROM runs WHERE user_id = ?`,
            [userId]
        );

        for (const uc of activeChallenges) {
            const achieved = uc.goal_type === 'distance' ? parseFloat(total_km) : parseInt(run_count);
            const progress = Math.min(Math.round((achieved / uc.goal_value) * 100), 100);
            const newStatus = progress >= 100 ? 'completed' : 'in_progress';

            await pool.query(
                `UPDATE user_challenges SET progress = ?, status = ? WHERE id = ?`,
                [progress, newStatus, uc.uc_id]
            );

            if (newStatus === 'completed') {
                const [[challenge]] = await pool.query(
                    'SELECT reward_points FROM challenges WHERE id = ?',
                    [uc.challenge_id]
                );
                await pool.query(
                    'UPDATE users SET eco_points = eco_points + ? WHERE id = ?',
                    [challenge.reward_points, userId]
                );
            }
        }
    }

    static async getUserRuns(userId) {
        const [runs] = await pool.query(
            `SELECT * FROM runs 
                WHERE user_id = ?
                ORDER BY run_date DESC, id DESC`,
            [userId]
        );
        return runs;
    }

    static async getRunById(id) {
        const [runs] = await pool.query(
            'SELECT * FROM runs WHERE id = ?',
            [id]
        );

        if (runs.length === 0) {
            throw AppError.notFound('Run not found');
        }
        return runs[0];
    }

    static async updateRun(id, updateData) {
        const fields = [];
        const values = [];

        Object.entries(updateData).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                fields.push(`${key} = ?`);
                values.push(value);
            }
        });

        if (fields.length === 0) {
            throw AppError.badRequest('No data to update');
        }

        values.push(id);

        const [result] = await pool.query(
            `UPDATE runs SET ${fields.join(', ')} WHERE id = ?`,
            values
        );

        if (result.affectedRows === 0) {
            throw AppError.notFound('Run not found');
        }

        return this.getRunById(id);
    }

    static async deleteRun(id) {
        const [result] = await pool.query(
            'DELETE FROM runs WHERE id = ?',
            [id]
        );
        if (result.affectedRows === 0) {
            throw AppError.notFound('Run not found');
        }
        return { message: 'Run deleted successfully' };
    }
}

module.exports = RunService;
