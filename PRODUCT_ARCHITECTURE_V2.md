# Intelagent Platform - Product Architecture V2

## Core Philosophy
The platform operates on a modular, customizable architecture where base products can be tailored to specific business needs, with pricing based on complexity, skill usage, token consumption, and customer value.

## Product Structure

### 1. Base Products (Foundation Layer)

#### **Chatbot** (Base: £299/month)
Core intelligent conversation agent that can be customized into:
- **Customer Support Bot**: Handle inquiries, tickets, FAQs
- **Internal Knowledge Tool**: Company wiki, documentation assistant
- **Training Assistant**: Onboarding helper, learning companion
- **Sales Qualifier**: Lead qualification, initial engagement
- **Booking Assistant**: Appointment scheduling, calendar management

Skills Used: ~30-50 skills
- ChatbotAnalyticsSkill
- ChatbotKnowledgeManagerSkill
- ChatbotConfigurationSkill
- Natural Language Processing skills
- Context Management skills

#### **Sales Outreach Agent** (Base: £499/month)
Automated sales and marketing engine that can become:
- **Lead Generation System**: Find and qualify prospects
- **Email Campaign Manager**: Automated sequences, follow-ups
- **Response Handler**: Manage replies, book meetings
- **Social Media Outreach**: LinkedIn, Twitter engagement
- **CRM Automation**: Update records, track interactions
- **Pipeline Manager**: Deal progression, task automation

Skills Used: ~60-80 skills
- EmailAutomationSkill
- LeadScoringSkill
- CRMIntegrationSkill
- DataEnrichmentSkill
- Campaign Management skills
- Analytics and Reporting skills

#### **Onboarding Agent** (Base: £399/month)
Process automation specialist that can handle:
- **Employee Onboarding**: IT setup, training schedules, documentation
- **Customer Onboarding**: Account setup, product walkthroughs
- **Vendor Onboarding**: Compliance checks, document collection
- **Form Processing**: Any repetitive form-filling task
- **Document Generation**: Contracts, proposals, reports
- **Workflow Automation**: Multi-step process management

Skills Used: ~40-60 skills
- FormProcessingSkill
- DocumentGenerationSkill
- WorkflowOrchestrationSkill
- Integration skills for HR/IT systems
- Compliance checking skills

### 2. Customization Options

#### **Add-on Skills** (£50-200/month per skill package)
Customers can enhance base products with additional skill packages:
- **Advanced Analytics Package**: Deep insights, predictive analytics
- **Integration Package**: Connect to specific third-party tools
- **Compliance Package**: Industry-specific regulations (GDPR, HIPAA)
- **Language Package**: Multi-language support
- **Security Package**: Enhanced encryption, audit trails

#### **Custom Configurations**
- Modify conversation flows
- Adjust automation rules
- Set custom triggers and actions
- Define data processing logic
- Create custom reports

### 3. Platform Upgrade (Intelligence Layer) - £999/month

The Platform upgrade transforms individual products into an interconnected intelligent system:

#### **Unified Intelligence**
- Cross-product data sharing and insights
- Holistic view of customer journey
- Predictive recommendations across all touchpoints
- Automated workflow optimization

#### **Features Included**
- **Master Dashboard**: Single control center for all products
- **Cross-Product Analytics**: Unified reporting and insights
- **Intelligent Routing**: Automatically route tasks to best agent
- **Workflow Orchestration**: Chain multiple agents for complex tasks
- **Advanced AI Layer**: GPT-4 integration for enhanced capabilities
- **Custom Reporting**: Build any report from any data
- **API Access**: Programmatic control of all products

#### **Value Proposition**
- 10x efficiency through intelligent automation
- Predictive insights impossible with isolated tools
- Reduced operational overhead
- Complete business process visibility

### 4. Custom Agent Builder - £799+/month

Allow customers to create completely custom agents:

#### **Build Approach Options**

**Option A: Use-Case Based**
- Select industry template (Healthcare, Finance, Retail, etc.)
- Choose primary function (Support, Sales, Operations, etc.)
- Platform suggests optimal skill combination
- Customize from suggested baseline

**Option B: Skills-Based**
- Browse skill marketplace (313 available skills)
- Select individual skills needed
- Platform calculates complexity score
- Dynamic pricing based on selection

#### **Pricing Model**
```
Base Price: £299
+ (Number of Skills × £20)
+ (Estimated Monthly Tokens / 1M × £50)
+ (Complexity Factor × £100)
+ (Business Value Multiplier)
= Monthly Subscription
```

