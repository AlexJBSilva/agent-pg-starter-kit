import * as fs from 'fs';
import * as path from 'path';
import { parseFrontmatter } from './frontmatter';
import { generateHash, extractFileName } from './utils';
import { Persona } from '../types';
import { v4 as uuidv4 } from 'uuid';

export const parsePersonaFile = (filePath: string): Persona | null => {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const { data, content: body } = parseFrontmatter(content);

    if (!data.shortDescription || !data.modelTier) {
      console.warn(`Skipping persona ${filePath}: missing required fields`);
      return null;
    }

    const fileName = extractFileName(filePath);

    return {
      id: uuidv4(),
      name: fileName,
      shortDescription: data.shortDescription,
      preferredModel: data.preferredModel,
      modelTier: data.modelTier,
      version: data.version || '0.1.0',
      humor: data.humor,
      lastUpdated: new Date(data.lastUpdated || new Date()),
      createdAt: new Date(),
      identity: extractSection(body, 'Identity') || '',
      playbook: extractSection(body, 'Playbook') || '',
      handoff: extractSection(body, 'Handoff') || '',
      redLines: extractSection(body, 'Red Lines') || '',
      archived: false,
    };
  } catch (error) {
    console.error(`Error parsing persona file ${filePath}:`, error);
    return null;
  }
};

export const loadPersonasFromDirectory = (personasDir: string): Persona[] => {
  const personas: Persona[] = [];

  if (!fs.existsSync(personasDir)) {
    console.warn(`Personas directory not found: ${personasDir}`);
    return personas;
  }

  const files = fs.readdirSync(personasDir).filter((f) => f.endsWith('.md'));

  for (const file of files) {
    const filePath = path.join(personasDir, file);
    const persona = parsePersonaFile(filePath);
    if (persona) {
      personas.push(persona);
    }
  }

  return personas;
};

const extractSection = (content: string, sectionName: string): string => {
  const regex = new RegExp(`##\\s+${sectionName}\\s*\\n([\\s\\S]*?)(?=##|$)`);
  const match = content.match(regex);
  return match ? match[1].trim() : '';
};
