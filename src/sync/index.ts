import * as path from 'path';
import { query } from '../db/connection.js';
import { loadPersonasFromDirectory } from '../parser/personas.js';
import { loadRulesFromDirectory } from '../parser/rules.js';
import { loadSkillsFromDirectory } from '../parser/skills.js';
import { generateHash } from '../parser/utils.js';
import { fileURLToPath } from 'url';
import { Persona, Rule, Skill } from '../types/index.js';
import dotenv from 'dotenv';

dotenv.config();

const FRAMEWORK_PATH = process.env.FRAMEWORK_PATH || './.agents';

interface SyncStats {
  personas: { inserted: number; updated: number; failed: number };
  rules: { inserted: number; updated: number; failed: number };
  skills: { inserted: number; updated: number; failed: number };
}

const initializeSyncStats = (): SyncStats => ({
  personas: { inserted: 0, updated: 0, failed: 0 },
  rules: { inserted: 0, updated: 0, failed: 0 },
  skills: { inserted: 0, updated: 0, failed: 0 },
});

export const syncFramework = async (): Promise<SyncStats> => {
  const stats = initializeSyncStats();

  try {
    console.log('Starting framework sync...');

    // Sync personas
    const personas = loadPersonasFromDirectory(path.join(FRAMEWORK_PATH, 'personas'));
    stats.personas = await syncPersonas(personas);

    // Sync rules
    const rules = loadRulesFromDirectory(path.join(FRAMEWORK_PATH, 'rules'));
    stats.rules = await syncRules(rules);

    // Sync skills
    const skills = loadSkillsFromDirectory(path.join(FRAMEWORK_PATH, 'skills'));
    stats.skills = await syncSkills(skills);

    console.log('Sync completed:', stats);
    return stats;
  } catch (error) {
    console.error('Error during sync:', error);
    throw error;
  }
};

const syncPersonas = async (personas: Persona[]): Promise<{ inserted: number; updated: number; failed: number }> => {
  let inserted = 0, updated = 0, failed = 0;

  for (const persona of personas) {
    try {
      const existing = await query(
        'SELECT id, content_hash FROM personas WHERE name = $1',
        [persona.name]
      );

      if (existing.rows.length === 0) {
        const hash = generateHash(persona.identity + persona.playbook);
        await query(
          `INSERT INTO personas (name, short_description, preferred_model, model_tier, humor, 
           identity, playbook, handoff, red_lines, version, content_hash, last_updated) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
          [
            persona.name,
            persona.shortDescription,
            persona.preferredModel,
            persona.modelTier,
            persona.humor,
            persona.identity,
            persona.playbook,
            persona.handoff,
            persona.redLines,
            persona.version,
            hash,
            persona.lastUpdated,
          ]
        );
        inserted++;
        await logSync('persona', persona.name, 'insert', 'success');
      } else {
        const newHash = generateHash(persona.identity + persona.playbook);
        if (newHash !== existing.rows[0].content_hash) {
          await query(
            `UPDATE personas SET short_description = $1, preferred_model = $2, model_tier = $3, 
             humor = $4, identity = $5, playbook = $6, handoff = $7, red_lines = $8, 
             version = $9, content_hash = $10, last_updated = $11 WHERE name = $12`,
            [
              persona.shortDescription,
              persona.preferredModel,
              persona.modelTier,
              persona.humor,
              persona.identity,
              persona.playbook,
              persona.handoff,
              persona.redLines,
              persona.version,
              newHash,
              persona.lastUpdated,
              persona.name,
            ]
          );
          updated++;
          await logSync('persona', persona.name, 'update', 'success');
        }
      }
    } catch (error) {
      failed++;
      await logSync('persona', persona.name, 'insert', 'failed', (error as Error).message);
    }
  }

  return { inserted, updated, failed };
};

const syncRules = async (rules: Rule[]): Promise<{ inserted: number; updated: number; failed: number }> => {
  let inserted = 0, updated = 0, failed = 0;

  for (const rule of rules) {
    try {
      const existing = await query('SELECT id, content_hash FROM rules WHERE name = $1', [rule.name]);

      if (existing.rows.length === 0) {
        const hash = generateHash(rule.statement + rule.rationale);
        await query(
          `INSERT INTO rules (name, rule_type, scope, statement, rationale, version, content_hash, last_updated) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            rule.name,
            rule.ruleType,
            rule.scope,
            rule.statement,
            rule.rationale,
            rule.version,
            hash,
            rule.lastUpdated,
          ]
        );
        inserted++;
        await logSync('rule', rule.name, 'insert', 'success');
      } else {
        const newHash = generateHash(rule.statement + rule.rationale);
        if (newHash !== existing.rows[0].content_hash) {
          await query(
            `UPDATE rules SET rule_type = $1, scope = $2, statement = $3, rationale = $4, 
             version = $5, content_hash = $6, last_updated = $7 WHERE name = $8`,
            [rule.ruleType, rule.scope, rule.statement, rule.rationale, rule.version, newHash, rule.lastUpdated, rule.name]
          );
          updated++;
          await logSync('rule', rule.name, 'update', 'success');
        }
      }
    } catch (error) {
      failed++;
      await logSync('rule', rule.name, 'insert', 'failed', (error as Error).message);
    }
  }

  return { inserted, updated, failed };
};

const syncSkills = async (skills: Skill[]): Promise<{ inserted: number; updated: number; failed: number }> => {
  let inserted = 0, updated = 0, failed = 0;

  for (const skill of skills) {
    try {
      const existing = await query('SELECT id, content_hash FROM skills WHERE name = $1', [skill.name]);

      if (existing.rows.length === 0) {
        const hash = generateHash(skill.steps);
        await query(
          `INSERT INTO skills (name, description, steps, version, content_hash, last_updated) 
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [skill.name, skill.description, skill.steps, skill.version, hash, skill.lastUpdated]
        );
        inserted++;
        await logSync('skill', skill.name, 'insert', 'success');
      } else {
        const newHash = generateHash(skill.steps);
        if (newHash !== existing.rows[0].content_hash) {
          await query(
            `UPDATE skills SET description = $1, steps = $2, version = $3, content_hash = $4, last_updated = $5 WHERE name = $6`,
            [skill.description, skill.steps, skill.version, newHash, skill.lastUpdated, skill.name]
          );
          updated++;
          await logSync('skill', skill.name, 'update', 'success');
        }
      }
    } catch (error) {
      failed++;
      await logSync('skill', skill.name, 'insert', 'failed', (error as Error).message);
    }
  }

  return { inserted, updated, failed };
};

const logSync = async (
  entityType: 'persona' | 'rule' | 'skill',
  entityName: string,
  action: 'insert' | 'update' | 'delete' | 'archive',
  status: 'success' | 'failed',
  message?: string
) => {
  try {
    await query(
      'INSERT INTO sync_logs (entity_type, entity_name, action, status, message) VALUES ($1, $2, $3, $4, $5)',
      [entityType, entityName, action, status, message || null]
    );
  } catch (error) {
    console.error('Error logging sync:', error);
  }
};

// CLI execution
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  syncFramework()
    .then(() => {
      console.log('Sync completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Sync failed:', error);
      process.exit(1);
    });
}
