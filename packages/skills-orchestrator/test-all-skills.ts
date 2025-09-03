/**
 * Comprehensive Skill Testing Framework
 * Tests all skills to ensure they are fully operational
 */

import { SkillExecutionEngine } from './src/core/SkillExecutionEngine';

interface TestResult {
  skill: string;
  category: string;
  success: boolean;
  executionTime: number;
  error?: string;
  result?: any;
}

async function testAllSkills() {
  console.log('🚀 COMPREHENSIVE SKILL TESTING');
  console.log('=' .repeat(70));
  console.log('Testing all skills with real implementations...\n');
  
  const engine = SkillExecutionEngine.getInstance();
  const results: TestResult[] = [];
  
  // Define all skills to test with categories
  const skillTests = [
    // COMMUNICATION (15 skills)
    { name: 'email_sender', category: 'Communication', params: { to: 'test@example.com', subject: 'Test', message: 'Test email' } },
    { name: 'sms_gateway', category: 'Communication', params: { to: '+1234567890', message: 'Test SMS' } },
    { name: 'slack_messenger', category: 'Communication', params: { channel: '#general', message: 'Test' } },
    { name: 'discord_bot', category: 'Communication', params: { server: 'test', channel: 'general', message: 'Test' } },
    { name: 'telegram_bot', category: 'Communication', params: { chatId: '123', message: 'Test' } },
    { name: 'whatsapp_gateway', category: 'Communication', params: { to: '+1234567890', message: 'Test' } },
    { name: 'teams_connector', category: 'Communication', params: { channel: 'General', message: 'Test' } },
    { name: 'push_notifier', category: 'Communication', params: { title: 'Test', body: 'Test notification' } },
    { name: 'voice_caller', category: 'Communication', params: { to: '+1234567890', message: 'Test call' } },
    { name: 'video_conferencer', category: 'Communication', params: { roomName: 'test-room' } },
    { name: 'calendar_sync', category: 'Communication', params: { event: { title: 'Test', date: new Date() } } },
    { name: 'social_poster', category: 'Communication', params: { platform: 'twitter', message: 'Test post' } },
    { name: 'rss_publisher', category: 'Communication', params: { title: 'Test', content: 'Test RSS' } },
    { name: 'comment_manager', category: 'Communication', params: { action: 'post', comment: 'Test comment' } },
    { name: 'notification_hub', category: 'Communication', params: { channels: ['email', 'sms'], message: 'Test' } },
    
    // DATA PROCESSING (20 skills)
    { name: 'pdf_generator', category: 'Data Processing', params: { content: 'Test PDF content' } },
    { name: 'pdf_extractor', category: 'Data Processing', params: { pdfBuffer: Buffer.from('test') } },
    { name: 'excel_processor', category: 'Data Processing', params: { action: 'read', sheetName: 'Sheet1' } },
    { name: 'csv_parser', category: 'Data Processing', params: { csvData: 'name,age\nJohn,30' } },
    { name: 'json_transformer', category: 'Data Processing', params: { input: { a: 1 }, operation: 'transform' } },
    { name: 'xml_processor', category: 'Data Processing', params: { xml: '<root>test</root>', action: 'parse' } },
    { name: 'data_cleaner', category: 'Data Processing', params: { data: { a: null, b: '  test  ' } } },
    { name: 'data_merger', category: 'Data Processing', params: { source: [1, 2], target: [3, 4] } },
    { name: 'data_splitter', category: 'Data Processing', params: { data: [1, 2, 3, 4], parts: 2 } },
    { name: 'data_aggregator', category: 'Data Processing', params: { data: [1, 2, 3], method: 'sum' } },
    { name: 'deduplicator', category: 'Data Processing', params: { data: [1, 1, 2, 3, 3] } },
    { name: 'data_validator', category: 'Data Processing', params: { data: { email: 'test@test.com' }, rules: {} } },
    { name: 'file_compressor', category: 'Data Processing', params: { file: 'test.txt', method: 'gzip' } },
    { name: 'file_converter', category: 'Data Processing', params: { from: 'txt', to: 'pdf' } },
    { name: 'text_encoder', category: 'Data Processing', params: { text: 'Test', encoding: 'base64' } },
    { name: 'base64_handler', category: 'Data Processing', params: { action: 'encode', data: 'test' } },
    { name: 'regex_matcher', category: 'Data Processing', params: { pattern: '\\d+', text: '123 test' } },
    { name: 'barcode_scanner', category: 'Data Processing', params: { image: 'barcode.png' } },
    { name: 'qr_generator', category: 'Data Processing', params: { data: 'https://example.com' } },
    { name: 'barcode_generator', category: 'Data Processing', params: { data: '123456789' } },
    
    // AI & ANALYTICS (20 skills)
    { name: 'text_classifier', category: 'AI/Analytics', params: { text: 'Great product!', categories: ['positive', 'negative'] } },
    { name: 'sentiment_analyzer', category: 'AI/Analytics', params: { text: 'I love this!' } },
    { name: 'entity_extractor', category: 'AI/Analytics', params: { text: 'Contact john@example.com' } },
    { name: 'keyword_extractor', category: 'AI/Analytics', params: { text: 'Important keywords in this text' } },
    { name: 'language_detector', category: 'AI/Analytics', params: { text: 'Hello world' } },
    { name: 'translator', category: 'AI/Analytics', params: { text: 'Hello', from: 'en', to: 'es' } },
    { name: 'content_generator', category: 'AI/Analytics', params: { prompt: 'Write about AI' } },
    { name: 'text_summarizer', category: 'AI/Analytics', params: { text: 'Long text to summarize...' } },
    { name: 'image_classifier', category: 'AI/Analytics', params: { image: 'test.jpg' } },
    { name: 'object_detector', category: 'AI/Analytics', params: { image: 'test.jpg' } },
    { name: 'face_detector', category: 'AI/Analytics', params: { image: 'face.jpg' } },
    { name: 'emotion_analyzer', category: 'AI/Analytics', params: { text: 'I am so happy!' } },
    { name: 'ocr_scanner', category: 'AI/Analytics', params: { image: 'text.jpg' } },
    { name: 'speech_to_text', category: 'AI/Analytics', params: { audio: 'speech.wav' } },
    { name: 'text_to_speech', category: 'AI/Analytics', params: { text: 'Hello world' } },
    { name: 'anomaly_detector', category: 'AI/Analytics', params: { data: [1, 2, 3, 100, 4, 5] } },
    { name: 'pattern_recognizer', category: 'AI/Analytics', params: { data: [1, 2, 1, 2, 1, 2] } },
    { name: 'prediction_engine', category: 'AI/Analytics', params: { data: [1, 2, 3, 4], predict: 1 } },
    { name: 'recommendation_system', category: 'AI/Analytics', params: { user: 'user1', items: ['item1', 'item2'] } },
    { name: 'intent_classifier', category: 'AI/Analytics', params: { text: 'I want to buy a product' } },
    
    // AUTOMATION (15 skills)
    { name: 'task_scheduler', category: 'Automation', params: { task: { name: 'Test' }, delay: 1000 } },
    { name: 'workflow_engine', category: 'Automation', params: { steps: [{ type: 'http' }] } },
    { name: 'web_scraper', category: 'Automation', params: { url: 'https://example.com' } },
    { name: 'browser_automator', category: 'Automation', params: { actions: [{ type: 'click' }] } },
    { name: 'file_watcher', category: 'Automation', params: { path: '/test', patterns: ['*.txt'] } },
    { name: 'webhook_handler', category: 'Automation', params: { endpoint: '/webhook', method: 'POST' } },
    { name: 'event_listener', category: 'Automation', params: { event: 'test_event' } },
    { name: 'backup_manager', category: 'Automation', params: { source: '/data', destination: '/backup' } },
    { name: 'deployment_tool', category: 'Automation', params: { app: 'test-app', environment: 'staging' } },
    { name: 'test_runner', category: 'Automation', params: { tests: ['test1.js'] } },
    { name: 'ci_cd_pipeline', category: 'Automation', params: { stages: ['build', 'test', 'deploy'] } },
    { name: 'form_filler', category: 'Automation', params: { form: { name: 'John', email: 'john@test.com' } } },
    { name: 'data_pipeline', category: 'Automation', params: { source: 'db', destination: 'warehouse' } },
    { name: 'etl_processor', category: 'Automation', params: { extract: 'db', transform: 'clean', load: 'warehouse' } },
    { name: 'batch_processor', category: 'Automation', params: { items: [1, 2, 3], batchSize: 2 } },
    
    // BUSINESS (20 skills)
    { name: 'invoice_generator', category: 'Business', params: { customer: { name: 'ACME' }, items: [{ name: 'Service', price: 100, quantity: 1 }] } },
    { name: 'payment_processor', category: 'Business', params: { amount: 100, currency: 'USD', customerId: 'cust_123' } },
    { name: 'subscription_manager', category: 'Business', params: { plan: 'monthly', customerId: 'cust_123' } },
    { name: 'billing_system', category: 'Business', params: { action: 'charge', amount: 100 } },
    { name: 'customer_manager', category: 'Business', params: { action: 'create', customer: { name: 'John Doe' } } },
    { name: 'order_processor', category: 'Business', params: { items: [{ name: 'Product', price: 50, quantity: 2 }], customer: {} } },
    { name: 'inventory_tracker', category: 'Business', params: { action: 'check', sku: 'PROD-001' } },
    { name: 'shipping_calculator', category: 'Business', params: { weight: 5, destination: 'NY' } },
    { name: 'tax_calculator', category: 'Business', params: { amount: 100, region: 'CA' } },
    { name: 'revenue_tracker', category: 'Business', params: { period: 'monthly' } },
    { name: 'expense_tracker', category: 'Business', params: { category: 'operations', amount: 500 } },
    { name: 'budget_planner', category: 'Business', params: { period: 'quarterly', amount: 10000 } },
    { name: 'financial_analyzer', category: 'Business', params: { metrics: ['revenue', 'profit'] } },
    { name: 'project_manager', category: 'Business', params: { project: { name: 'New Feature' }, tasks: [] } },
    { name: 'task_tracker', category: 'Business', params: { task: { title: 'Complete feature' } } },
    { name: 'time_tracker', category: 'Business', params: { project: 'Project A', hours: 8 } },
    { name: 'employee_manager', category: 'Business', params: { action: 'add', employee: { name: 'Jane' } } },
    { name: 'payroll_processor', category: 'Business', params: { employees: [], period: 'biweekly' } },
    { name: 'contract_manager', category: 'Business', params: { contract: { title: 'Service Agreement' } } },
    { name: 'proposal_generator', category: 'Business', params: { client: 'ACME', services: [] } },
    
    // UTILITY (20 skills)
    { name: 'password_generator', category: 'Utility', params: { length: 16 } },
    { name: 'uuid_generator', category: 'Utility', params: { version: 'v4' } },
    { name: 'hash_generator', category: 'Utility', params: { data: 'test', algorithm: 'sha256' } },
    { name: 'encryptor', category: 'Utility', params: { data: 'secret' } },
    { name: 'decryptor', category: 'Utility', params: { encrypted: 'xxx', key: 'key', iv: 'iv' } },
    { name: 'url_shortener', category: 'Utility', params: { url: 'https://example.com/very/long/url' } },
    { name: 'color_converter', category: 'Utility', params: { color: '#FF0000', from: 'hex', to: 'rgb' } },
    { name: 'unit_converter', category: 'Utility', params: { value: 100, from: 'kg', to: 'lbs' } },
    { name: 'currency_converter', category: 'Utility', params: { amount: 100, from: 'USD', to: 'EUR' } },
    { name: 'timezone_converter', category: 'Utility', params: { time: '12:00', from: 'EST', to: 'PST' } },
    { name: 'date_calculator', category: 'Utility', params: { date: new Date(), operation: 'add', days: 7 } },
    { name: 'calculator', category: 'Utility', params: { expression: '2 + 2 * 3' } },
    { name: 'random_generator', category: 'Utility', params: { type: 'number', min: 1, max: 100 } },
    { name: 'geocoder', category: 'Utility', params: { address: '123 Main St, NY' } },
    { name: 'reverse_geocoder', category: 'Utility', params: { lat: 40.7128, lng: -74.0060 } },
    { name: 'ip_lookup', category: 'Utility', params: { ip: '8.8.8.8' } },
    { name: 'dns_resolver', category: 'Utility', params: { domain: 'example.com' } },
    { name: 'whois_lookup', category: 'Utility', params: { domain: 'example.com' } },
    { name: 'weather_service', category: 'Utility', params: { location: 'New York' } },
    { name: 'stock_tracker', category: 'Utility', params: { symbol: 'AAPL' } }
  ];
  
  // Test each skill
  console.log(`Testing ${skillTests.length} skills...\n`);
  
  for (const test of skillTests) {
    const startTime = Date.now();
    
    try {
      const result = await engine.executeSkill(test.name, {
        ...test.params,
        _context: { licenseKey: 'TEST_LICENSE', taskId: 'TEST_001' }
      });
      
      const executionTime = Date.now() - startTime;
      
      results.push({
        skill: test.name,
        category: test.category,
        success: result.success,
        executionTime,
        result: result.data
      });
      
      // Show progress
      process.stdout.write(result.success ? '✅' : '❌');
      
    } catch (error: any) {
      const executionTime = Date.now() - startTime;
      
      results.push({
        skill: test.name,
        category: test.category,
        success: false,
        executionTime,
        error: error.message
      });
      
      process.stdout.write('❌');
    }
  }
  
  console.log('\n\n' + '=' .repeat(70));
  console.log('📊 TEST RESULTS\n');
  
  // Group results by category
  const categories: Record<string, TestResult[]> = {};
  results.forEach(result => {
    if (!categories[result.category]) {
      categories[result.category] = [];
    }
    categories[result.category].push(result);
  });
  
  // Display results by category
  Object.entries(categories).forEach(([category, categoryResults]) => {
    const successful = categoryResults.filter(r => r.success).length;
    const total = categoryResults.length;
    const percentage = ((successful / total) * 100).toFixed(1);
    
    console.log(`\n📁 ${category} (${successful}/${total} - ${percentage}%)`);
    console.log('-'.repeat(50));
    
    categoryResults.forEach(result => {
      const status = result.success ? '✅' : '❌';
      const time = `${result.executionTime}ms`;
      console.log(`${status} ${result.skill.padEnd(25)} ${time.padStart(8)}`);
    });
  });
  
  // Overall summary
  const totalSuccessful = results.filter(r => r.success).length;
  const totalFailed = results.filter(r => !r.success).length;
  const overallPercentage = ((totalSuccessful / results.length) * 100).toFixed(1);
  const avgExecutionTime = (results.reduce((sum, r) => sum + r.executionTime, 0) / results.length).toFixed(1);
  
  console.log('\n' + '=' .repeat(70));
  console.log('📈 OVERALL SUMMARY\n');
  console.log(`Total Skills Tested: ${results.length}`);
  console.log(`✅ Successful: ${totalSuccessful}`);
  console.log(`❌ Failed: ${totalFailed}`);
  console.log(`Success Rate: ${overallPercentage}%`);
  console.log(`Average Execution Time: ${avgExecutionTime}ms`);
  
  // Get execution statistics
  const stats = engine.getStatistics();
  console.log(`\nExecution History Tracked: ${Object.keys(stats).length} skills`);
  
  // Show available skills
  const availableSkills = engine.getAvailableSkills();
  console.log(`\nTotal Available Skills in Engine: ${availableSkills.length}`);
  
  if (overallPercentage === '100.0') {
    console.log('\n🎉 PERFECT SCORE! All skills are fully operational!');
    console.log('✨ The Intelagent Platform is ready for production!');
  } else {
    console.log('\n⚠️ Some skills need attention. Check the failed tests above.');
  }
  
  console.log('\n' + '=' .repeat(70));
  console.log('✅ Testing complete!\n');
}

// Run the tests
testAllSkills().catch(console.error);