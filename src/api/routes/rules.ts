import { Router, Request, Response } from 'express';
import { query } from '../../db/connection.js';
import { asyncHandler, AppError } from '../middleware/error.js';

const router = Router();

// List all rules
router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const { type, scope, search, limit = 10, offset = 0 } = req.query;

    let sql = 'SELECT * FROM rules WHERE archived = false';
    const params: any[] = [];

    if (type) {
      sql += ` AND rule_type = $${params.length + 1}`;
      params.push(type);
    }

    if (scope) {
      sql += ` AND scope = $${params.length + 1}`;
      params.push(scope);
    }

    if (search) {
      sql += ` AND to_tsvector('english', name || ' ' || statement) @@ plainto_tsquery('english', $${params.length + 1})`;
      params.push(search);
    }

    sql += ` LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await query(sql, params);
    res.json(result.rows);
  })
);

// Get single rule
router.get(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const result = await query('SELECT * FROM rules WHERE id = $1', [req.params.id]);

    if (result.rows.length === 0) {
      throw new AppError(404, 'Rule not found');
    }

    res.json(result.rows[0]);
  })
);

export default router;
