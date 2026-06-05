import { Router, Request, Response } from 'express';
import { query } from '../../db/connection.js';
import { asyncHandler, AppError } from '../middleware/error.js';

const router = Router();

// List all skills
router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const { search, limit = 10, offset = 0 } = req.query;

    let sql = 'SELECT * FROM skills WHERE archived = false';
    const params: any[] = [];

    if (search) {
      sql += ` AND to_tsvector('english', name || ' ' || description) @@ plainto_tsquery('english', $${params.length + 1})`;
      params.push(search);
    }

    sql += ` LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await query(sql, params);
    res.json(result.rows);
  })
);

// Get single skill
router.get(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const result = await query('SELECT * FROM skills WHERE id = $1', [req.params.id]);

    if (result.rows.length === 0) {
      throw new AppError(404, 'Skill not found');
    }

    res.json(result.rows[0]);
  })
);

// Get skill with references
router.get(
  '/:id/references',
  asyncHandler(async (req: Request, res: Response) => {
    const skill = await query('SELECT * FROM skills WHERE id = $1', [req.params.id]);

    if (skill.rows.length === 0) {
      throw new AppError(404, 'Skill not found');
    }

    const personas = await query(
      'SELECT p.* FROM personas p JOIN persona_skills ps ON p.id = ps.persona_id WHERE ps.skill_id = $1',
      [req.params.id]
    );

    res.json({
      skill: skill.rows[0],
      usedBy: personas.rows,
    });
  })
);

export default router;
