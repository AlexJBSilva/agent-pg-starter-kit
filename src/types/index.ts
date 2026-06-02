export interface Persona {
  id: string;
  name: string;
  shortDescription: string;
  preferredModel?: string;
  modelTier: string;
  version: string;
  lastUpdated: Date;
  identity: string;
  playbook: string;
  handoff: string;
  redLines: string;
  humor?: string;
  createdAt: Date;
  archived: boolean;
}

export interface Rule {
  id: string;
  name: string;
  ruleType: 'commandment' | 'edict' | 'counsel';
  scope: string;
  statement: string;
  rationale: string;
  version: string;
  lastUpdated: Date;
  createdAt: Date;
  archived: boolean;
}

export interface Skill {
  id: string;
  name: string;
  description: string;
  steps: string;
  version: string;
  lastUpdated: Date;
  createdAt: Date;
  archived: boolean;
}

export interface SyncLog {
  id: string;
  entityType: 'persona' | 'rule' | 'skill';
  entityId: string;
  action: 'insert' | 'update' | 'delete' | 'archive';
  status: 'success' | 'failed';
  message?: string;
  timestamp: Date;
}

export interface ParsedMarkdownFile {
  name: string;
  path: string;
  frontmatter: Record<string, any>;
  body: string;
  hash: string;
}
