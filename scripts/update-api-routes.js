#!/usr/bin/env node

/**
 * Update API Routes to use Tenant-Aware Database
 * Automatically updates import statements and database calls
 */

const fs = require('fs');
const path = require('path');

console.log('Updating API routes to use tenant-aware database...\n');

// Patterns to replace
const replacements = [
  {
    pattern: /import\s+{\s*prisma\s*}\s+from\s+['"]@intelagent\/database['"]/g,
    replacement: "import { getTenantDb } from '@intelagent/database'"
  },
  {
    pattern: /const\s+{\s*prisma\s*}\s+=\s+require\(['"]@intelagent\/database['"]\)/g,
    replacement: "const { getTenantDb } = require('@intelagent/database')"
  },
  {
    pattern: /prisma\./g,
    replacement: 'db.',
    requiresDbInit: true
  }
];

// Directories to scan
const directories = [
  'apps/customer-portal/app/api',
  'apps/admin-portal/app/api',
  'apps/agent-portal/app/api'
];

let filesUpdated = 0;
let filesSkipped = 0;

function updateFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  let needsDbInit = false;

  // Skip if already using getTenantDb
  if (content.includes('getTenantDb')) {
    return false;
  }

  // Apply replacements
  for (const replacement of replacements) {
    if (content.match(replacement.pattern)) {
      content = content.replace(replacement.pattern, replacement.replacement);
      modified = true;
      
      if (replacement.requiresDbInit) {
        needsDbInit = true;
      }
    }
  }

  // Add db initialization if needed
  if (needsDbInit && modified) {
    // Find the first function in the file
    const functionMatch = content.match(/(export\s+async\s+function\s+\w+|export\s+default\s+async\s+function)/);
    
    if (functionMatch) {
      const functionIndex = content.indexOf(functionMatch[0]);
      const openBraceIndex = content.indexOf('{', functionIndex);
      
      // Add db initialization after opening brace
      const beforeBrace = content.substring(0, openBraceIndex + 1);
      const afterBrace = content.substring(openBraceIndex + 1);
      
      // Check if we need try-catch
      const needsTryCatch = !afterBrace.trim().startsWith('try');
      
      if (needsTryCatch) {
        content = beforeBrace + `
  try {
    const db = await getTenantDb();
    ` + afterBrace;
        
        // Find the closing brace and add catch
        const lastBraceIndex = content.lastIndexOf('}');
        content = content.substring(0, lastBraceIndex) + `
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { error: 'Database error' },
      { status: 500 }
    );
  }
}`;
      } else {
        // Just add db initialization at the start of try block
        const tryIndex = afterBrace.indexOf('try');
        const tryBraceIndex = afterBrace.indexOf('{', tryIndex);
        
        content = beforeBrace + 
          afterBrace.substring(0, tryBraceIndex + 1) + 
          '\n    const db = await getTenantDb();\n' +
          afterBrace.substring(tryBraceIndex + 1);
      }
    }
  }

  if (modified) {
    fs.writeFileSync(filePath, content);
    return true;
  }

  return false;
}

function scanDirectory(dir) {
  if (!fs.existsSync(dir)) {
    console.log(`  ⚠️  Directory not found: ${dir}`);
    return;
  }

  const files = fs.readdirSync(dir, { withFileTypes: true });

  for (const file of files) {
    const fullPath = path.join(dir, file.name);

    if (file.isDirectory()) {
      // Skip node_modules and .next
      if (file.name !== 'node_modules' && file.name !== '.next') {
        scanDirectory(fullPath);
      }
    } else if (file.name.endsWith('.ts') || file.name.endsWith('.tsx')) {
      if (updateFile(fullPath)) {
        console.log(`  ✅ Updated: ${fullPath.replace(process.cwd(), '.')}`);
        filesUpdated++;
      } else {
        filesSkipped++;
      }
    }
  }
}

// Process all directories
for (const dir of directories) {
  const fullPath = path.join(process.cwd(), dir);
  console.log(`Scanning ${dir}...`);
  scanDirectory(fullPath);
}

console.log('\n========================================');
console.log('API Route Update Complete');
console.log('========================================');
console.log(`✅ Files updated: ${filesUpdated}`);
console.log(`⏭️  Files skipped: ${filesSkipped}`);

if (filesUpdated > 0) {
  console.log('\n⚠️  Important: Review the updated files to ensure correctness.');
  console.log('   Some routes may need manual adjustment for:');
  console.log('   - Admin routes (should use getAdminDb instead)');
  console.log('   - Public routes (may not need tenant context)');
  console.log('   - Webhook endpoints');
}