import * as fs from 'fs';
import * as path from 'path';
import { parseFrontmatter } from './frontmatter';
import { extractFileName } from './utils';
import { Rule } from '../types';
import { v4 as uuidv4 } from 'uuid';

export const parseRuleFile = (filePath: string): Rule | null => {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const { data, content: body } = parseFrontmatter(content);

    if (!data.shortDescription || !data.scope) {
      console.warn(`Skipping rule ${filePath}: missing required fields`);
      return null;
    }

    const fileName = extractFileName(filePath);
    const ruleType = determineRuleType(filePath);

    return {
      id: uuidv4(),
      name: fileName,
      ruleType,
      scope: data.scope,
      statement: extractSection(body, 'Statement') || '',
      rationale: extractSection(body, 'Rationale') || '',
      version: data.version || '0.1.0',
      lastUpdated: new Date(data.lastUpdated || new Date()),
      createdAt: new Date(),
      archived: false,
    };
  } catch (error) {
    console.error(`Error parsing rule file ${filePath}:`, error);
    return null;
  }
};

export const loadRulesFromDirectory = (rulesDir: string): Rule[] => {
  const rules: Rule[] = [];

  if (!fs.existsSync(rulesDir)) {
    console.warn(`Rules directory not found: ${rulesDir}`);
    return rules;
  }

  const subdirs = ['commandments', 'edicts', 'counsel'];

  for (const subdir of subdirs) {
    const subdirPath = path.join(rulesDir, subdir);
    if (!fs.existsSync(subdirPath)) continue;

    const files = fs.readdirSync(subdirPath).filter((f) => f.endsWith('.md'));

    for (const file of files) {
      const filePath = path.join(subdirPath, file);
      const rule = parseRuleFile(filePath);
      if (rule) {
        rules.push(rule);
      }
    }
  }

  return rules;
};

const determineRuleType = (filePath: string): 'commandment' | 'edict' | 'counsel' => {
  if (filePath.includes('commandments')) return 'commandment';
  if (filePath.includes('edicts')) return 'edict';
  return 'counsel';
};

const extractSection = (content: string, sectionName: string): string => {
  const regex = new RegExp(`##\\s+${sectionName}\\s*\\n([\\s\\S]*?)(?=##|$)`);
  const match = content.match(regex);
  return match ? match[1].trim() : '';
};
