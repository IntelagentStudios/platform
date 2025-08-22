#!/usr/bin/env node

/**
 * Fix workspace:* references for npm compatibility
 * Converts workspace:* to file:../package references
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

console.log('Fixing workspace references for npm compatibility...\n');

// Find all package.json files
const packageFiles = glob.sync('**/package.json', {
  ignore: ['node_modules/**', '.next/**', 'dist/**', 'build/**']
});

let fixedCount = 0;

packageFiles.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  
  if (content.includes('workspace:*')) {
    const packageJson = JSON.parse(content);
    const currentDir = path.dirname(file);
    let modified = false;
    
    // Fix dependencies
    if (packageJson.dependencies) {
      Object.keys(packageJson.dependencies).forEach(dep => {
        if (packageJson.dependencies[dep] === 'workspace:*') {
          // Determine the relative path to the package
          if (dep.startsWith('@intelagent/')) {
            const packageName = dep.replace('@intelagent/', '');
            const packagePath = findPackagePath(packageName, currentDir);
            if (packagePath) {
              packageJson.dependencies[dep] = `file:${packagePath}`;
              modified = true;
            }
          }
        }
      });
    }
    
    // Fix devDependencies
    if (packageJson.devDependencies) {
      Object.keys(packageJson.devDependencies).forEach(dep => {
        if (packageJson.devDependencies[dep] === 'workspace:*') {
          if (dep.startsWith('@intelagent/')) {
            const packageName = dep.replace('@intelagent/', '');
            const packagePath = findPackagePath(packageName, currentDir);
            if (packagePath) {
              packageJson.devDependencies[dep] = `file:${packagePath}`;
              modified = true;
            }
          }
        }
      });
    }
    
    if (modified) {
      fs.writeFileSync(file, JSON.stringify(packageJson, null, 2) + '\n');
      console.log(`✅ Fixed: ${file}`);
      fixedCount++;
    }
  }
});

function findPackagePath(packageName, fromDir) {
  // Common package locations
  const possiblePaths = [
    `../packages/${packageName}`,
    `../../packages/${packageName}`,
    `../../../packages/${packageName}`,
    `../${packageName}`,
    `../../${packageName}`
  ];
  
  for (const testPath of possiblePaths) {
    const fullPath = path.join(fromDir, testPath, 'package.json');
    if (fs.existsSync(fullPath)) {
      return testPath;
    }
  }
  
  // Default to packages directory
  if (fromDir.includes('packages')) {
    return `../${packageName}`;
  } else if (fromDir.includes('apps') || fromDir.includes('services')) {
    return `../packages/${packageName}`;
  }
  
  return `../packages/${packageName}`;
}

console.log(`\n✨ Fixed ${fixedCount} package.json files`);

// If glob is not installed, use built-in fs
if (!glob.sync) {
  console.log('\nNote: Install glob for better file searching: npm install -g glob');
  console.log('Using fallback file search...\n');
  
  function findPackageJsonFiles(dir, files = []) {
    const items = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const item of items) {
      const fullPath = path.join(dir, item.name);
      
      if (item.isDirectory()) {
        if (!['node_modules', '.next', 'dist', 'build', '.git'].includes(item.name)) {
          findPackageJsonFiles(fullPath, files);
        }
      } else if (item.name === 'package.json') {
        files.push(fullPath);
      }
    }
    
    return files;
  }
  
  const files = findPackageJsonFiles(process.cwd());
  files.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    if (content.includes('workspace:*')) {
      const relativePath = path.relative(process.cwd(), file);
      console.log(`Found workspace reference in: ${relativePath}`);
      
      // Apply the same fix logic
      const packageJson = JSON.parse(content);
      const currentDir = path.dirname(file);
      let modified = false;
      
      ['dependencies', 'devDependencies'].forEach(depType => {
        if (packageJson[depType]) {
          Object.keys(packageJson[depType]).forEach(dep => {
            if (packageJson[depType][dep] === 'workspace:*') {
              if (dep.startsWith('@intelagent/')) {
                const packageName = dep.replace('@intelagent/', '');
                // Simple relative path calculation
                if (currentDir.includes('packages')) {
                  packageJson[depType][dep] = `file:../${packageName}`;
                } else {
                  packageJson[depType][dep] = `file:../packages/${packageName}`;
                }
                modified = true;
              }
            }
          });
        }
      });
      
      if (modified) {
        fs.writeFileSync(file, JSON.stringify(packageJson, null, 2) + '\n');
        console.log(`✅ Fixed: ${relativePath}`);
      }
    }
  });
}