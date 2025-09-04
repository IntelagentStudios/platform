import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Customer feedback collection endpoint
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      productKey,
      sessionId,
      rating,        // 1-5 stars
      feedback,      // Text feedback
      responseTime,  // Perceived response time
      category,      // 'performance', 'accuracy', 'ui', 'other'
      wouldRecommend, // NPS score 0-10
      metadata = {}
    } = body;

    // Validate rating
    if (rating && (rating < 1 || rating > 5)) {
      return NextResponse.json({
        error: 'Rating must be between 1 and 5'
      }, { status: 400 });
    }

    // Store feedback in database
    const feedbackEntry = await prisma.chatbotConversation.create({
      data: {
        productKey: productKey || 'anonymous',
        sessionId: sessionId || `feedback-${Date.now()}`,
        userMessage: '[FEEDBACK]',
        botResponse: feedback || '',
        metadata: {
          type: 'feedback',
          rating,
          category,
          wouldRecommend,
          responseTime,
          timestamp: new Date().toISOString(),
          ...metadata
        }
      }
    });

    // Calculate sentiment if feedback text provided
    let sentiment = 'neutral';
    if (feedback) {
      const positiveWords = ['great', 'excellent', 'fast', 'helpful', 'amazing', 'love', 'perfect'];
      const negativeWords = ['slow', 'bad', 'terrible', 'broken', 'useless', 'hate', 'awful'];
      
      const lowerFeedback = feedback.toLowerCase();
      const positiveCount = positiveWords.filter(w => lowerFeedback.includes(w)).length;
      const negativeCount = negativeWords.filter(w => lowerFeedback.includes(w)).length;
      
      if (positiveCount > negativeCount) sentiment = 'positive';
      if (negativeCount > positiveCount) sentiment = 'negative';
    }

    // Trigger alerts for low ratings
    if (rating && rating <= 2) {
      console.error(`⚠️ Low rating received: ${rating}/5 for ${productKey}`);
      // In production, this would send alerts to Slack/email
    }

    return NextResponse.json({
      success: true,
      feedbackId: feedbackEntry.id,
      sentiment,
      message: 'Thank you for your feedback!'
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*'
      }
    });

  } catch (error) {
    console.error('Feedback submission error:', error);
    return NextResponse.json({
      error: 'Failed to submit feedback',
      message: error.message
    }, { status: 500 });
  }
}

// GET endpoint for feedback analysis
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '7d';
    const productKey = searchParams.get('productKey');
    
    // Calculate time range
    let since = new Date();
    switch(period) {
      case '24h':
        since.setHours(since.getHours() - 24);
        break;
      case '7d':
        since.setDate(since.getDate() - 7);
        break;
      case '30d':
        since.setDate(since.getDate() - 30);
        break;
    }

    // Query feedback from database
    const whereClause: any = {
      createdAt: { gte: since },
      userMessage: '[FEEDBACK]'
    };
    
    if (productKey) {
      whereClause.productKey = productKey;
    }

    const feedbackEntries = await prisma.chatbotConversation.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' }
    });

    // Analyze feedback
    const analysis = {
      period,
      totalFeedback: feedbackEntries.length,
      averageRating: 0,
      nps: 0,
      distribution: {
        5: 0,
        4: 0,
        3: 0,
        2: 0,
        1: 0
      },
      categories: {
        performance: 0,
        accuracy: 0,
        ui: 0,
        other: 0
      },
      sentiment: {
        positive: 0,
        neutral: 0,
        negative: 0
      },
      recommendations: {
        promoters: 0,    // 9-10
        passives: 0,     // 7-8
        detractors: 0    // 0-6
      }
    };

    // Process feedback
    let totalRating = 0;
    let ratingCount = 0;
    let totalNPS = 0;
    let npsCount = 0;

    feedbackEntries.forEach(entry => {
      const meta = entry.metadata as any;
      
      // Rating distribution
      if (meta?.rating) {
        totalRating += meta.rating;
        ratingCount++;
        analysis.distribution[meta.rating]++;
      }

      // Category distribution
      if (meta?.category) {
        analysis.categories[meta.category]++;
      }

      // NPS calculation
      if (meta?.wouldRecommend !== undefined) {
        totalNPS += meta.wouldRecommend;
        npsCount++;
        
        if (meta.wouldRecommend >= 9) {
          analysis.recommendations.promoters++;
        } else if (meta.wouldRecommend >= 7) {
          analysis.recommendations.passives++;
        } else {
          analysis.recommendations.detractors++;
        }
      }

      // Sentiment (would need more sophisticated analysis in production)
      const feedback = entry.botResponse?.toLowerCase() || '';
      if (feedback.includes('great') || feedback.includes('excellent') || meta?.rating >= 4) {
        analysis.sentiment.positive++;
      } else if (feedback.includes('bad') || feedback.includes('slow') || meta?.rating <= 2) {
        analysis.sentiment.negative++;
      } else {
        analysis.sentiment.neutral++;
      }
    });

    // Calculate averages
    if (ratingCount > 0) {
      analysis.averageRating = Math.round((totalRating / ratingCount) * 10) / 10;
    }

    if (npsCount > 0) {
      // NPS = % promoters - % detractors
      const promoterPercent = (analysis.recommendations.promoters / npsCount) * 100;
      const detractorPercent = (analysis.recommendations.detractors / npsCount) * 100;
      analysis.nps = Math.round(promoterPercent - detractorPercent);
    }

    // Add recent feedback samples
    const recentFeedback = feedbackEntries.slice(0, 5).map(entry => {
      const meta = entry.metadata as any;
      return {
        id: entry.id,
        timestamp: entry.createdAt,
        rating: meta?.rating,
        category: meta?.category,
        feedback: entry.botResponse,
        productKey: entry.productKey
      };
    });

    // Generate insights
    const insights = [];
    
    if (analysis.averageRating < 3.5) {
      insights.push('⚠️ Average rating below target (3.5). Review recent feedback.');
    }
    
    if (analysis.nps < 0) {
      insights.push('❌ Negative NPS score. More detractors than promoters.');
    } else if (analysis.nps > 50) {
      insights.push('✅ Excellent NPS score! Customers are highly satisfied.');
    }
    
    if (analysis.categories.performance > feedbackEntries.length * 0.3) {
      insights.push('📊 Performance is a major concern for customers.');
    }

    return NextResponse.json({
      success: true,
      analysis,
      recentFeedback,
      insights,
      timestamp: new Date().toISOString()
    }, {
      headers: {
        'Cache-Control': 'max-age=300' // Cache for 5 minutes
      }
    });

  } catch (error) {
    console.error('Feedback analysis error:', error);
    return NextResponse.json({
      error: 'Failed to analyze feedback',
      message: error.message
    }, { status: 500 });
  }
}