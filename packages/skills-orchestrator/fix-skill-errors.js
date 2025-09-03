const fs = require('fs');
const path = require('path');

// Files with specific issues
const skillsWithIssues = {
  'CsvParserSkill.ts': { field: 'rows', replacement: 'data' },
  'DataCleanerSkill.ts': { field: 'cleaned', replacement: 'data' },
  'EmailSenderSkill.ts': { field: 'messageId', replacement: 'data' },
  'EncryptorSkill.ts': { field: 'encrypted', replacement: 'data' },
  'EntityExtractorSkill.ts': { field: 'entities', replacement: 'data' },
  'HashGeneratorSkill.ts': { field: 'hash', replacement: 'data' },
  'InvoiceGeneratorSkill.ts': { field: 'invoiceId', replacement: 'data' },
  'JsonTransformerSkill.ts': { field: 'output', replacement: 'data' },
  'PasswordGeneratorSkill.ts': { field: 'password', replacement: 'data' },
  'PaymentProcessorSkill.ts': { field: 'transactionId', replacement: 'data' },
  'PdfGeneratorSkill.ts': { field: 'documentId', replacement: 'data' },
  'SentimentAnalyzerSkill.ts': { field: 'sentiment', replacement: 'data' },
  'SlackMessengerSkill.ts': { field: 'messageId', replacement: 'data' },
  'SmsGatewaySkill.ts': { field: 'messageId', replacement: 'data' },
  'TaskSchedulerSkill.ts': { field: 'taskId', replacement: 'data' },
  'TextClassifierSkill.ts': { field: 'category', replacement: 'data' },
  'WebScraperSkill.ts': { field: 'url', replacement: 'data' },
  'WorkflowEngineSkill.ts': { field: 'workflowId', replacement: 'data' }
};

const skillsDir = path.join(__dirname, 'src', 'skills', 'impl');

// Fix skills with incorrect return field names
Object.entries(skillsWithIssues).forEach(([file, info]) => {
  const filePath = path.join(skillsDir, file);
  
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Replace the specific field with 'data'
    const regex = new RegExp(`(\\s+)${info.field}:`, 'g');
    content = content.replace(regex, '$1data:');
    
    // Also wrap single values in an object if needed
    if (file === 'PasswordGeneratorSkill.ts' || file === 'HashGeneratorSkill.ts' || file === 'InvoiceGeneratorSkill.ts') {
      // Fix undefined result variable
      content = content.replace(/return result;/g, 'return { success: true, data: generatedValue };');
    }
    
    fs.writeFileSync(filePath, content);
    console.log(`Fixed: ${file}`);
  } else {
    console.log(`Not found: ${file}`);
  }
});

// Fix skills with extra method parameters
const skillsWithExtraParams = [
  'CalculatorSkill.ts',
  'CodeGeneratorSkill.ts',
  'CurrencyConverterSkill.ts',
  'DateCalculatorSkill.ts',
  'DnsResolverSkill.ts',
  'IpLookupSkill.ts',
  'RandomGeneratorSkill.ts',
  'ReverseGeocoderSkill.ts',
  'TimezoneConverterSkill.ts',
  'TokenGeneratorSkill.ts',
  'WhoisLookupSkill.ts'
];

skillsWithExtraParams.forEach(file => {
  const filePath = path.join(skillsDir, file);
  
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Fix method signatures with extra parameters
    content = content.replace(/async \w+\([^)]+,\s*\w+:\s*\w+\)/g, (match) => {
      // Remove the second parameter
      return match.replace(/,\s*\w+:\s*\w+\)/, ')');
    });
    
    fs.writeFileSync(filePath, content);
    console.log(`Fixed method signatures in: ${file}`);
  }
});

console.log('\nFixing complete!');