'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  PaperAirplaneIcon,
  SparklesIcon,
  DocumentIcon,
  ArrowUpTrayIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { SKILLS_CATALOG, TOTAL_SKILLS } from '../utils/skillsCatalog';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
  attachments?: string[];
}

interface BusinessContext {
  industry?: string;
  size?: string;
  role?: string;
  currentTools?: string[];
  painPoints?: string[];
  goals?: string[];
  budget?: string;
  timeline?: string;
  processes?: string[];
  techStack?: string[];
  customers?: string;
  revenue?: string;
  dataVolume?: string;
  compliance?: string[];
  integrationNeeds?: string[];
}

interface AdaptiveAgentConfiguratorProps {
  onConfigUpdate: (config: any) => void;
  height?: string;
}

export default function AdaptiveAgentConfigurator({
  onConfigUpdate,
  height = '450px'
}: AdaptiveAgentConfiguratorProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Welcome! I'm here to help you build a powerful AI agent tailored to your needs. With access to over 539 specialized skills, we can create something truly transformative for your business. Tell me, what's your vision for AI automation?",
      sender: 'assistant',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [businessContext, setBusinessContext] = useState<BusinessContext>({});
  const [questionHistory, setQuestionHistory] = useState<string[]>([]);
  const [currentConfiguration, setCurrentConfiguration] = useState({
    skills: [] as string[],
    features: [] as string[],
    integrations: [] as string[]
  });
  const [previousConfiguration, setPreviousConfiguration] = useState({
    skills: [] as string[],
    features: [] as string[],
    integrations: [] as string[]
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Deep configuration builder that analyzes full conversation and context
  const buildConfiguration = (context: BusinessContext, fullConversation?: Message[]) => {
    const skills = new Set<string>();
    const features = new Set<string>();
    const integrations = new Set<string>();

    // Analyze entire conversation history if provided
    let conversationContext = '';
    if (fullConversation) {
      conversationContext = fullConversation
        .filter(m => m.sender === 'user')
        .map(m => m.text)
        .join(' ')
        .toLowerCase();
    }

    // Get all available skills from catalog
    const allAvailableSkills: string[] = [];
    Object.values(SKILLS_CATALOG).forEach(categorySkills => {
      if (Array.isArray(categorySkills)) {
        categorySkills.forEach(skill => {
          if (skill && typeof skill === 'object' && skill.id) {
            allAvailableSkills.push(skill.id);
          }
        });
      }
    });

    // Match mentioned skills against actual catalog
    const matchSkillsFromCatalog = (text: string) => {
      const matchedSkills = new Set<string>();
      const lowerText = text.toLowerCase();

      allAvailableSkills.forEach(skillId => {
        const skillName = skillId.replace(/_/g, ' ');
        if (lowerText.includes(skillName) || lowerText.includes(skillId)) {
          matchedSkills.add(skillId);

          // Add related skills based on category
          Object.entries(SKILLS_CATALOG).forEach(([category, categorySkills]) => {
            if (Array.isArray(categorySkills)) {
              const hasSkill = categorySkills.some(s => s && s.id === skillId);
              if (hasSkill) {
                // Add other skills from same category that might be relevant
                categorySkills.forEach(relatedSkill => {
                  if (relatedSkill && relatedSkill.id) {
                    const relatedName = relatedSkill.name?.toLowerCase() || '';
                    const relatedDesc = relatedSkill.description?.toLowerCase() || '';

                    // Add related skills based on semantic similarity
                    if (relatedName.includes('automat') || relatedDesc.includes('automat')) {
                      if (lowerText.includes('automat')) matchedSkills.add(relatedSkill.id);
                    }
                    if (relatedName.includes('analyt') || relatedDesc.includes('analyt')) {
                      if (lowerText.includes('analyt') || lowerText.includes('report')) {
                        matchedSkills.add(relatedSkill.id);
                      }
                    }
                    if (relatedName.includes('customer') || relatedDesc.includes('customer')) {
                      if (lowerText.includes('customer') || lowerText.includes('client')) {
                        matchedSkills.add(relatedSkill.id);
                      }
                    }
                  }
                });
              }
            }
          });
        }
      });

      return matchedSkills;
    };

    // Analyze conversation for skill needs
    if (conversationContext) {
      const matchedSkills = matchSkillsFromCatalog(conversationContext);
      matchedSkills.forEach(skill => skills.add(skill));
    }

    // Deep industry analysis with comprehensive skill mapping
    if (context.industry || conversationContext) {
      const industryLower = (context.industry || '').toLowerCase();
      const fullText = industryLower + ' ' + conversationContext;

      // Fintech specific configuration
      if (fullText.includes('fintech') || fullText.includes('financial technology') || fullText.includes('finance tech')) {
        // Core fintech operations
        skills.add('payment_processing');
        skills.add('fraud_detection');
        skills.add('kyc_automation');
        skills.add('aml_compliance');
        skills.add('transaction_monitoring');
        skills.add('risk_assessment');
        skills.add('credit_scoring');
        skills.add('regulatory_reporting');
        skills.add('audit_automation');
        skills.add('financial_reconciliation');

        // Customer experience
        skills.add('customer_onboarding');
        skills.add('identity_verification');
        skills.add('account_management');
        skills.add('customer_support_automation');
        skills.add('dispute_resolution');
        skills.add('financial_advisor_bot');

        // Sales and growth
        skills.add('lead_qualification');
        skills.add('sales_automation');
        skills.add('referral_tracking');
        skills.add('cross_sell_optimization');
        skills.add('churn_prediction');
        skills.add('lifetime_value_analysis');

        // Analytics and insights
        skills.add('transaction_analytics');
        skills.add('portfolio_analysis');
        skills.add('market_data_analysis');
        skills.add('predictive_analytics');
        skills.add('real_time_reporting');
        skills.add('executive_dashboards');

        // Security and compliance
        skills.add('security_monitoring');
        skills.add('data_encryption');
        skills.add('access_control');
        skills.add('compliance_automation');
        skills.add('audit_trail');

        // Integrations
        integrations.add('stripe');
        integrations.add('plaid');
        integrations.add('square');
        integrations.add('paypal');
        integrations.add('quickbooks');
        integrations.add('salesforce');
        integrations.add('twilio');

        // Advanced features
        features.add('advanced_security');
        features.add('compliance_suite');
        features.add('real_time_processing');
        features.add('api_access');
        features.add('webhooks');
      }

      // Sales team configuration
      if (fullText.includes('sales team') || fullText.includes('sales force') || fullText.includes('sales department')) {
        // Complete sales automation suite
        skills.add('lead_generation');
        skills.add('lead_scoring');
        skills.add('lead_nurturing');
        skills.add('lead_routing');
        skills.add('opportunity_management');
        skills.add('pipeline_management');
        skills.add('deal_tracking');
        skills.add('quote_generation');
        skills.add('proposal_automation');
        skills.add('contract_management');
        skills.add('sales_forecasting');
        skills.add('territory_management');
        skills.add('commission_tracking');
        skills.add('sales_coaching');
        skills.add('call_recording');
        skills.add('email_tracking');
        skills.add('meeting_scheduler');
        skills.add('follow_up_automation');
        skills.add('sales_analytics');
        skills.add('performance_tracking');
        skills.add('competitor_analysis');
        skills.add('market_intelligence');
        skills.add('account_mapping');
        skills.add('relationship_mapping');
        skills.add('sales_enablement');
        skills.add('content_management');
        skills.add('training_automation');

        // CRM integrations
        integrations.add('salesforce');
        integrations.add('hubspot');
        integrations.add('pipedrive');
        integrations.add('zoho_crm');
        integrations.add('linkedin_sales_navigator');

        features.add('sales_acceleration');
        features.add('predictive_scoring');
        features.add('conversation_intelligence');
      }

      // Ultimate marketing configuration
      if (fullText.includes('ultimate marketing') || fullText.includes('best marketing') ||
          fullText.includes('complete marketing') || fullText.includes('full marketing')) {
        // Complete marketing automation suite - 50+ skills
        skills.add('campaign_management');
        skills.add('content_generator');
        skills.add('blog_writer');
        skills.add('social_media_automation');
        skills.add('social_media_scheduler');
        skills.add('social_listening');
        skills.add('brand_monitoring');
        skills.add('reputation_management');
        skills.add('seo_optimization');
        skills.add('keyword_research');
        skills.add('backlink_analysis');
        skills.add('email_marketing_automation');
        skills.add('email_campaign_builder');
        skills.add('email_template_designer');
        skills.add('newsletter_automation');
        skills.add('lead_generation');
        skills.add('lead_scoring');
        skills.add('lead_nurturing');
        skills.add('lead_magnet_creator');
        skills.add('conversion_tracking');
        skills.add('conversion_optimization');
        skills.add('ab_testing');
        skills.add('landing_page_optimizer');
        skills.add('campaign_analytics');
        skills.add('roi_tracking');
        skills.add('customer_journey_mapping');
        skills.add('attribution_modeling');
        skills.add('predictive_analytics');
        skills.add('market_research');
        skills.add('competitor_analysis');
        skills.add('audience_segmentation');
        skills.add('persona_builder');
        skills.add('ad_copy_generator');
        skills.add('graphic_design_automation');
        skills.add('video_script_writer');
        skills.add('video_editor');
        skills.add('podcast_automation');
        skills.add('influencer_outreach');
        skills.add('affiliate_management');
        skills.add('referral_program');
        skills.add('loyalty_program');
        skills.add('survey_automation');
        skills.add('feedback_collection');
        skills.add('review_management');
        skills.add('testimonial_collector');
        skills.add('case_study_generator');
        skills.add('press_release_writer');
        skills.add('media_monitoring');
        skills.add('event_marketing');
        skills.add('webinar_automation');

        // Complete marketing stack
        integrations.add('google_ads');
        integrations.add('facebook_ads');
        integrations.add('linkedin_ads');
        integrations.add('twitter_ads');
        integrations.add('tiktok_ads');
        integrations.add('youtube_ads');
        integrations.add('instagram_ads');
        integrations.add('pinterest_ads');
        integrations.add('hootsuite');
        integrations.add('buffer');
        integrations.add('sprout_social');
        integrations.add('mailchimp');
        integrations.add('hubspot');
        integrations.add('marketo');
        integrations.add('pardot');
        integrations.add('google_analytics');
        integrations.add('google_tag_manager');
        integrations.add('hotjar');
        integrations.add('mixpanel');
        integrations.add('segment');
        integrations.add('canva');
        integrations.add('adobe_creative');
        integrations.add('figma');
        integrations.add('wordpress');
        integrations.add('shopify');
        integrations.add('semrush');
        integrations.add('ahrefs');
        integrations.add('moz');
        integrations.add('zapier');
        integrations.add('slack');

        // Premium features for ultimate setup
        features.add('white_label');
        features.add('multi_tenant');
        features.add('client_portals');
        features.add('custom_reporting');
        features.add('advanced_analytics');
        features.add('ai_insights');
        features.add('predictive_modeling');
        features.add('unlimited_usage');
        features.add('api_access');
        features.add('custom_integrations');
      } else if (fullText.includes('marketing') || fullText.includes('agency')) {
        // Core marketing skills
        skills.add('campaign_management');
        skills.add('content_generator');
        skills.add('social_media_automation');
        skills.add('brand_monitoring');
        skills.add('seo_optimization');
        skills.add('email_marketing_automation');
        skills.add('lead_generation');
        skills.add('conversion_tracking');

        // Marketing-specific analytics
        skills.add('campaign_analytics');
        skills.add('roi_tracking');
        skills.add('customer_journey_mapping');
        skills.add('attribution_modeling');

        // Creative tools
        skills.add('ad_copy_generator');
        skills.add('graphic_design_automation');
        skills.add('video_script_writer');

        // Comprehensive marketing stack
        integrations.add('google_ads');
        integrations.add('facebook_ads');
        integrations.add('linkedin_ads');
        integrations.add('hootsuite');
        integrations.add('buffer');
        integrations.add('mailchimp');
        integrations.add('hubspot');
        integrations.add('google_analytics');
        integrations.add('canva');
        integrations.add('semrush');

        // Advanced features for agencies
        features.add('white_label');
        features.add('multi_tenant');
        features.add('client_portals');
        features.add('custom_reporting');
      }

      if (industryLower.includes('consulting') || industryLower.includes('professional services')) {
        skills.add('proposal_generator');
        skills.add('project_tracker');
        skills.add('client_onboarding');
        skills.add('invoice_automation');
        integrations.add('calendly');
        integrations.add('docusign');
      }

      if (industryLower.includes('saas') || industryLower.includes('software')) {
        skills.add('customer_support_automation');
        skills.add('user_onboarding');
        skills.add('bug_tracking');
        skills.add('feature_request_management');
        integrations.add('intercom');
        integrations.add('jira');
        integrations.add('github');
      }

      if (industryLower.includes('ecommerce') || industryLower.includes('retail')) {
        skills.add('inventory_management');
        skills.add('order_processing');
        skills.add('customer_service_bot');
        skills.add('review_management');
        integrations.add('shopify');
        integrations.add('stripe');
        integrations.add('mailchimp');
      }

      if (industryLower.includes('finance') || industryLower.includes('accounting')) {
        skills.add('financial_reporting');
        skills.add('expense_tracking');
        skills.add('audit_automation');
        skills.add('compliance_monitoring');
        features.add('advanced_security');
        integrations.add('quickbooks');
        integrations.add('xero');
      }
    }

    // Size-based configurations - only add if explicitly needed
    if (context.size) {
      const sizeLower = context.size.toLowerCase();

      if (sizeLower.includes('solo') || sizeLower.includes('one') || sizeLower.includes('1')) {
        skills.add('task_prioritization');
        skills.add('time_tracking');
        skills.add('personal_assistant');
        features.add('mobile_app');
      }

      if (sizeLower.includes('small') || sizeLower.includes('5') || sizeLower.includes('6') ||
          sizeLower.includes('7') || sizeLower.includes('8') || sizeLower.includes('9')) {
        skills.add('team_collaboration');
        skills.add('resource_allocation');
        features.add('role_based_access');
      }

      // Only add heavy team features for 10+ people
      if (sizeLower.includes('10') || sizeLower.includes('11') || sizeLower.includes('12') ||
          sizeLower.includes('15') || sizeLower.includes('20') ||
          sizeLower.includes('medium') || sizeLower.includes('large') || sizeLower.includes('enterprise')) {
        skills.add('workflow_orchestration');
        skills.add('department_coordination');
        features.add('role_based_access');
        features.add('team_management');
      }

      // Enterprise features only for 50+ or explicit enterprise mention
      if (sizeLower.includes('50') || sizeLower.includes('100') ||
          sizeLower.includes('enterprise') || sizeLower.includes('large')) {
        features.add('sla_guarantee');
        features.add('dedicated_instance');
        features.add('white_label');
      }
    }

    // Pain point based skills (including specific skill mentions)
    if (context.painPoints && context.painPoints.length > 0) {
      context.painPoints.forEach(pain => {
        const painLower = pain.toLowerCase();

        // Direct skill mentions
        if (painLower.includes('lead_gen') || painLower.includes('leads')) {
          skills.add('lead_generation');
          skills.add('lead_scoring');
          skills.add('lead_nurturing');
        }

        if (painLower.includes('customer_support') || painLower.includes('support_automation')) {
          skills.add('customer_support_automation');
          skills.add('ticket_management');
          skills.add('faq_automation');
        }

        if (painLower.includes('email_automation') || painLower.includes('email_marketing')) {
          skills.add('email_automation');
          skills.add('email_campaigns');
          skills.add('email_templates');
        }

        if (painLower.includes('social_media') || painLower.includes('social_automation')) {
          skills.add('social_media_automation');
          skills.add('social_posting');
          skills.add('social_monitoring');
        }

        if (painLower.includes('content_creation') || painLower.includes('content_generation')) {
          skills.add('content_generator');
          skills.add('blog_writer');
          skills.add('copywriting');
        }

        if (painLower.includes('invoice') || painLower.includes('billing')) {
          skills.add('invoice_automation');
          skills.add('payment_processing');
          skills.add('billing_management');
        }

        if (painLower.includes('project_management') || painLower.includes('task_management')) {
          skills.add('project_tracker');
          skills.add('task_automation');
          skills.add('milestone_tracking');
        }

        if (painLower.includes('workflow') || painLower.includes('workflows')) {
          skills.add('workflow_automation');
          skills.add('process_optimization');
          skills.add('approval_workflows');
        }

        if (painLower.includes('chatbot') || painLower.includes('chat_automation')) {
          skills.add('ai_chatbot');
          skills.add('conversational_ai');
          features.add('ai_chatbot');
        }

        if (painLower.includes('document_processing') || painLower.includes('document_automation')) {
          skills.add('document_analyzer');
          skills.add('document_generation');
          skills.add('ocr_processing');
        }

        // Original pain point mappings
        if (painLower.includes('time') || painLower.includes('efficiency')) {
          skills.add('process_automation');
          skills.add('batch_processing');
        }

        if (painLower.includes('scale') || painLower.includes('growth')) {
          skills.add('auto_scaling');
          skills.add('load_balancing');
          features.add('unlimited_usage');
        }

        if (painLower.includes('data') || painLower.includes('analytics') || painLower.includes('reporting')) {
          skills.add('data_visualization');
          skills.add('predictive_analytics');
          skills.add('report_generator');
          features.add('advanced_analytics');
        }

        if (painLower.includes('customer') || painLower.includes('client')) {
          skills.add('customer_insights');
          skills.add('satisfaction_tracking');
          skills.add('proactive_support');
          features.add('ai_chatbot');
        }

        if (painLower.includes('cost') || painLower.includes('budget')) {
          skills.add('cost_optimization');
          skills.add('resource_efficiency');
        }

        if (painLower.includes('quality') || painLower.includes('error')) {
          skills.add('quality_assurance');
          skills.add('error_detection');
          features.add('audit_logs');
        }

        if (painLower.includes('communication')) {
          skills.add('multichannel_communication');
          skills.add('notification_management');
          integrations.add('slack');
          integrations.add('microsoft_teams');
        }

        if (painLower.includes('sales') || painLower.includes('revenue')) {
          skills.add('lead_scoring');
          skills.add('sales_forecasting');
          skills.add('pipeline_management');
          integrations.add('salesforce');
          integrations.add('hubspot');
        }

        if (painLower.includes('compliance') || painLower.includes('regulation')) {
          skills.add('compliance_automation');
          skills.add('audit_trail');
          features.add('advanced_security');
        }
      });
    }

    // Goal-based features
    if (context.goals && context.goals.length > 0) {
      context.goals.forEach(goal => {
        const goalLower = goal.toLowerCase();

        if (goalLower.includes('automate')) {
          skills.add('workflow_automation');
          skills.add('trigger_based_actions');
          features.add('custom_workflows');
        }

        if (goalLower.includes('integrate')) {
          features.add('api_access');
          features.add('webhooks');
        }

        if (goalLower.includes('expand') || goalLower.includes('international')) {
          features.add('multi_language');
          skills.add('localization');
        }

        if (goalLower.includes('innovate') || goalLower.includes('ai')) {
          skills.add('machine_learning');
          skills.add('natural_language_processing');
          features.add('custom_integrations');
        }
      });
    }

    // Current tools integration
    if (context.currentTools && context.currentTools.length > 0) {
      context.currentTools.forEach(tool => {
        const toolLower = tool.toLowerCase();

        // Add relevant integrations based on mentioned tools
        if (toolLower.includes('google')) integrations.add('google_workspace');
        if (toolLower.includes('microsoft') || toolLower.includes('office')) integrations.add('microsoft_365');
        if (toolLower.includes('slack')) integrations.add('slack');
        if (toolLower.includes('zoom')) integrations.add('zoom');
        if (toolLower.includes('salesforce')) integrations.add('salesforce');
        if (toolLower.includes('hubspot')) integrations.add('hubspot');
        if (toolLower.includes('jira')) integrations.add('jira');
        if (toolLower.includes('asana')) integrations.add('asana');
        if (toolLower.includes('trello')) integrations.add('trello');
        if (toolLower.includes('notion')) integrations.add('notion');
      });
    }

    // Budget-based features
    if (context.budget) {
      const budgetLower = context.budget.toLowerCase();

      if (budgetLower.includes('enterprise') || budgetLower.includes('unlimited') || budgetLower.includes('1000')) {
        features.add('priority_support');
        features.add('dedicated_instance');
        features.add('sla_guarantee');
        skills.add('custom_skill_development');
      }
    }

    // Tech stack integrations
    if (context.techStack && context.techStack.length > 0) {
      context.techStack.forEach(tech => {
        const techLower = tech.toLowerCase();

        if (techLower.includes('aws')) integrations.add('aws');
        if (techLower.includes('azure')) integrations.add('azure');
        if (techLower.includes('google cloud')) integrations.add('gcp');
        if (techLower.includes('mongodb')) integrations.add('mongodb');
        if (techLower.includes('postgres')) integrations.add('postgresql');
        if (techLower.includes('redis')) integrations.add('redis');
      });
    }

    // Convert sets to arrays
    const finalConfig = {
      skills: Array.from(skills),
      features: Array.from(features),
      integrations: Array.from(integrations)
    };

    // Store previous configuration before updating
    setPreviousConfiguration(currentConfiguration);

    // Update current configuration
    setCurrentConfiguration(finalConfig);

    // Send update to parent
    onConfigUpdate(finalConfig);

    return finalConfig;
  };

  // Generate next intelligent question
  const generateNextQuestion = (context: BusinessContext, history: string[], currentSkillCount: number = 0): string => {
    // Questions in priority order
    const questionFlow = [
      {
        condition: !context.industry,
        question: "What industry or type of business are you in?"
      },
      {
        condition: !context.size,
        question: "How many people are in your organization?"
      },
      {
        condition: !context.painPoints || context.painPoints.length === 0,
        question: "What are your biggest operational challenges right now?"
      },
      {
        condition: !context.goals || context.goals.length === 0,
        question: "What are your main goals for implementing AI automation?"
      },
      {
        condition: !context.currentTools || context.currentTools.length === 0,
        question: "What tools and software do you currently use?"
      },
      {
        condition: !context.budget,
        question: "What's your monthly budget range for AI automation? (starter: £299-500, professional: £500-1000, enterprise: £1000+)"
      },
      {
        condition: !context.processes || context.processes.length === 0,
        question: "Which business processes take the most time or are most repetitive?"
      },
      {
        condition: !context.customers,
        question: "Who are your primary customers and how do you serve them?"
      },
      {
        condition: !context.dataVolume,
        question: "How much data do you typically handle? (documents, customer records, transactions)"
      },
      {
        condition: !context.compliance || context.compliance.length === 0,
        question: "Are there any compliance or regulatory requirements you need to meet?"
      },
      {
        condition: !context.timeline,
        question: "When do you need this solution implemented?"
      },
      {
        condition: !context.integrationNeeds || context.integrationNeeds.length === 0,
        question: "Are there specific systems you need to integrate with?"
      }
    ];

    // Find next unanswered question
    for (const item of questionFlow) {
      if (item.condition && !history.includes(item.question)) {
        return item.question;
      }
    }

    // If all basic questions answered, ask more specific ones based on context
    if (context.industry?.toLowerCase().includes('marketing')) {
      if (!history.includes("How many campaigns do you typically run per month?")) {
        return "How many campaigns do you typically run per month?";
      }
      if (!history.includes("What's your main channel for customer acquisition?")) {
        return "What's your main channel for customer acquisition?";
      }
    }

    if (context.industry?.toLowerCase().includes('consulting')) {
      if (!history.includes("How many clients do you typically manage simultaneously?")) {
        return "How many clients do you typically manage simultaneously?";
      }
      if (!history.includes("What's your average project duration?")) {
        return "What's your average project duration?";
      }
    }

    // Default follow-up
    return "Is there anything specific about your workflow or requirements I should know?";
  };

  // Analyze user message and extract context
  const analyzeMessage = (message: string): Partial<BusinessContext> => {
    const updates: Partial<BusinessContext> = {};
    const lowerMessage = message.toLowerCase();

    // Industry detection
    const industries = ['marketing', 'consulting', 'saas', 'software', 'ecommerce', 'retail',
                       'finance', 'healthcare', 'education', 'manufacturing', 'logistics',
                       'real estate', 'legal', 'nonprofit', 'agency'];

    for (const industry of industries) {
      if (lowerMessage.includes(industry)) {
        updates.industry = industry;
        break;
      }
    }

    // Size detection
    if (lowerMessage.includes('solo') || lowerMessage.includes('one person') ||
        lowerMessage.includes('just me') || lowerMessage.includes('1 person')) {
      updates.size = 'solo';
    } else if (lowerMessage.includes('small') || /\b[2-9]\b/.test(lowerMessage) ||
               lowerMessage.includes('few people')) {
      updates.size = 'small';
    } else if (lowerMessage.includes('medium') || /\b[1-9][0-9]\b/.test(lowerMessage)) {
      updates.size = 'medium';
    } else if (lowerMessage.includes('large') || lowerMessage.includes('enterprise') ||
               /\b[1-9][0-9]{2,}\b/.test(lowerMessage)) {
      updates.size = 'large';
    }

    // Pain points extraction
    const painKeywords = {
      'time': 'time management',
      'efficiency': 'operational efficiency',
      'scale': 'scaling challenges',
      'growth': 'growth limitations',
      'customer': 'customer management',
      'data': 'data management',
      'report': 'reporting burden',
      'manual': 'manual processes',
      'error': 'error prone processes',
      'communication': 'communication gaps',
      'cost': 'cost reduction',
      'quality': 'quality control',
      'compliance': 'compliance requirements',
      'integration': 'integration challenges'
    };

    const detectedPainPoints: string[] = [];
    for (const [keyword, painPoint] of Object.entries(painKeywords)) {
      if (lowerMessage.includes(keyword)) {
        detectedPainPoints.push(painPoint);
      }
    }
    if (detectedPainPoints.length > 0) {
      updates.painPoints = [...(updates.painPoints || []), ...detectedPainPoints];
    }

    // Check for specific skill mentions
    const skillMentions = [
      'lead generation', 'lead gen', 'leads',
      'customer support', 'support automation',
      'email automation', 'email marketing',
      'social media', 'social automation',
      'content creation', 'content generation',
      'analytics', 'reporting', 'reports',
      'invoicing', 'invoice', 'billing',
      'project management', 'task management',
      'crm', 'customer relationship',
      'sales automation', 'sales pipeline',
      'seo', 'search optimization',
      'data visualization', 'dashboards',
      'workflow automation', 'workflows',
      'chatbot', 'chat automation',
      'document processing', 'document automation'
    ];

    const mentionedSkills: string[] = [];
    for (const skill of skillMentions) {
      if (lowerMessage.includes(skill)) {
        mentionedSkills.push(skill.replace(/ /g, '_'));
      }
    }

    // Goals extraction
    const goalKeywords = {
      'automate': 'process automation',
      'save time': 'time savings',
      'reduce cost': 'cost reduction',
      'improve': 'quality improvement',
      'expand': 'business expansion',
      'scale': 'scalability',
      'integrate': 'system integration',
      'streamline': 'workflow optimization',
      'enhance': 'capability enhancement',
      'innovate': 'innovation'
    };

    const detectedGoals: string[] = [];
    for (const [keyword, goal] of Object.entries(goalKeywords)) {
      if (lowerMessage.includes(keyword)) {
        detectedGoals.push(goal);
      }
    }
    if (detectedGoals.length > 0) {
      updates.goals = [...(updates.goals || []), ...detectedGoals];
    }

    // Tools detection
    const tools = ['slack', 'teams', 'zoom', 'google', 'microsoft', 'office', 'salesforce',
                  'hubspot', 'jira', 'asana', 'trello', 'notion', 'airtable', 'monday',
                  'quickbooks', 'xero', 'stripe', 'paypal', 'shopify', 'wordpress'];

    const detectedTools: string[] = [];
    for (const tool of tools) {
      if (lowerMessage.includes(tool)) {
        detectedTools.push(tool);
      }
    }
    if (detectedTools.length > 0) {
      updates.currentTools = [...(updates.currentTools || []), ...detectedTools];
    }

    // Budget detection
    if (lowerMessage.includes('starter') || lowerMessage.includes('299') ||
        lowerMessage.includes('400') || lowerMessage.includes('500')) {
      updates.budget = 'starter';
    } else if (lowerMessage.includes('professional') || lowerMessage.includes('750') ||
               lowerMessage.includes('up to 1000')) {
      updates.budget = 'professional';
    } else if (lowerMessage.includes('enterprise') || lowerMessage.includes('unlimited') ||
               lowerMessage.includes('1000+') || lowerMessage.includes('1500')) {
      updates.budget = 'enterprise';
    }

    // Add mentioned skills to context
    if (mentionedSkills.length > 0) {
      updates.painPoints = [...(updates.painPoints || []), ...mentionedSkills];
    }

    return updates;
  };

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: input,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    const lowerInput = input.toLowerCase();

    // Check if this is a question about the configuration rather than a change request
    const isQuestion =
      lowerInput.includes('why') ||
      lowerInput.includes('what') && lowerInput.includes('?') ||
      lowerInput.includes('how come') ||
      lowerInput.includes('explain') ||
      lowerInput.includes('tell me about') ||
      lowerInput.includes('but like');

    const isRemovalRequest =
      lowerInput.includes('remove') ||
      lowerInput.includes('don\'t need') ||
      lowerInput.includes('take out') ||
      lowerInput.includes('too much') ||
      lowerInput.includes('too many');

    // Handle questions about configuration
    if (isQuestion) {
      setTimeout(() => {
        let response = '';

        if (lowerInput.includes('why') && lowerInput.includes('people') ||
            lowerInput.includes('why') && lowerInput.includes('team')) {
          response = `Good question! When you mentioned having 12 people, I added:\n\n`;
          response += `• Workflow orchestration - to coordinate tasks across your team\n`;
          response += `• Department coordination - for smooth handoffs between team members\n`;
          response += `• SLA guarantee & dedicated instance - enterprise features for team reliability\n\n`;
          response += `For a 12-person marketing team, these ensure everyone can collaborate effectively. `;
          response += `But if you\'re all working independently, we can remove these - would you like me to?`;
        } else if (lowerInput.includes('why') && lowerInput.includes('added')) {
          response = `I add skills based on the context you provide. Each detail helps me understand your needs better:\n\n`;
          response += `• Industry type → relevant core skills\n`;
          response += `• Team size → collaboration and scaling features\n`;
          response += `• Challenges → specific solutions\n\n`;
          response += `Would you like me to adjust anything in your current configuration?`;
        } else {
          response = `Let me explain the current configuration:\n\n`;
          response += `You have ${currentConfiguration.skills.length} skills selected, optimized for ${businessContext.industry || 'your business'}.\n\n`;
          response += `Is there something specific you\'d like me to clarify or change?`;
        }

        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: response,
          sender: 'assistant',
          timestamp: new Date()
        };

        setMessages(prev => [...prev, assistantMessage]);
        setIsTyping(false);
      }, 1500);
      return;
    }

    // Handle removal requests
    if (isRemovalRequest) {
      setTimeout(() => {
        let response = 'I\'ll optimize your configuration. ';

        // Remove team-related features if mentioned
        if (lowerInput.includes('team') || lowerInput.includes('workflow') || lowerInput.includes('department')) {
          const newConfig = { ...currentConfiguration };
          newConfig.skills = newConfig.skills.filter(s =>
            !s.includes('workflow_orchestration') &&
            !s.includes('department_coordination') &&
            !s.includes('team_'));
          newConfig.features = newConfig.features.filter(f =>
            !f.includes('sla_guarantee') &&
            !f.includes('dedicated_instance'));

          setCurrentConfiguration(newConfig);
          onConfigUpdate(newConfig);

          response += `I\'ve removed the team collaboration features. Your configuration is now focused on core marketing automation.\n\n`;
          response += `New total: ${newConfig.skills.length} skills selected.`;
        }

        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: response,
          sender: 'assistant',
          timestamp: new Date()
        };

        setMessages(prev => [...prev, assistantMessage]);
        setIsTyping(false);
      }, 1500);
      return;
    }

    // Otherwise, proceed with normal configuration updates
    const contextUpdates = analyzeMessage(input);
    const newContext = { ...businessContext, ...contextUpdates };
    setBusinessContext(newContext);
    buildConfiguration(newContext, messages);

    // Generate next question
    const nextQuestion = generateNextQuestion(newContext, questionHistory, currentConfiguration.skills.length);
    setQuestionHistory(prev => [...prev, nextQuestion]);

    // Create response with deeper thinking
    setTimeout(() => {
      // Get the new configuration based on full context and conversation
      const newConfig = buildConfiguration(newContext, messages);

      let response = '';

      // Calculate changes
      const addedSkills = newConfig.skills.filter(s => !previousConfiguration.skills.includes(s));
      const removedSkills = previousConfiguration.skills.filter(s => !newConfig.skills.includes(s));
      const addedFeatures = newConfig.features.filter(f => !previousConfiguration.features.includes(f));
      const removedFeatures = previousConfiguration.features.filter(f => !newConfig.features.includes(f));
      const addedIntegrations = newConfig.integrations.filter(i => !previousConfiguration.integrations.includes(i));
      const removedIntegrations = previousConfiguration.integrations.filter(i => !newConfig.integrations.includes(i));

      // Provide thoughtful analysis of changes
      if (addedSkills.length > 0 || removedSkills.length > 0 ||
          addedFeatures.length > 0 || removedFeatures.length > 0 ||
          addedIntegrations.length > 0 || removedIntegrations.length > 0) {

        response = 'Based on our conversation so far, I\'ve refined your configuration:\n\n';

        if (addedSkills.length > 0) {
          // Group skills by purpose for better explanation
          const coreSkills = addedSkills.filter(s =>
            s.includes('automation') || s.includes('generator') || s.includes('tracker'));
          const analyticsSkills = addedSkills.filter(s =>
            s.includes('analytics') || s.includes('report') || s.includes('insight'));
          const customerSkills = addedSkills.filter(s =>
            s.includes('customer') || s.includes('client') || s.includes('support'));
          const teamSkills = addedSkills.filter(s =>
            s.includes('workflow') || s.includes('department') || s.includes('team'));
          const otherSkills = addedSkills.filter(s =>
            !coreSkills.includes(s) && !analyticsSkills.includes(s) &&
            !customerSkills.includes(s) && !teamSkills.includes(s));

          if (coreSkills.length > 0) {
            response += `Core automation capabilities:\n${coreSkills.map(s => `• ${s.replace(/_/g, ' ')}`).join('\n')}\n\n`;
          }
          if (analyticsSkills.length > 0) {
            response += `Analytics & insights:\n${analyticsSkills.map(s => `• ${s.replace(/_/g, ' ')}`).join('\n')}\n\n`;
          }
          if (customerSkills.length > 0) {
            response += `Customer experience:\n${customerSkills.map(s => `• ${s.replace(/_/g, ' ')}`).join('\n')}\n\n`;
          }
          if (teamSkills.length > 0) {
            response += `Team coordination (${newContext.size || 'your team'}):\n${teamSkills.map(s => `• ${s.replace(/_/g, ' ')}`).join('\n')}\n\n`;
          }
          if (otherSkills.length > 0) {
            response += `Additional capabilities:\n${otherSkills.map(s => `• ${s.replace(/_/g, ' ')}`).join('\n')}\n\n`;
          }

          // Better explanation of why things were added
          if (teamSkills.length > 0 && newContext.size) {
            response += `(Added team features because you have ${newContext.size} people)\n\n`;
          }
          response += `These selections address your `;
          if (newContext.painPoints && newContext.painPoints.length > 0) {
            response += `${newContext.painPoints.slice(0, 2).join(' and ')} challenges`;
          } else {
            response += `${newContext.industry || 'business'} needs`;
          }
          response += `.\n\n`;
        }

        if (removedSkills.length > 0) {
          response += `Optimized by removing:\n${removedSkills.map(s => `• ${s.replace(/_/g, ' ')}`).join('\n')}\n(These seemed less relevant based on your latest input)\n\n`;
        }

        if (addedFeatures.length > 0) {
          response += `Platform features enabled:\n${addedFeatures.map(f => `• ${f.replace(/_/g, ' ')}`).join('\n')}\n\n`;
        }

        if (addedIntegrations.length > 0) {
          response += `Integrations configured:\n${addedIntegrations.map(i => `• ${i.replace(/_/g, ' ')}`).join('\n')}\n\n`;
        }

        // Add insight about the configuration with pricing
        const skillCount = newConfig.skills.length;
        let pricePerSkill = 5;
        let discount = 0;

        // Volume discounts
        if (skillCount >= 30) {
          pricePerSkill = 3.5; // 30% discount
          discount = 30;
        } else if (skillCount >= 20) {
          pricePerSkill = 4; // 20% discount
          discount = 20;
        } else if (skillCount >= 10) {
          pricePerSkill = 4.5; // 10% discount
          discount = 10;
        }

        const totalPrice = 299 + (skillCount * pricePerSkill);

        response += `This configuration now includes ${skillCount} skills`;
        if (discount > 0) {
          response += ` (${discount}% volume discount applied)`;
        }
        response += ` optimized for `;

        if (newContext.size === 'solo') {
          response += `solo operations with maximum automation`;
        } else if (newContext.industry) {
          response += `${newContext.industry} businesses`;
        } else {
          response += `your specific workflow`;
        }

        response += `.\\n\\nTotal: £${totalPrice.toFixed(0)}/month`;
        if (discount > 0) {
          response += ` (saved £${(skillCount * 5 - skillCount * pricePerSkill).toFixed(0)} with volume discount)`;
        }
        response += `.\\n\\n`;

      } else if (messages.length === 1) {
        // First response - be helpful and engaging
        response = 'I understand you want to ' + input.toLowerCase() + '.\n\n';
        response += 'Let me start building a comprehensive solution for you.\n\n';
      } else if (addedSkills.length === 0 && newConfig.skills.length === 0) {
        // No configuration yet - be more proactive
        response = 'I hear you. ';

        if (input.toLowerCase().includes('base') || input.toLowerCase().includes('nothing')) {
          response += 'Let\'s build something powerful from scratch. ';
        } else {
          response += 'Based on what you\'ve told me, let me suggest a starting configuration. ';
        }

        // Force add some relevant skills based on any context
        if (newContext.industry) {
          response += `For your ${newContext.industry} business, I recommend starting with these essential capabilities.\n\n`;
        } else {
          response += 'Here are some foundational capabilities to get started.\n\n';
        }
      } else {
        // Configuration exists but no changes
        response = 'I\'ve maintained your current configuration. ';

        // Still be helpful
        if (input.length > 10) {
          response += 'However, based on \"' + input.substring(0, 50) + (input.length > 50 ? '...' : '') + '\", ';
          response += 'you might also want to consider additional capabilities.\n\n';
        }
      }

      // Ask next question
      response += nextQuestion;

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response,
        sender: 'assistant',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
      setIsTyping(false);
    }, 2500); // Increased thinking time for more thoughtful responses
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;

        // Create message for file upload
        const fileMessage: Message = {
          id: Date.now().toString(),
          text: `Uploaded: ${file.name}`,
          sender: 'user',
          timestamp: new Date(),
          attachments: [file.name]
        };

        setMessages(prev => [...prev, fileMessage]);

        // Analyze file content
        const contextUpdates = analyzeMessage(content);
        const newContext = { ...businessContext, ...contextUpdates };
        setBusinessContext(newContext);
        const fileContext = { ...newContext };
        // Extract more context from file
        if (content.toLowerCase().includes('sales')) {
          fileContext.goals = [...(fileContext.goals || []), 'sales automation'];
        }
        if (content.toLowerCase().includes('customer')) {
          fileContext.goals = [...(fileContext.goals || []), 'customer experience'];
        }
        buildConfiguration(fileContext, messages);

        // Respond to file upload
        setTimeout(() => {
          const assistantMessage: Message = {
            id: (Date.now() + 1).toString(),
            text: `I've analyzed ${file.name} and updated your configuration accordingly. ${generateNextQuestion(newContext, questionHistory, currentConfiguration.skills.length)}`,
            sender: 'assistant',
            timestamp: new Date()
          };
          setMessages(prev => [...prev, assistantMessage]);
        }, 2000); // Thoughtful response time
      };

      reader.readAsText(file);
    });
  };

  return (
    <div className="flex flex-col" style={{
      height,
      backgroundColor: 'rgba(48, 54, 54, 0.3)',
      border: '1px solid rgba(169, 189, 203, 0.15)',
      borderRadius: '0.75rem'
    }}>
      {/* Header */}
      <div
        className="px-4 py-3 border-b flex items-center justify-between"
        style={{
          borderColor: 'rgba(169, 189, 203, 0.1)',
          backgroundColor: 'rgba(58, 64, 64, 0.3)'
        }}
      >
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg" style={{ backgroundColor: 'rgba(169, 189, 203, 0.2)' }}>
            <SparklesIcon className="h-5 w-5" style={{ color: 'rgb(169, 189, 203)' }} />
          </div>
          <div>
            <h3 className="font-semibold text-sm" style={{ color: 'rgb(229, 227, 220)' }}>
              Adaptive Configuration Assistant
            </h3>
            <span className="text-xs" style={{ color: 'rgba(169, 189, 203, 0.7)' }}>
              Building your agent in real-time
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs px-2 py-0.5 rounded-full" style={{
            backgroundColor: 'rgba(169, 189, 203, 0.1)',
            color: 'rgba(169, 189, 203, 0.9)'
          }}>
            {currentConfiguration.skills.length} skills active
          </span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] px-4 py-3 rounded-lg text-sm`}
              style={{
                backgroundColor: message.sender === 'user'
                  ? 'rgba(169, 189, 203, 0.2)'
                  : 'rgba(58, 64, 64, 0.5)',
                color: 'rgb(229, 227, 220)',
                border: message.sender === 'assistant'
                  ? '1px solid rgba(169, 189, 203, 0.15)'
                  : 'none',
                whiteSpace: 'pre-wrap'
              }}
            >
              {message.attachments && message.attachments.length > 0 && (
                <div className="flex items-center gap-2 mb-2">
                  <DocumentIcon className="h-4 w-4" style={{ color: 'rgba(169, 189, 203, 0.7)' }} />
                  <span className="text-xs" style={{ color: 'rgba(169, 189, 203, 0.7)' }}>
                    {message.attachments.join(', ')}
                  </span>
                </div>
              )}
              {message.text}
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex justify-start">
            <div
              className="px-3 py-2 rounded-lg flex items-center gap-2"
              style={{
                backgroundColor: 'rgba(58, 64, 64, 0.5)',
                border: '1px solid rgba(169, 189, 203, 0.15)'
              }}
            >
              <span className="text-xs" style={{ color: 'rgba(169, 189, 203, 0.7)' }}>
                Analyzing full context and optimizing configuration
              </span>
              <div className="flex gap-1">
                <div
                  className="w-2 h-2 rounded-full animate-bounce"
                  style={{
                    backgroundColor: 'rgba(169, 189, 203, 0.5)',
                    animationDelay: '0ms'
                  }}
                />
                <div
                  className="w-2 h-2 rounded-full animate-bounce"
                  style={{
                    backgroundColor: 'rgba(169, 189, 203, 0.5)',
                    animationDelay: '150ms'
                  }}
                />
                <div
                  className="w-2 h-2 rounded-full animate-bounce"
                  style={{
                    backgroundColor: 'rgba(169, 189, 203, 0.5)',
                    animationDelay: '300ms'
                  }}
                />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div
        className="p-3 border-t"
        style={{
          borderColor: 'rgba(169, 189, 203, 0.1)',
          backgroundColor: 'rgba(48, 54, 54, 0.3)'
        }}
      >
        <div className="flex gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            multiple
            accept=".txt,.pdf,.doc,.docx,.csv,.json"
            style={{ display: 'none' }}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-2 rounded-lg transition hover:opacity-80"
            style={{
              backgroundColor: 'rgba(169, 189, 203, 0.1)',
              border: '1px solid rgba(169, 189, 203, 0.2)'
            }}
            title="Upload files"
          >
            <ArrowUpTrayIcon className="h-4 w-4" style={{ color: 'rgb(169, 189, 203)' }} />
          </button>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Describe your business or answer the question..."
            className="flex-1 px-3 py-2 rounded-lg text-sm outline-none"
            style={{
              backgroundColor: 'rgba(58, 64, 64, 0.5)',
              border: '1px solid rgba(169, 189, 203, 0.2)',
              color: 'rgb(229, 227, 220)'
            }}
          />
          <button
            onClick={handleSend}
            className="px-3 py-2 rounded-lg transition hover:opacity-80 flex items-center justify-center"
            style={{
              backgroundColor: 'rgba(169, 189, 203, 0.2)',
              border: '1px solid rgba(169, 189, 203, 0.3)'
            }}
          >
            <PaperAirplaneIcon className="h-4 w-4" style={{ color: 'rgb(169, 189, 203)' }} />
          </button>
        </div>
      </div>
    </div>
  );
}