import crypto from 'crypto';

export const generateHash = (content: string): string => {
  return crypto.createHash('sha256').update(content).digest('hex');
};

export const extractFileName = (filePath: string): string => {
  return filePath.split('/').pop()?.replace('.md', '') || '';
};

export const slugify = (text: string): string => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '');
};