### 5. Pricing Calculation Framework

#### **Factors**
1. **Complexity Score** (1-10)
   - Number of skills used
   - Integration requirements
   - Custom logic complexity
   - Data processing volume

2. **Token Usage** (Estimated)
   - Conversations/interactions per month
   - Average interaction length
   - Processing requirements

3. **Business Value**
   - Hours saved per month
   - Revenue impact
   - Cost reduction potential
   - Strategic importance

4. **Support Level**
   - Self-service: Base price
   - Priority support: +20%
   - Dedicated success manager: +40%
   - Custom SLA: +60%

## Implementation Plan

### Phase 1: Database Schema Update
- Create products table with customization fields
- Add skill_mappings table for product-skill relationships
- Implement pricing_rules table
- Add custom_agents table

### Phase 2: Product Customization UI
- Build product configuration interface
- Create skill selection marketplace
- Implement pricing calculator
- Add customization preview

### Phase 3: Platform Intelligence Layer
- Develop cross-product data sharing
- Build unified analytics engine
- Create workflow orchestration system
- Implement intelligent routing

### Phase 4: Custom Agent Builder
- Design builder interface (drag-drop or wizard)
- Create skill recommendation engine
- Build complexity calculator
- Implement testing sandbox

### Phase 5: Billing Integration
- Update Stripe products for new structure
- Implement usage-based billing components
- Create billing calculator API
- Add invoice detail breakdown

## Migration Strategy

### Existing Customers
1. Grandfather current pricing for 6 months
2. Offer migration incentives (20% discount)
3. Provide migration assistance
4. Custom migration plans for enterprise

### New Pricing Tiers

#### Starter Package
- 1 Base Product (Chatbot)
- Basic customization
- 100k tokens/month
- £299/month

#### Professional Package
- 2 Base Products (Any combination)
- Advanced customization
- 500k tokens/month
- Platform upgrade included
- £1,299/month (save £397)

#### Enterprise Package
- All 3 Base Products
- Unlimited customization
- Custom agent builder
- 2M tokens/month
- Platform upgrade included
- Dedicated success manager
- £2,499/month (save £996)

## Technical Requirements

### Database Changes
```sql
-- New tables needed
CREATE TABLE product_configurations (
  id VARCHAR(255) PRIMARY KEY,
  product_key VARCHAR(255),
  base_product VARCHAR(50), -- 'chatbot', 'sales_outreach', 'onboarding'
  customization_type VARCHAR(50), -- specific variant
  skills_enabled JSON,
  custom_settings JSON,
  complexity_score INTEGER,
  estimated_tokens INTEGER,
  monthly_price DECIMAL(10,2)
);

CREATE TABLE custom_agents (
  id VARCHAR(255) PRIMARY KEY,
  license_key VARCHAR(20),
  agent_name VARCHAR(255),
  description TEXT,
  selected_skills JSON,
  build_approach VARCHAR(50), -- 'use_case' or 'skills_based'
  complexity_score INTEGER,
  configuration JSON,
  monthly_price DECIMAL(10,2),
  status VARCHAR(50)
);

CREATE TABLE platform_subscriptions (
  id VARCHAR(255) PRIMARY KEY,
  license_key VARCHAR(20),
  products_connected JSON,
  intelligence_features JSON,
  unified_data BOOLEAN,
  status VARCHAR(50)
);
```

### API Endpoints Needed
- `/api/products/customize` - Product customization
- `/api/products/calculate-price` - Dynamic pricing
- `/api/custom-agent/build` - Custom agent builder
- `/api/platform/upgrade` - Platform intelligence activation
- `/api/billing/update-subscription` - Modify subscription

## Success Metrics

### Business Metrics
- Average revenue per customer (target: £800+)
- Customization adoption rate (target: 60%)
- Platform upgrade rate (target: 30%)
- Custom agent creation (target: 20%)

### Technical Metrics
- Configuration time (<5 minutes)
- Price calculation accuracy (99%)
- Cross-product data sync latency (<1 second)
- Custom agent build time (<10 minutes)

## Next Steps

1. Review and approve new architecture
2. Update database schema
3. Create UI mockups for customization
4. Build pricing calculator
5. Update Stripe products
6. Develop custom agent builder
7. Implement Platform intelligence layer
8. Launch beta with select customers
9. Gather feedback and iterate
10. Full launch with migration plan