const fs = require('fs');
const path = require('path');

const routesToFix = [
  'app/api/dashboard/products/route.ts',
  'app/api/dashboard/customer-summary/route.ts',
  'app/api/analytics/activity/route.ts',
  'app/api/test/debug-user/route.ts',
  'app/api/dashboard/smart-history/route.ts',
  'app/api/dashboard/licenses/route.ts',
  'app/api/test/debug-conversations/route.ts'
];

routesToFix.forEach(filePath => {
  const fullPath = path.join(__dirname, filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`Skipping ${filePath} - file not found`);
    return;
  }
  
  let content = fs.readFileSync(fullPath, 'utf8');
  
  // Check if already has dynamic export
  if (content.includes('export const dynamic')) {
    console.log(`Skipping ${filePath} - already has dynamic export`);
    return;
  }
  
  // Find the first import statement
  const lines = content.split('\n');
  let lastImportIndex = -1;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('import ') || line.startsWith('const ') || (lastImportIndex >= 0 && line === '')) {
      lastImportIndex = i;
    } else if (lastImportIndex >= 0 && line !== '' && !line.startsWith('const ')) {
      break;
    }
  }
  
  if (lastImportIndex === -1) {
    console.log(`Skipping ${filePath} - could not find import block`);
    return;
  }
  
  // Insert the dynamic export after imports
  lines.splice(lastImportIndex + 1, 0, '', "export const dynamic = 'force-dynamic';");
  
  const newContent = lines.join('\n');
  fs.writeFileSync(fullPath, newContent, 'utf8');
  
  console.log(`Fixed ${filePath}`);
});

console.log('Done!');