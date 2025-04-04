const db = require('../config/db');

class Receiver {
  static async create(receiverData) {
    const {
      user_id,
      full_name,
      age,
      blood_type,
      contact_number,
      country,
      state,
      district,
      address,
      location_lat,
      location_lng,
      location_address,
      reason_for_request,
      prescription_path
    } = receiverData;

    const sql = `
      INSERT INTO receivers (
        user_id, full_name, age, blood_type, contact_number,
        country, state, district, address, location_lat,
        location_lng, location_address, reason_for_request, prescription_path
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      user_id,
      full_name,
      age,
      blood_type,
      contact_number,
      country,
      state,
      district,
      address,
      location_lat,
      location_lng,
      location_address,
      reason_for_request,
      prescription_path
    ];

    try {
      const [result] = await db.execute(sql, values);
      return result.insertId;
    } catch (error) {
      throw error;
    }
  }

  static async getAll() {
    const sql = 'SELECT * FROM receivers ORDER BY created_at DESC';
    try {
      const [rows] = await db.execute(sql);
      return rows;
    } catch (error) {
      throw error;
    }
  }

  static async getById(id) {
    const sql = 'SELECT * FROM receivers WHERE id = ?';
    try {
      const [rows] = await db.execute(sql, [id]);
      return rows[0];
    } catch (error) {
      throw error;
    }
  }

  static async getByUserId(userId) {
    const sql = 'SELECT * FROM receivers WHERE user_id = ? ORDER BY created_at DESC';
    try {
      const [rows] = await db.execute(sql, [userId]);
      return rows;
    } catch (error) {
      throw error;
    }
  }

  static async updateStatus(id, status) {
    const sql = 'UPDATE receivers SET status = ? WHERE id = ?';
    try {
      const [result] = await db.execute(sql, [status, id]);
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = Receiver; 