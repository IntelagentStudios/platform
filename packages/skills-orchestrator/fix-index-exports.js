const fs = require('fs');
const path = require('path');

// Get all skill files
const skillsDir = path.join(__dirname, 'src', 'skills', 'impl');
const files = fs.readdirSync(skillsDir)
  .filter(f => f.endsWith('.ts') && f !== 'index.ts' && f !== 'getAllSkills.ts')
  .sort();

// Extract skill names
const skills = files.map(f => {
  const name = f.replace('.ts', '');
  return {
    className: name,
    fileName: name,
    id: name.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '').replace(/_skill$/, '')
  };
});

// Generate proper index.ts content
let content = `/**
 * Skill Implementations Index
 * Auto-generated file - Do not edit directly
 */

`;

// Add individual exports
skills.forEach(skill => {
  content += `export { ${skill.className} } from './${skill.fileName}';\n`;
});

content += `
// Export all skills as an array for easy registration
import { BaseSkill } from '../BaseSkill';

`;

// Add imports for ALL_SKILLS
skills.forEach(skill => {
  content += `import { ${skill.className} } from './${skill.fileName}';\n`;
});

content += `
export const ALL_SKILLS = [
`;

skills.forEach((skill, index) => {
  content += `  ${skill.className}`;
  if (index < skills.length - 1) content += ',';
  content += '\n';
});

content += `];

// Export skill map for dynamic loading
export const SKILL_MAP = {
`;

skills.forEach((skill, index) => {
  content += `  '${skill.id}': ${skill.className}`;
  if (index < skills.length - 1) content += ',';
  content += '\n';
});

content += `};
`;

// Write the file
const indexPath = path.join(skillsDir, 'index.ts');
fs.writeFileSync(indexPath, content);

console.log(`Fixed index.ts with ${skills.length} skills`);