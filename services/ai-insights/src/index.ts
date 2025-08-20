import express from 'express';
import { OpenAI } from 'openai';
import { Queue } from 'bull';
import Redis from 'ioredis';
import cron from 'node-cron';
import { InsightsEngine } from './engines/insights-engine';
import { PatternDetector } from './engines/pattern-detector';
import { PredictionEngine } from './engines/prediction-engine';
import { RecommendationEngine } from './engines/recommendation-engine';
import { CrossProductAnalyzer } from './analyzers/cross-product-analyzer';
import { validateLicense } from './middleware/license-validation';
import { insightsRouter } from './routes/insights';
import { analyticsRouter } from './routes/analytics';
import { predictionsRouter } from './routes/predictions';

const app = express();
app.use(express.json());

// Initialize Redis
const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD
});

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Initialize Queue for background processing
const insightsQueue = new Queue('ai-insights', {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD
  }
});

// Initialize engines
const insightsEngine = new InsightsEngine(openai, redis);
const patternDetector = new PatternDetector();
const predictionEngine = new PredictionEngine();
const recommendationEngine = new RecommendationEngine(openai);
const crossProductAnalyzer = new CrossProductAnalyzer();

// Middleware
app.use('/api/insights', validateLicense('ai_insights'));

// Routes
app.use('/api/insights', insightsRouter(insightsEngine, recommendationEngine));
app.use('/api/analytics', analyticsRouter(crossProductAnalyzer));
app.use('/api/predictions', predictionsRouter(predictionEngine));

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'ai-insights',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Background job processing
insightsQueue.process('generate-insights', async (job) => {
  const { licenseKey, timeRange, products } = job.data;
  
  try {
    // Fetch data from all products
    const productData = await crossProductAnalyzer.fetchProductData(licenseKey, products);
    
    // Detect patterns
    const patterns = await patternDetector.analyze(productData);
    
    // Generate predictions
    const predictions = await predictionEngine.generatePredictions(productData, patterns);
    
    // Create insights
    const insights = await insightsEngine.generateInsights({
      licenseKey,
      productData,
      patterns,
      predictions,
      timeRange
    });
    
    // Generate recommendations
    const recommendations = await recommendationEngine.generate(insights);
    
    // Store results
    await redis.setex(
      `insights:${licenseKey}:latest`,
      3600, // Cache for 1 hour
      JSON.stringify({
        insights,
        recommendations,
        patterns,
        predictions,
        generated_at: new Date().toISOString()
      })
    );
    
    return { success: true, insights: insights.length };
  } catch (error) {
    console.error('Insight generation failed:', error);
    throw error;
  }
});

// Scheduled tasks
// Run daily insights generation for all premium licenses
cron.schedule('0 2 * * *', async () => {
  console.log('Running daily insights generation...');
  
  try {
    // Fetch all premium licenses
    const premiumLicenses = await fetchPremiumLicenses();
    
    for (const license of premiumLicenses) {
      await insightsQueue.add('generate-insights', {
        licenseKey: license.license_key,
        timeRange: { days: 30 },
        products: license.products
      });
    }
  } catch (error) {
    console.error('Daily insights generation failed:', error);
  }
});

// Real-time anomaly detection
app.post('/api/insights/detect-anomaly', validateLicense('ai_insights'), async (req, res) => {
  try {
    const { metric, value, context } = req.body;
    const licenseKey = req.headers['x-license-key'];
    
    // Quick anomaly detection
    const isAnomaly = await patternDetector.detectAnomaly({
      licenseKey,
      metric,
      value,
      context
    });
    
    if (isAnomaly) {
      // Generate immediate insight
      const insight = await insightsEngine.generateAnomalyInsight({
        licenseKey,
        metric,
        value,
        context
      });
      
      // Generate recommendations
      const recommendations = await recommendationEngine.generateForAnomaly(insight);
      
      res.json({
        anomaly_detected: true,
        insight,
        recommendations,
        severity: insight.severity
      });
    } else {
      res.json({
        anomaly_detected: false,
        message: 'Metric within normal range'
      });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Natural language query endpoint
app.post('/api/insights/query', validateLicense('ai_insights'), async (req, res) => {
  try {
    const { query, context } = req.body;
    const licenseKey = req.headers['x-license-key'];
    
    // Process natural language query
    const response = await insightsEngine.processNaturalQuery({
      licenseKey,
      query,
      context
    });
    
    res.json(response);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Cross-product correlation finder
app.get('/api/insights/correlations', validateLicense('ai_insights'), async (req, res) => {
  try {
    const licenseKey = req.headers['x-license-key'];
    const { products, metrics, timeRange } = req.query;
    
    const correlations = await crossProductAnalyzer.findCorrelations({
      licenseKey,
      products: products?.split(','),
      metrics: metrics?.split(','),
      timeRange
    });
    
    res.json({ correlations });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Predictive alerts setup
app.post('/api/insights/alerts', validateLicense('ai_insights'), async (req, res) => {
  try {
    const { metric, threshold, direction, notification_channels } = req.body;
    const licenseKey = req.headers['x-license-key'];
    
    const alert = await predictionEngine.createPredictiveAlert({
      licenseKey,
      metric,
      threshold,
      direction,
      notification_channels
    });
    
    res.json({ alert });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Export insights report
app.get('/api/insights/export', validateLicense('ai_insights'), async (req, res) => {
  try {
    const licenseKey = req.headers['x-license-key'];
    const { format = 'pdf', timeRange = '30d', products } = req.query;
    
    const report = await insightsEngine.generateReport({
      licenseKey,
      format,
      timeRange,
      products: products?.split(',')
    });
    
    if (format === 'pdf') {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=insights-report.pdf');
    } else if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=insights-report.csv');
    }
    
    res.send(report);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Helper function to fetch premium licenses
async function fetchPremiumLicenses() {
  // This would connect to your database
  // For now, returning mock data
  return [
    {
      license_key: 'XXXX-XXXX-XXXX-XXXX',
      products: ['chatbot', 'sales_agent', 'setup_agent'],
      plan_tier: 'professional'
    }
  ];
}

const PORT = process.env.AI_INSIGHTS_PORT || 3005;
app.listen(PORT, () => {
  console.log(`AI Insights Service running on port ${PORT}`);
  console.log('Background job processor active');
  console.log('Scheduled tasks initialized');
});