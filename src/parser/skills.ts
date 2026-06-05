import * as fs from 'fs';
import * as path from 'path';
import { parseFrontmatter } from './frontmatter.js';
import { extractFileName } from './utils.js';
import { Skill } from '../types/index.js';
import { v4 as uuidv4 } from 'uuid';

export const parseSkillFile = (filePath: string): Skill | null => {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const { data, content: body } = parseFrontmatter(content);

    const fileName = extractFileName(filePath);

    return {
      id: uuidv4(),
      name: fileName,
      description: data.description || '',
      steps: body,
      version: data.version || '0.1.0',
      lastUpdated: new Date(data.lastUpdated || new Date()),
      createdAt: new Date(),
      archived: false,
    };
  } catch (error) {
    console.error(`Error parsing skill file ${filePath}:`, error);
    return null;
  }
};

export const loadSkillsFromDirectory = (skillsDir: string): Skill[] => {
  const skills: Skill[] = [];

  if (!fs.existsSync(skillsDir)) {
    console.warn(`Skills directory not found: ${skillsDir}`);
    return skills;
  }

  const files = fs.readdirSync(skillsDir).filter((f) => f.endsWith('.md'));

  for (const file of files) {
    const filePath = path.join(skillsDir, file);
    const skill = parseSkillFile(filePath);
    if (skill) {
      skills.push(skill);
    }
  }

  return skills;
};
