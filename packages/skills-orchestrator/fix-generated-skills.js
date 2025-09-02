const fs = require('fs');
const path = require('path');

// Fix type issues in analytics skills
const analyticsSkills = [
  'AbTestingSkill.ts',
  'CohortAnalyzerSkill.ts',
  'ConversionTrackerSkill.ts',
  'CustomMetricsSkill.ts',
  'ErrorTrackerSkill.ts',
  'FunnelAnalyzerSkill.ts',
  'GoogleAnalyticsSkill.ts',
  'HeatmapGeneratorSkill.ts',
  'MixpanelTrackerSkill.ts',
  'PerformanceMonitorSkill.ts',
  'RevenueTrackerSkill.ts',
  'SegmentTrackerSkill.ts',
  'SeoAnalyzerSkill.ts',
  'SocialAnalyticsSkill.ts',
  'UserBehaviorSkill.ts'
];

const implDir = path.join(__dirname, 'src/skills/impl');

// Fix the type issue in analytics skills
analyticsSkills.forEach(file => {
  const filePath = path.join(implDir, file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    // Fix the parameter type issue
    content = content.replace(
      'metrics: metrics.map(m => ({ name: m, value: Math.random() * 100 }))',
      'metrics: metrics.map((m: any) => ({ name: m, value: Math.random() * 100 }))'
    );
    fs.writeFileSync(filePath, content);
    console.log(`Fixed: ${file}`);
  }
});

// Check for missing core skills
const missingCoreSkills = ['CalculatorSkill.ts', 'DateTimeSkill.ts', 'WeatherSkill.ts'];

missingCoreSkills.forEach(skill => {
  const filePath = path.join(implDir, skill);
  if (!fs.existsSync(filePath)) {
    console.log(`Missing core skill: ${skill} - needs to be created`);
  }
});

console.log('Fix complete!');