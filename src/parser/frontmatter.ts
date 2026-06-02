import * as yaml from 'yaml';

export interface ParsedFrontmatter {
  data: Record<string, any>;
  content: string;
}

export const parseFrontmatter = (fileContent: string): ParsedFrontmatter => {
  const lines = fileContent.split('\n');
  
  if (!lines[0].startsWith('---')) {
    return {
      data: {},
      content: fileContent,
    };
  }

  let endIndex = -1;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].startsWith('---')) {
      endIndex = i;
      break;
    }
  }

  if (endIndex === -1) {
    return {
      data: {},
      content: fileContent,
    };
  }

  const frontmatterStr = lines.slice(1, endIndex).join('\n');
  const content = lines.slice(endIndex + 1).join('\n').trim();

  try {
    const data = yaml.parse(frontmatterStr) || {};
    return { data, content };
  } catch (error) {
    console.error('Error parsing frontmatter:', error);
    return {
      data: {},
      content: fileContent,
    };
  }
};
