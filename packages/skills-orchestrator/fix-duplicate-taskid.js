const fs = require('fs');
const path = require('path');

// Files that need fixing
const files = [
  'AlertSystemSkill.ts',
  'BatchProcessorSkill.ts',
  'DashboardBuilderSkill.ts',
  'DataPipelineSkill.ts',
  'DirectoryMonitorSkill.ts',
  'EtlProcessorSkill.ts',
  'EventListenerSkill.ts',
  'FormFillerSkill.ts',
  'JobSchedulerSkill.ts',
  'LogAnalyzerSkill.ts',
  'MetricCollectorSkill.ts',
  'MonitoringAgentSkill.ts',
  'NotificationEngineSkill.ts',
  'ReportGeneratorSkill.ts',
  'TestRunnerSkill.ts',
  'WebhookHandlerSkill.ts'
];

const skillsDir = path.join(__dirname, 'src', 'skills', 'impl');

files.forEach(file => {
  const filePath = path.join(skillsDir, file);
  
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Replace the first taskId declaration with contextTaskId
    content = content.replace(
      /const taskId = params\._context\?\.taskId;/,
      'const contextTaskId = params._context?.taskId;'
    );
    
    // Update the console.log that uses the old taskId
    content = content.replace(
      /console\.log\((.*?)task \$\{taskId\}(.*?)\)/g,
      'console.log($1task ${contextTaskId}$2)'
    );
    
    fs.writeFileSync(filePath, content);
    console.log(`Fixed: ${file}`);
  }
});

console.log(`\nFixed ${files.length} files with duplicate taskId declarations.`);