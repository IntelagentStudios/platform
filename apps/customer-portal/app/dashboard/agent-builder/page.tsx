'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import {
  CpuChipIcon,
  PlusCircleIcon,
  TrashIcon,
  CogIcon,
  SparklesIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowRightIcon,
  BeakerIcon,
  CodeBracketIcon,
  ChatBubbleLeftRightIcon,
  ChartBarIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/solid';

interface SkillCategory {
  id: string;
  name: string;
  icon: any;
  description: string;
  skills: Skill[];
}

interface Skill {
  id: string;
  name: string;
  description: string;
  complexity: number;
  priceImpact: number;
  tokenEstimate: number;
  dependencies?: string[];
}

interface AgentRequirement {
  id: string;
  text: string;
  type: 'functional' | 'integration' | 'performance' | 'security';
  priority: 'must-have' | 'nice-to-have' | 'optional';
}

export default function AgentBuilderPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);
  const [agentName, setAgentName] = useState('');
  const [agentDescription, setAgentDescription] = useState('');
  const [industry, setIndustry] = useState('');
  const [requirements, setRequirements] = useState<AgentRequirement[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<Set<string>>(new Set());
  const [recommendedSkills, setRecommendedSkills] = useState<string[]>([]);
  const [estimatedPrice, setEstimatedPrice] = useState(0);
  const [estimatedComplexity, setEstimatedComplexity] = useState(0);
  const [availableSkills, setAvailableSkills] = useState<SkillCategory[]>([]);

  useEffect(() => {
    loadAvailableSkills();
  }, []);

  useEffect(() => {
    // Recalculate price and complexity when skills change
    calculatePricing();
  }, [selectedSkills]);

  useEffect(() => {
    // Generate skill recommendations when requirements change
    if (requirements.length > 0) {
      generateRecommendations();
    }
  }, [requirements]);

  const loadAvailableSkills = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/skills', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) {
        throw new Error('Failed to load skills');
      }

      const data = await response.json();
      
      // Organize skills by category
      const categories: SkillCategory[] = [
        {
          id: 'communication',
          name: 'Communication',
          icon: ChatBubbleLeftRightIcon,
          description: 'Natural language processing and conversation',
          skills: []
        },
        {
          id: 'analysis',
          name: 'Analysis',
          icon: ChartBarIcon,
          description: 'Data processing and insights generation',
          skills: []
        },
        {
          id: 'integration',
          name: 'Integration',
          icon: CodeBracketIcon,
          description: 'External system connections and APIs',
          skills: []
        },
        {
          id: 'automation',
          name: 'Automation',
          icon: CogIcon,
          description: 'Workflow and process automation',
          skills: []
        },
        {
          id: 'security',
          name: 'Security',
          icon: ShieldCheckIcon,
          description: 'Compliance and data protection',
          skills: []
        }
      ];

      // Populate categories with skills
      data.skills?.forEach((skill: any) => {
        const categoryMap: Record<string, string> = {
          'nlp': 'communication',
          'conversation': 'communication',
          'analytics': 'analysis',
          'reporting': 'analysis',
          'api': 'integration',
          'webhook': 'integration',
          'workflow': 'automation',
          'task': 'automation',
          'compliance': 'security',
          'encryption': 'security'
        };

        const categoryId = categoryMap[skill.category] || 'automation';
        const category = categories.find(c => c.id === categoryId);
        
        if (category) {
          category.skills.push({
            id: skill.id,
            name: skill.name,
            description: skill.description,
            complexity: skill.complexity_score || 1,
            priceImpact: skill.base_cost_pence || 0,
            tokenEstimate: skill.token_usage_estimate || 0,
            dependencies: skill.dependencies || []
          });
        }
      });

      setAvailableSkills(categories);
    } catch (error) {
      console.error('Error loading skills:', error);
    } finally {
      setLoading(false);
    }
  };

  const addRequirement = () => {
    const newRequirement: AgentRequirement = {
      id: `req-${Date.now()}`,
      text: '',
      type: 'functional',
      priority: 'must-have'
    };
    setRequirements([...requirements, newRequirement]);
  };

  const updateRequirement = (id: string, updates: Partial<AgentRequirement>) => {
    setRequirements(requirements.map(req => 
      req.id === id ? { ...req, ...updates } : req
    ));
  };

  const removeRequirement = (id: string) => {
    setRequirements(requirements.filter(req => req.id !== id));
  };

  const generateRecommendations = async () => {
    // AI-powered skill recommendations based on requirements
    const mustHaveReqs = requirements.filter(r => r.priority === 'must-have');
    const recommended: string[] = [];

    // Simple rule-based recommendations (would be ML-powered in production)
    mustHaveReqs.forEach(req => {
      const text = req.text.toLowerCase();
      
      if (text.includes('customer') || text.includes('support')) {
        recommended.push('conversation_management', 'sentiment_analysis');
      }
      if (text.includes('sales') || text.includes('lead')) {
        recommended.push('lead_scoring', 'opportunity_tracking');
      }
      if (text.includes('data') || text.includes('analytics')) {
        recommended.push('data_analysis', 'reporting_advanced');
      }
      if (text.includes('integrate') || text.includes('api')) {
        recommended.push('api_integration', 'webhook_management');
      }
      if (text.includes('compliance') || text.includes('gdpr')) {
        recommended.push('compliance_check', 'audit_trail');
      }
    });

    setRecommendedSkills([...new Set(recommended)]);
  };

  const toggleSkill = (skillId: string) => {
    const newSelection = new Set(selectedSkills);
    if (newSelection.has(skillId)) {
      newSelection.delete(skillId);
    } else {
      newSelection.add(skillId);
    }
    setSelectedSkills(newSelection);
  };

  const calculatePricing = () => {
    let basePrice = 1999; // Base price for custom agent in pence (£19.99)
    let totalComplexity = 10; // Base complexity

    availableSkills.forEach(category => {
      category.skills.forEach(skill => {
        if (selectedSkills.has(skill.id)) {
          basePrice += skill.priceImpact;
          totalComplexity += skill.complexity;
        }
      });
    });

    // Apply volume discounts
    const skillCount = selectedSkills.size;
    if (skillCount > 20) basePrice *= 0.9;
    if (skillCount > 40) basePrice *= 0.85;

    setEstimatedPrice(basePrice);
    setEstimatedComplexity(Math.min(totalComplexity, 100));
  };

  const handleTestAgent = async () => {
    // Save draft and redirect to testing interface
    const agentConfig = {
      name: agentName,
      description: agentDescription,
      industry,
      requirements,
      skills: Array.from(selectedSkills),
      estimatedPrice,
      estimatedComplexity
    };

    localStorage.setItem('draft-agent', JSON.stringify(agentConfig));
    alert('Agent configuration saved! Test environment coming soon.');
  };

  const handleDeployAgent = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Create the custom agent
      const response = await fetch('/api/agents/custom', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: agentName,
          description: agentDescription,
          industry,
          requirements: requirements.map(r => ({
            text: r.text,
            type: r.type,
            priority: r.priority
          })),
          skills: Array.from(selectedSkills),
          pricing: {
            monthlyPrice: estimatedPrice,
            setupFee: Math.round(estimatedPrice * 2), // 2x monthly for setup
            complexity: estimatedComplexity
          }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create agent');
      }

      const data = await response.json();

      // Redirect to Stripe checkout
      const checkoutResponse = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          productType: 'custom_agent',
          productName: `Custom Agent: ${agentName}`,
          customPrice: estimatedPrice,
          billing: 'monthly',
          metadata: {
            agentId: data.agentId,
            setupFee: Math.round(estimatedPrice * 2)
          }
        })
      });

      const checkoutData = await checkoutResponse.json();
      
      if (checkoutData.url) {
        window.location.href = checkoutData.url;
      }
    } catch (error) {
      console.error('Error deploying agent:', error);
      alert('Failed to deploy agent. Please try again.');
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-gray-400">Loading agent builder...</div>
        </div>
      </DashboardLayout>
    );
  }

  const steps = [
    { number: 1, title: 'Define Agent', icon: DocumentTextIcon },
    { number: 2, title: 'Requirements', icon: ExclamationTriangleIcon },
    { number: 3, title: 'Select Skills', icon: CpuChipIcon },
    { number: 4, title: 'Review & Deploy', icon: CheckCircleIcon }
  ];

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <BeakerIcon className="w-8 h-8 text-purple-400 mr-3" />
            <h1 className="text-3xl font-bold text-white">Custom Agent Builder</h1>
          </div>
          <p className="text-gray-400">
            Build a completely bespoke AI agent tailored to your specific business needs
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-8">
          {steps.map((step, idx) => (
            <div key={step.number} className="flex items-center flex-1">
              <div
                onClick={() => step.number < currentStep && setCurrentStep(step.number)}
                className={`flex items-center cursor-pointer ${
                  step.number <= currentStep ? 'opacity-100' : 'opacity-50'
                }`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  step.number === currentStep
                    ? 'bg-blue-600 text-white'
                    : step.number < currentStep
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-700 text-gray-400'
                }`}>
                  {step.number < currentStep ? (
                    <CheckCircleIcon className="w-6 h-6" />
                  ) : (
                    <step.icon className="w-5 h-5" />
                  )}
                </div>
                <span className="ml-2 text-sm font-medium text-gray-300 hidden md:block">
                  {step.title}
                </span>
              </div>
              {idx < steps.length - 1 && (
                <div className={`flex-1 h-0.5 mx-4 ${
                  step.number < currentStep ? 'bg-green-600' : 'bg-gray-700'
                }`} />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="bg-gray-800 rounded-lg p-8">
          {currentStep === 1 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-white mb-4">Define Your Agent</h2>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Agent Name
                </label>
                <input
                  type="text"
                  value={agentName}
                  onChange={(e) => setAgentName(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                  placeholder="e.g., Customer Success AI Agent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={agentDescription}
                  onChange={(e) => setAgentDescription(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                  placeholder="Describe what your agent will do..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Industry
                </label>
                <select
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                >
                  <option value="">Select Industry</option>
                  <option value="ecommerce">E-commerce</option>
                  <option value="saas">SaaS</option>
                  <option value="healthcare">Healthcare</option>
                  <option value="finance">Finance</option>
                  <option value="education">Education</option>
                  <option value="realestate">Real Estate</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white">Requirements & Goals</h2>
                <button
                  onClick={addRequirement}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center transition"
                >
                  <PlusCircleIcon className="w-5 h-5 mr-2" />
                  Add Requirement
                </button>
              </div>

              <div className="space-y-4">
                {requirements.map((req) => (
                  <div key={req.id} className="bg-gray-700 rounded-lg p-4">
                    <div className="flex items-start space-x-4">
                      <div className="flex-1 space-y-3">
                        <input
                          type="text"
                          value={req.text}
                          onChange={(e) => updateRequirement(req.id, { text: e.target.value })}
                          className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded text-white focus:border-blue-500 focus:outline-none"
                          placeholder="Describe this requirement..."
                        />
                        <div className="flex space-x-4">
                          <select
                            value={req.type}
                            onChange={(e) => updateRequirement(req.id, { type: e.target.value as any })}
                            className="px-3 py-1 bg-gray-600 border border-gray-500 rounded text-sm text-white"
                          >
                            <option value="functional">Functional</option>
                            <option value="integration">Integration</option>
                            <option value="performance">Performance</option>
                            <option value="security">Security</option>
                          </select>
                          <select
                            value={req.priority}
                            onChange={(e) => updateRequirement(req.id, { priority: e.target.value as any })}
                            className="px-3 py-1 bg-gray-600 border border-gray-500 rounded text-sm text-white"
                          >
                            <option value="must-have">Must Have</option>
                            <option value="nice-to-have">Nice to Have</option>
                            <option value="optional">Optional</option>
                          </select>
                        </div>
                      </div>
                      <button
                        onClick={() => removeRequirement(req.id)}
                        className="p-2 text-red-400 hover:text-red-300"
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {requirements.length === 0 && (
                <div className="text-center py-8 text-gray-400">
                  Add requirements to help us recommend the right skills for your agent
                </div>
              )}
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-white mb-4">Select Skills</h2>
              
              {recommendedSkills.length > 0 && (
                <div className="bg-blue-900/30 border border-blue-500/30 rounded-lg p-4 mb-6">
                  <div className="flex items-center mb-2">
                    <SparklesIcon className="w-5 h-5 text-blue-400 mr-2" />
                    <span className="font-semibold text-blue-400">Recommended Skills</span>
                  </div>
                  <p className="text-sm text-gray-300 mb-3">
                    Based on your requirements, we recommend these skills:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {recommendedSkills.map(skillId => {
                      const skill = availableSkills
                        .flatMap(c => c.skills)
                        .find(s => s.id === skillId);
                      
                      if (!skill) return null;
                      
                      return (
                        <button
                          key={skillId}
                          onClick={() => toggleSkill(skillId)}
                          className={`px-3 py-1 rounded-full text-sm transition ${
                            selectedSkills.has(skillId)
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                          }`}
                        >
                          {skill.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="space-y-6">
                {availableSkills.map(category => (
                  <div key={category.id}>
                    <div className="flex items-center mb-3">
                      <category.icon className="w-5 h-5 text-gray-400 mr-2" />
                      <h3 className="font-semibold text-white">{category.name}</h3>
                      <span className="ml-2 text-sm text-gray-400">
                        ({category.skills.filter(s => selectedSkills.has(s.id)).length}/{category.skills.length})
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {category.skills.map(skill => (
                        <div
                          key={skill.id}
                          onClick={() => toggleSkill(skill.id)}
                          className={`p-3 rounded-lg border cursor-pointer transition ${
                            selectedSkills.has(skill.id)
                              ? 'bg-blue-900/30 border-blue-500'
                              : 'bg-gray-700 border-gray-600 hover:border-gray-500'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-medium text-white">{skill.name}</h4>
                              <p className="text-xs text-gray-400 mt-1">{skill.description}</p>
                            </div>
                            {selectedSkills.has(skill.id) && (
                              <CheckCircleIcon className="w-5 h-5 text-blue-400 ml-2" />
                            )}
                          </div>
                          <div className="flex items-center space-x-4 mt-2">
                            <span className="text-xs text-gray-500">
                              +£{(skill.priceImpact / 100).toFixed(2)}/mo
                            </span>
                            <span className="text-xs text-gray-500">
                              Complexity: {skill.complexity}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-white mb-4">Review & Deploy</h2>
              
              <div className="bg-gray-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Agent Configuration</h3>
                
                <div className="space-y-3">
                  <div>
                    <span className="text-sm text-gray-400">Name:</span>
                    <p className="text-white">{agentName || 'Unnamed Agent'}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-400">Description:</span>
                    <p className="text-white">{agentDescription || 'No description provided'}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-400">Industry:</span>
                    <p className="text-white">{industry || 'Not specified'}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-400">Requirements:</span>
                    <p className="text-white">{requirements.length} requirements defined</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-400">Selected Skills:</span>
                    <p className="text-white">{selectedSkills.size} skills selected</p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 rounded-lg p-6 border border-purple-500/30">
                <h3 className="text-lg font-semibold text-white mb-4">Pricing Estimate</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-400">Monthly Subscription</p>
                    <p className="text-2xl font-bold text-white">
                      £{(estimatedPrice / 100).toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">One-time Setup Fee</p>
                    <p className="text-2xl font-bold text-white">
                      £{(estimatedPrice * 2 / 100).toFixed(2)}
                    </p>
                  </div>
                </div>
                
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-400">Complexity Score</span>
                    <span className="text-sm text-white">{estimatedComplexity}/100</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-green-500 to-yellow-500 h-2 rounded-full"
                      style={{ width: `${estimatedComplexity}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-between">
                <button
                  onClick={handleTestAgent}
                  className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold transition flex items-center"
                >
                  <BeakerIcon className="w-5 h-5 mr-2" />
                  Test Agent
                </button>
                <button
                  onClick={handleDeployAgent}
                  disabled={!agentName || selectedSkills.size === 0}
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg font-semibold transition disabled:opacity-50 flex items-center"
                >
                  Deploy & Subscribe
                  <ArrowRightIcon className="w-5 h-5 ml-2" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        {currentStep < 4 && (
          <div className="flex justify-between mt-6">
            <button
              onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
              disabled={currentStep === 1}
              className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentStep(Math.min(4, currentStep + 1))}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}