import { Router, Request, Response } from 'express';
import { query } from '../../db/connection.js';
import { asyncHandler, AppError } from '../middleware/error.js';

const router = Router();

// List all personas
router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const { search, limit = 10, offset = 0 } = req.query;

    let sql = 'SELECT * FROM personas WHERE archived = false';
    const params: any[] = [];

    if (search) {
      sql += ` AND to_tsvector('english', name || ' ' || short_description) @@ plainto_tsquery('english', $${params.length + 1})`;
      params.push(search);
    }

    sql += ` LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await query(sql, params);
    res.json(result.rows);
  })
);

// Get single persona
router.get(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const result = await query('SELECT * FROM personas WHERE id = $1', [req.params.id]);

    if (result.rows.length === 0) {
      throw new AppError(404, 'Persona not found');
    }

    res.json(result.rows[0]);
  })
);

// Get persona with dependencies
router.get(
  '/:id/dependencies',
  asyncHandler(async (req: Request, res: Response) => {
    const persona = await query('SELECT * FROM personas WHERE id = $1', [req.params.id]);

    if (persona.rows.length === 0) {
      throw new AppError(404, 'Persona not found');
    }

    const rules = await query(
      'SELECT r.* FROM rules r JOIN persona_rules pr ON r.id = pr.rule_id WHERE pr.persona_id = $1',
      [req.params.id]
    );

    const skills = await query(
      'SELECT s.* FROM skills s JOIN persona_skills ps ON s.id = ps.skill_id WHERE ps.persona_id = $1',
      [req.params.id]
    );

    res.json({
      persona: persona.rows[0],
      rules: rules.rows,
      skills: skills.rows,
    });
  })
);

export default router;
