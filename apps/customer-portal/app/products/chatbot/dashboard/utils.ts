/**
 * Utility functions for the chatbot dashboard
 */

/**
 * Extract the main topic or question type from a conversation
 */
export function extractTopic(messages: any[]): string {
  if (!messages || messages.length === 0) return 'General Inquiry';
  
  // Get first user message
  const firstUserMessage = messages.find(m => m.role === 'user');
  if (!firstUserMessage) return 'General Inquiry';
  
  const content = firstUserMessage.content?.toLowerCase() || '';
  
  // Define topic patterns and their labels
  const topicPatterns = [
    { pattern: /price|cost|pricing|pay|fee|charge|expensive/i, label: 'Pricing Question' },
    { pattern: /feature|function|capability|can it|does it|will it/i, label: 'Feature Inquiry' },
    { pattern: /help|support|issue|problem|error|bug|broken|fix/i, label: 'Support Request' },
    { pattern: /how to|how do|how can|tutorial|guide|setup|install/i, label: 'How-To Guide' },
    { pattern: /demo|trial|test|try|sample/i, label: 'Demo Request' },
    { pattern: /integrate|integration|api|connect|webhook/i, label: 'Integration' },
    { pattern: /account|login|password|sign|register/i, label: 'Account Issue' },
    { pattern: /refund|cancel|subscription|billing/i, label: 'Billing' },
    { pattern: /contact|email|phone|call|reach/i, label: 'Contact Request' },
    { pattern: /about|who|what is|company|business/i, label: 'About Company' },
    { pattern: /product|service|offer|solution/i, label: 'Product Info' },
    { pattern: /thank|thanks|appreciate|great|good/i, label: 'Feedback' },
  ];
  
  // Check each pattern
  for (const { pattern, label } of topicPatterns) {
    if (pattern.test(content)) {
      return label;
    }
  }
  
  // If no pattern matches, return Undefined
  return 'Undefined';
}

/**
 * Format a conversation title with time and topic
 */
export function formatConversationTitle(conversation: any): {
  title: string;
  subtitle: string;
  topic: string;
  time: string;
} {
  const messages = conversation.messages || [];
  const topic = extractTopic(messages);
  
  // Format time
  const date = new Date(conversation.created_at || conversation.first_message_at);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  let timeStr;
  if (diffMins < 1) {
    timeStr = 'Just now';
  } else if (diffMins < 60) {
    timeStr = `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
  } else if (diffHours < 24) {
    timeStr = `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  } else if (diffDays < 7) {
    timeStr = `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  } else {
    timeStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
  
  // Get time of day for title
  const timeOfDay = date.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  });
  
  return {
    title: `${topic}`,
    subtitle: `${timeOfDay} • ${messages.length} messages`,
    topic,
    time: timeStr
  };
}

/**
 * Get conversation duration in human-readable format
 */
export function getConversationDuration(messages: any[]): string {
  if (!messages || messages.length < 2) return 'Quick chat';
  
  const first = new Date(messages[0].timestamp || messages[0].created_at);
  const last = new Date(messages[messages.length - 1].timestamp || messages[messages.length - 1].created_at);
  
  const durationMs = last.getTime() - first.getTime();
  const durationMins = Math.floor(durationMs / 60000);
  
  if (durationMins < 1) return 'Quick chat';
  if (durationMins < 60) return `${durationMins} min conversation`;
  
  const hours = Math.floor(durationMins / 60);
  return `${hours} hour conversation`;
}

/**
 * Get conversation sentiment based on messages
 */
export function getConversationSentiment(messages: any[]): 'positive' | 'neutral' | 'negative' {
  if (!messages || messages.length === 0) return 'neutral';
  
  const lastUserMessage = [...messages].reverse().find(m => m.role === 'user');
  if (!lastUserMessage) return 'neutral';
  
  const content = lastUserMessage.content?.toLowerCase() || '';
  
  // Positive indicators
  const positiveWords = ['thank', 'thanks', 'great', 'excellent', 'perfect', 'helpful', 'awesome', 'good', 'appreciate'];
  const negativeWords = ['bad', 'terrible', 'awful', 'horrible', 'useless', 'worst', 'hate', 'angry', 'frustrated'];
  
  const hasPositive = positiveWords.some(word => content.includes(word));
  const hasNegative = negativeWords.some(word => content.includes(word));
  
  if (hasPositive && !hasNegative) return 'positive';
  if (hasNegative && !hasPositive) return 'negative';
  
  return 'neutral';
}

/**
 * Group conversations by date
 */
export function groupConversationsByDate(conversations: any[]): Record<string, any[]> {
  const groups: Record<string, any[]> = {};
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  conversations.forEach(conv => {
    const date = new Date(conv.created_at || conv.first_message_at);
    const convDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    let groupKey;
    if (convDate.getTime() === today.getTime()) {
      groupKey = 'Today';
    } else if (convDate.getTime() === yesterday.getTime()) {
      groupKey = 'Yesterday';
    } else if (convDate > new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)) {
      groupKey = date.toLocaleDateString('en-US', { weekday: 'long' });
    } else {
      groupKey = date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
    }
    
    if (!groups[groupKey]) {
      groups[groupKey] = [];
    }
    groups[groupKey].push(conv);
  });
  
  return groups;
}

/**
 * Get unique topics from conversations
 */
export function getUniqueTopics(conversations: any[]): string[] {
  const topics = new Set<string>();
  
  conversations.forEach(conv => {
    const topic = extractTopic(conv.messages || []);
    topics.add(topic);
  });
  
  return Array.from(topics).sort();
}

/**
 * Parse message content and identify URLs
 */
export function parseMessageContent(content: string): { text: string; isLink: boolean }[] {
  if (!content) return [{ text: content, isLink: false }];
  
  // Regular expression to match URLs
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = content.split(urlRegex);
  
  return parts.map(part => ({
    text: part,
    isLink: urlRegex.test(part)
  }));
}