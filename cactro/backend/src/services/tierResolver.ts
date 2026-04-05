import { Pool } from "pg";
import { UserTier } from "../types";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export const tierResolver = {
  async resolve(userId: string): Promise<UserTier> {
    try {
      const result = await pool.query(
        "SELECT tier FROM users WHERE user_id = $1",
        [userId]
      );
      if (result.rows[0]?.tier === "paid") return "paid";
      return "free";
    } catch (err) {
      console.error("tierResolver error:", err);
      return "free";
    }
  },
};
