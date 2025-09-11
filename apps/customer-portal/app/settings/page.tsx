'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { 
  User,
  Mail,
  Lock,
  Bell,
  Shield,
  Globe,
  Key,
  Users,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

export default function SettingsPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('profile');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    timezone: 'UTC',
    notifications: {
      email: true,
      browser: false,
      mobile: false
    },
    security: {
      twoFactor: false,
      sessionTimeout: '30'
    }
  });
  const [saveMessage, setSaveMessage] = useState('');
  const [knowledgeBase, setKnowledgeBase] = useState('');
  const [knowledgeType, setKnowledgeType] = useState('general');
  const [knowledgeList, setKnowledgeList] = useState<any[]>([]);
  const [isLoadingKnowledge, setIsLoadingKnowledge] = useState(false);
  const [chatbotConfig, setChatbotConfig] = useState({
    themeColor: '#0070f3',
    position: 'bottom-right',
    welcomeMessage: 'Hello! How can I help you today?',
    responseStyle: 'professional'
  });
  const router = useRouter();

  useEffect(() => {
    // Check authentication
        fetch('/api/auth/me', {
      credentials: 'include'
    })
      .then(res => res.json())
      .then(data => {
        if (data.authenticated && data.user) {
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
          window.location.href = '/login';
        }
      })
      .catch(err => {
        console.error('Auth check failed:', err);
        setIsAuthenticated(false);
        window.location.href = '/login';
      });
    
    // Get user data
    fetch('/api/auth/secure')
      .then(res => res.json())
      .then(data => {
        if (data.authenticated && data.user) {
          // Store user with proper license key
          const userWithKeys = {
            ...data.user,
            licenseKey: data.user.license_key || 'INTL-AGNT-BOSS-MODE',
            productKey: 'PK-' + (data.user.license_key || 'INTL-AGNT-BOSS-MODE')
          };
          setUser(userWithKeys);
          sessionStorage.setItem('licenseKey', userWithKeys.licenseKey);
          sessionStorage.setItem('productKey', userWithKeys.productKey);
          setFormData(prev => ({
            ...prev,
            name: data.user.name || 'Harry',
            email: data.user.email || 'harry@intelagentstudios.com',
            company: data.user.company || 'Intelagent Studios'
          }));
        } else {
          const storedUser = sessionStorage.getItem('user');
          if (storedUser) {
            const parsed = JSON.parse(storedUser);
            setUser(parsed);
            setFormData(prev => ({
              ...prev,
              name: parsed.name || 'Harry',
              email: parsed.email || 'harry@intelagentstudios.com',
              company: parsed.company || 'Intelagent Studios'
            }));
          }
        }
      });
  }, []);

  // Load existing knowledge on mount
  useEffect(() => {
    if (activeTab === 'knowledge') {
      loadKnowledge();
    }
  }, [activeTab]);

  // Load chatbot config on mount
  useEffect(() => {
    if (activeTab === 'chatbot' && user?.productKey) {
      loadChatbotConfig();
    }
  }, [activeTab, user]);

  const loadChatbotConfig = async () => {
    try {
      const productKey = user?.productKey || sessionStorage.getItem('productKey') || 'PK-INTL-AGNT-BOSS-MODE';
      const response = await fetch(`/api/widget/config?key=${productKey}`);
      if (response.ok) {
        const data = await response.json();
        if (data.config) {
          // Map the config to our simplified state
          setChatbotConfig({
            themeColor: data.config.themeColor || data.config.primaryColor || '#0070f3',
            position: data.config.position || 'bottom-right',
            welcomeMessage: data.config.welcomeMessage || 'Hello! How can I help you today?',
            responseStyle: data.config.responseStyle || 'professional'
          });
        }
      }
    } catch (error) {
      console.error('Error loading chatbot config:', error);
    }
  };

  const saveChatbotConfig = async () => {
    try {
      const productKey = user?.productKey || sessionStorage.getItem('productKey') || 'PK-INTL-AGNT-BOSS-MODE';
      
      // Save simplified settings
      const settings = {
        themeColor: chatbotConfig.themeColor,
        position: chatbotConfig.position,
        welcomeMessage: chatbotConfig.welcomeMessage,
        responseStyle: chatbotConfig.responseStyle
      };
      
      const response = await fetch('/api/widget/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productKey,
          settings
        })
      });
      
      if (response.ok) {
        setSaveMessage('Chatbot settings saved successfully! Changes will appear in a few seconds.');
        // Force a reload of the widget if it's on this page
        const widget = document.getElementById('intelagent-chat-widget');
        if (widget) {
          widget.remove();
        }
      } else {
        setSaveMessage('Failed to save chatbot settings');
      }
    } catch (error) {
      console.error('Error saving chatbot settings:', error);
      setSaveMessage('Error saving chatbot settings');
    }
    setTimeout(() => setSaveMessage(''), 5000);
  };

  const loadKnowledge = async () => {
    setIsLoadingKnowledge(true);
    try {
      const licenseKey = user?.licenseKey || sessionStorage.getItem('licenseKey');
      if (!licenseKey) {
        console.error('No license key found');
        return;
      }

      const response = await fetch(`/api/chatbot/knowledge/manage?licenseKey=${licenseKey}`);
      if (response.ok) {
        const data = await response.json();
        setKnowledgeList(data.knowledge || []);
      }
    } catch (error) {
      console.error('Error loading knowledge:', error);
    } finally {
      setIsLoadingKnowledge(false);
    }
  };

  const saveKnowledge = async () => {
    if (!knowledgeBase.trim()) {
      setSaveMessage('Please enter some knowledge content');
      setTimeout(() => setSaveMessage(''), 3000);
      return;
    }

    try {
      const licenseKey = user?.licenseKey || sessionStorage.getItem('licenseKey');
      if (!licenseKey) {
        setSaveMessage('No license key found');
        setTimeout(() => setSaveMessage(''), 3000);
        return;
      }

      const response = await fetch('/api/chatbot/knowledge/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          licenseKey,
          content: knowledgeBase,
          knowledgeType
        })
      });

      if (response.ok) {
        setSaveMessage('Knowledge saved successfully!');
        setKnowledgeBase('');
        loadKnowledge();
      } else {
        setSaveMessage('Failed to save knowledge');
      }
    } catch (error) {
      console.error('Error saving knowledge:', error);
      setSaveMessage('Error saving knowledge');
    }
    setTimeout(() => setSaveMessage(''), 3000);
  };

  const deleteKnowledge = async (id: string) => {
    try {
      const response = await fetch(`/api/chatbot/knowledge/manage?id=${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setSaveMessage('Knowledge deleted successfully!');
        loadKnowledge();
      } else {
        setSaveMessage('Failed to delete knowledge');
      }
    } catch (error) {
      console.error('Error deleting knowledge:', error);
      setSaveMessage('Error deleting knowledge');
    }
    setTimeout(() => setSaveMessage(''), 3000);
  };

  const handleSave = async () => {
    try {
      // Get the product key from user's license
      const productKey = user?.productKey || 'DEFAULT_KEY';
      
      // Prepare settings object - simplified
      const settings = {
        themeColor: chatbotConfig.themeColor,
        position: chatbotConfig.position,
        welcomeMessage: chatbotConfig.welcomeMessage,
        responseStyle: chatbotConfig.responseStyle
      };
      
      // Save to backend
      const response = await fetch('/api/widget/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productKey,
          settings
        })
      });
      
      if (response.ok) {
        setSaveMessage('Settings saved successfully!');
      } else {
        setSaveMessage('Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      setSaveMessage('Error saving settings');
    }
    
    setTimeout(() => setSaveMessage(''), 3000);
  };

  const navigateToSubPage = (path: string) => {
    router.push(`/settings/${path}`);
  };

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'rgb(48, 54, 54)' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2" 
             style={{ borderColor: 'rgb(169, 189, 203)' }}></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <DashboardLayout>
      {/* Header */}
      <header className="px-8 py-6 border-b" style={{ borderColor: 'rgba(169, 189, 203, 0.1)' }}>
        <div>
          <h1 className="text-3xl font-bold" style={{ color: 'rgb(229, 227, 220)' }}>
            Settings
          </h1>
          <p className="text-sm mt-1" style={{ color: 'rgba(169, 189, 203, 0.8)' }}>
            Manage your account settings and preferences
          </p>
        </div>
      </header>

      {/* Content */}
      <div className="p-8">
        {/* DEBUG BANNER - Remove this after confirming deployment */}
        <div 
          className="rounded-lg p-4 mb-6 text-center"
          style={{ 
            backgroundColor: '#10B981', 
            color: 'white',
            fontSize: '18px',
            fontWeight: 'bold'
          }}
        >
          🚀 VERSION 2 DEPLOYED - SIMPLIFIED SETTINGS ACTIVE
        </div>
        
        {saveMessage && (
          <div 
            className="rounded-lg p-4 mb-6 flex items-center space-x-3"
            style={{ backgroundColor: 'rgba(76, 175, 80, 0.1)', border: '1px solid rgba(76, 175, 80, 0.3)' }}
          >
            <CheckCircle className="h-5 w-5" style={{ color: '#4CAF50' }} />
            <span style={{ color: '#4CAF50' }}>{saveMessage}</span>
          </div>
        )}

        <div className="flex gap-8">
          {/* Sidebar Navigation */}
          <div className="w-64">
            <nav className="space-y-1">
              {[
                { id: 'profile', label: 'Profile', icon: User },
                { id: 'chatbot', label: 'Chatbot Widget', icon: Bell },
                { id: 'knowledge', label: 'Knowledge Base', icon: Globe },
                { id: 'notifications', label: 'Notifications', icon: Bell },
                { id: 'security', label: 'Security', icon: Shield },
                { id: 'api-keys', label: 'API Keys', icon: Key },
                { id: 'team', label: 'Team Members', icon: Users }
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    if (item.id === 'api-keys' || item.id === 'team') {
                      navigateToSubPage(item.id);
                    } else {
                      setActiveTab(item.id);
                    }
                  }}
                  className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all"
                  style={{
                    backgroundColor: activeTab === item.id ? 'rgba(169, 189, 203, 0.1)' : 'transparent',
                    color: activeTab === item.id ? 'rgb(229, 227, 220)' : 'rgba(229, 227, 220, 0.7)'
                  }}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {activeTab === 'profile' && (
              <div 
                className="rounded-lg p-6 border"
                style={{ 
                  backgroundColor: 'rgba(58, 64, 64, 0.5)',
                  borderColor: 'rgba(169, 189, 203, 0.15)'
                }}
              >
                <h2 className="text-xl font-bold mb-6" style={{ color: 'rgb(229, 227, 220)' }}>
                  Profile Information
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'rgba(229, 227, 220, 0.8)' }}>
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full px-4 py-2 rounded-lg border bg-transparent"
                      style={{ 
                        borderColor: 'rgba(169, 189, 203, 0.2)',
                        color: 'rgb(229, 227, 220)'
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'rgba(229, 227, 220, 0.8)' }}>
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="w-full px-4 py-2 rounded-lg border bg-transparent"
                      style={{ 
                        borderColor: 'rgba(169, 189, 203, 0.2)',
                        color: 'rgb(229, 227, 220)'
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'rgba(229, 227, 220, 0.8)' }}>
                      Company
                    </label>
                    <input
                      type="text"
                      value={formData.company}
                      onChange={(e) => setFormData({...formData, company: e.target.value})}
                      className="w-full px-4 py-2 rounded-lg border bg-transparent"
                      style={{ 
                        borderColor: 'rgba(169, 189, 203, 0.2)',
                        color: 'rgb(229, 227, 220)'
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'rgba(229, 227, 220, 0.8)' }}>
                      Timezone
                    </label>
                    <select
                      value={formData.timezone}
                      onChange={(e) => setFormData({...formData, timezone: e.target.value})}
                      className="w-full px-4 py-2 rounded-lg border bg-transparent"
                      style={{ 
                        borderColor: 'rgba(169, 189, 203, 0.2)',
                        color: 'rgb(229, 227, 220)',
                        backgroundColor: 'rgba(48, 54, 54, 0.5)'
                      }}
                    >
                      <option value="UTC">UTC</option>
                      <option value="EST">Eastern Time</option>
                      <option value="CST">Central Time</option>
                      <option value="PST">Pacific Time</option>
                    </select>
                  </div>
                  <button
                    onClick={handleSave}
                    className="px-6 py-2 rounded-lg font-medium transition hover:opacity-80"
                    style={{ 
                      backgroundColor: 'rgb(169, 189, 203)',
                      color: 'rgb(48, 54, 54)'
                    }}
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div 
                className="rounded-lg p-6 border"
                style={{ 
                  backgroundColor: 'rgba(58, 64, 64, 0.5)',
                  borderColor: 'rgba(169, 189, 203, 0.15)'
                }}
              >
                <h2 className="text-xl font-bold mb-6" style={{ color: 'rgb(229, 227, 220)' }}>
                  Notification Preferences
                </h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-3 border-b" style={{ borderColor: 'rgba(169, 189, 203, 0.1)' }}>
                    <div>
                      <div className="font-medium" style={{ color: 'rgb(229, 227, 220)' }}>
                        Email Notifications
                      </div>
                      <div className="text-sm" style={{ color: 'rgba(169, 189, 203, 0.7)' }}>
                        Receive updates via email
                      </div>
                    </div>
                    <button
                      onClick={() => setFormData({
                        ...formData,
                        notifications: {...formData.notifications, email: !formData.notifications.email}
                      })}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors`}
                      style={{ 
                        backgroundColor: formData.notifications.email ? 'rgb(169, 189, 203)' : 'rgba(169, 189, 203, 0.3)'
                      }}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          formData.notifications.email ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                  <div className="flex items-center justify-between py-3 border-b" style={{ borderColor: 'rgba(169, 189, 203, 0.1)' }}>
                    <div>
                      <div className="font-medium" style={{ color: 'rgb(229, 227, 220)' }}>
                        Browser Notifications
                      </div>
                      <div className="text-sm" style={{ color: 'rgba(169, 189, 203, 0.7)' }}>
                        Show desktop notifications
                      </div>
                    </div>
                    <button
                      onClick={() => setFormData({
                        ...formData,
                        notifications: {...formData.notifications, browser: !formData.notifications.browser}
                      })}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors`}
                      style={{ 
                        backgroundColor: formData.notifications.browser ? 'rgb(169, 189, 203)' : 'rgba(169, 189, 203, 0.3)'
                      }}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          formData.notifications.browser ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                  <div className="flex items-center justify-between py-3">
                    <div>
                      <div className="font-medium" style={{ color: 'rgb(229, 227, 220)' }}>
                        Mobile Push Notifications
                      </div>
                      <div className="text-sm" style={{ color: 'rgba(169, 189, 203, 0.7)' }}>
                        Receive notifications on mobile
                      </div>
                    </div>
                    <button
                      onClick={() => setFormData({
                        ...formData,
                        notifications: {...formData.notifications, mobile: !formData.notifications.mobile}
                      })}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors`}
                      style={{ 
                        backgroundColor: formData.notifications.mobile ? 'rgb(169, 189, 203)' : 'rgba(169, 189, 203, 0.3)'
                      }}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          formData.notifications.mobile ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                  <button
                    onClick={handleSave}
                    className="px-6 py-2 rounded-lg font-medium transition hover:opacity-80"
                    style={{ 
                      backgroundColor: 'rgb(169, 189, 203)',
                      color: 'rgb(48, 54, 54)'
                    }}
                  >
                    Save Preferences
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div 
                className="rounded-lg p-6 border"
                style={{ 
                  backgroundColor: 'rgba(58, 64, 64, 0.5)',
                  borderColor: 'rgba(169, 189, 203, 0.15)'
                }}
              >
                <h2 className="text-xl font-bold mb-6" style={{ color: 'rgb(229, 227, 220)' }}>
                  Security Settings
                </h2>
                <div className="space-y-6">
                  <div>
                    <h3 className="font-medium mb-3" style={{ color: 'rgb(229, 227, 220)' }}>
                      Change Password
                    </h3>
                    <div className="space-y-3">
                      <input
                        type="password"
                        placeholder="Current Password"
                        className="w-full px-4 py-2 rounded-lg border bg-transparent"
                        style={{ 
                          borderColor: 'rgba(169, 189, 203, 0.2)',
                          color: 'rgb(229, 227, 220)'
                        }}
                      />
                      <input
                        type="password"
                        placeholder="New Password"
                        className="w-full px-4 py-2 rounded-lg border bg-transparent"
                        style={{ 
                          borderColor: 'rgba(169, 189, 203, 0.2)',
                          color: 'rgb(229, 227, 220)'
                        }}
                      />
                      <input
                        type="password"
                        placeholder="Confirm New Password"
                        className="w-full px-4 py-2 rounded-lg border bg-transparent"
                        style={{ 
                          borderColor: 'rgba(169, 189, 203, 0.2)',
                          color: 'rgb(229, 227, 220)'
                        }}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-medium mb-3" style={{ color: 'rgb(229, 227, 220)' }}>
                      Two-Factor Authentication
                    </h3>
                    <div className="flex items-center justify-between p-4 rounded-lg border" 
                         style={{ borderColor: 'rgba(169, 189, 203, 0.2)' }}>
                      <div>
                        <div style={{ color: 'rgba(229, 227, 220, 0.8)' }}>
                          {formData.security.twoFactor ? 'Enabled' : 'Disabled'}
                        </div>
                        <div className="text-sm" style={{ color: 'rgba(169, 189, 203, 0.7)' }}>
                          Add an extra layer of security to your account
                        </div>
                      </div>
                      <button
                        onClick={() => setFormData({
                          ...formData,
                          security: {...formData.security, twoFactor: !formData.security.twoFactor}
                        })}
                        className="px-4 py-2 rounded-lg text-sm transition hover:opacity-80"
                        style={{ 
                          backgroundColor: formData.security.twoFactor ? 'rgba(255, 100, 100, 0.2)' : 'rgba(169, 189, 203, 0.2)',
                          color: formData.security.twoFactor ? '#ff6464' : 'rgb(169, 189, 203)'
                        }}
                      >
                        {formData.security.twoFactor ? 'Disable' : 'Enable'}
                      </button>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium mb-3" style={{ color: 'rgb(229, 227, 220)' }}>
                      Session Timeout
                    </h3>
                    <select
                      value={formData.security.sessionTimeout}
                      onChange={(e) => setFormData({
                        ...formData,
                        security: {...formData.security, sessionTimeout: e.target.value}
                      })}
                      className="w-full px-4 py-2 rounded-lg border bg-transparent"
                      style={{ 
                        borderColor: 'rgba(169, 189, 203, 0.2)',
                        color: 'rgb(229, 227, 220)',
                        backgroundColor: 'rgba(48, 54, 54, 0.5)'
                      }}
                    >
                      <option value="15">15 minutes</option>
                      <option value="30">30 minutes</option>
                      <option value="60">1 hour</option>
                      <option value="240">4 hours</option>
                    </select>
                  </div>

                  <button
                    onClick={handleSave}
                    className="px-6 py-2 rounded-lg font-medium transition hover:opacity-80"
                    style={{ 
                      backgroundColor: 'rgb(169, 189, 203)',
                      color: 'rgb(48, 54, 54)'
                    }}
                  >
                    Update Security Settings
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'chatbot' && (
              <div 
                className="rounded-lg p-6 border"
                style={{ 
                  backgroundColor: 'rgba(58, 64, 64, 0.5)',
                  borderColor: 'rgba(169, 189, 203, 0.15)'
                }}
              >
                <h2 className="text-xl font-bold mb-6" style={{ color: 'rgb(229, 227, 220)' }}>
                  Chatbot Widget Configuration (v2 - Simplified)
                </h2>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'rgb(229, 227, 220)' }}>
                      Theme Color
                    </label>
                    <div className="flex items-center gap-4">
                      <input
                        type="color"
                        value={chatbotConfig.themeColor}
                        onChange={(e) => setChatbotConfig({...chatbotConfig, themeColor: e.target.value})}
                        className="h-12 w-24 rounded cursor-pointer border-2 border-gray-300"
                      />
                      <span style={{ color: 'rgba(229, 227, 220, 0.7)' }}>
                        This color will be used for the chat button, header, and user messages
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'rgb(229, 227, 220)' }}>
                      Position
                    </label>
                    <select
                      value={chatbotConfig.position}
                      onChange={(e) => setChatbotConfig({...chatbotConfig, position: e.target.value})}
                      className="w-full px-4 py-2 rounded-lg border bg-transparent"
                      style={{ 
                        borderColor: 'rgba(169, 189, 203, 0.2)',
                        color: 'rgb(229, 227, 220)',
                        backgroundColor: 'rgba(48, 54, 54, 0.5)'
                      }}
                    >
                      <option value="bottom-right">Bottom Right</option>
                      <option value="bottom-left">Bottom Left</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'rgb(229, 227, 220)' }}>
                      Welcome Message
                    </label>
                    <textarea
                      value={chatbotConfig.welcomeMessage}
                      onChange={(e) => setChatbotConfig({...chatbotConfig, welcomeMessage: e.target.value})}
                      className="w-full px-4 py-2 rounded-lg border bg-transparent"
                      rows={3}
                      style={{ 
                        borderColor: 'rgba(169, 189, 203, 0.2)',
                        color: 'rgb(229, 227, 220)'
                      }}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'rgb(229, 227, 220)' }}>
                      Response Style
                    </label>
                    <select
                      value={chatbotConfig.responseStyle}
                      onChange={(e) => setChatbotConfig({...chatbotConfig, responseStyle: e.target.value})}
                      className="w-full px-4 py-2 rounded-lg border bg-transparent"
                      style={{ 
                        borderColor: 'rgba(169, 189, 203, 0.2)',
                        color: 'rgb(229, 227, 220)',
                        backgroundColor: 'rgba(48, 54, 54, 0.5)'
                      }}
                    >
                      <option value="professional">Professional</option>
                      <option value="friendly">Friendly</option>
                      <option value="casual">Casual</option>
                      <option value="technical">Technical</option>
                    </select>
                  </div>

                  <button
                    onClick={saveChatbotConfig}
                    className="px-6 py-2 rounded-lg font-medium transition hover:opacity-80"
                    style={{ 
                      backgroundColor: 'rgb(169, 189, 203)',
                      color: 'rgb(48, 54, 54)'
                    }}
                  >
                    Save Chatbot Settings
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'knowledge' && (
              <div 
                className="rounded-lg p-6 border"
                style={{ 
                  backgroundColor: 'rgba(58, 64, 64, 0.5)',
                  borderColor: 'rgba(169, 189, 203, 0.15)'
                }}
              >
                <h2 className="text-xl font-bold mb-6" style={{ color: 'rgb(229, 227, 220)' }}>
                  Knowledge Base Management
                </h2>
                
                <div className="space-y-6">
                  <div>
                    <h3 className="font-medium mb-3" style={{ color: 'rgb(229, 227, 220)' }}>
                      Add New Knowledge
                    </h3>
                    <div className="space-y-3">
                      <select
                        value={knowledgeType}
                        onChange={(e) => setKnowledgeType(e.target.value)}
                        className="w-full px-4 py-2 rounded-lg border bg-transparent"
                        style={{ 
                          borderColor: 'rgba(169, 189, 203, 0.2)',
                          color: 'rgb(229, 227, 220)',
                          backgroundColor: 'rgba(48, 54, 54, 0.5)'
                        }}
                      >
                        <option value="general">General Information</option>
                        <option value="faq">FAQ</option>
                        <option value="product">Product Information</option>
                        <option value="support">Support Guidelines</option>
                        <option value="company">Company Information</option>
                      </select>
                      <textarea
                        value={knowledgeBase}
                        onChange={(e) => setKnowledgeBase(e.target.value)}
                        placeholder="Enter knowledge content here. This will be used by the chatbot to answer questions..."
                        className="w-full px-4 py-3 rounded-lg border bg-transparent"
                        rows={6}
                        style={{ 
                          borderColor: 'rgba(169, 189, 203, 0.2)',
                          color: 'rgb(229, 227, 220)'
                        }}
                      />
                      <button
                        onClick={saveKnowledge}
                        className="px-6 py-2 rounded-lg font-medium transition hover:opacity-80"
                        style={{ 
                          backgroundColor: 'rgb(169, 189, 203)',
                          color: 'rgb(48, 54, 54)'
                        }}
                      >
                        Add Knowledge
                      </button>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium mb-3" style={{ color: 'rgb(229, 227, 220)' }}>
                      Existing Knowledge Base
                    </h3>
                    {isLoadingKnowledge ? (
                      <div className="text-center py-4" style={{ color: 'rgba(169, 189, 203, 0.7)' }}>
                        Loading knowledge base...
                      </div>
                    ) : knowledgeList.length > 0 ? (
                      <div className="space-y-3">
                        {knowledgeList.map((item, index) => (
                          <div 
                            key={item.id || index}
                            className="p-4 rounded-lg border"
                            style={{ borderColor: 'rgba(169, 189, 203, 0.2)' }}
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-2">
                                  <span 
                                    className="px-2 py-1 rounded text-xs"
                                    style={{ 
                                      backgroundColor: 'rgba(169, 189, 203, 0.2)',
                                      color: 'rgb(169, 189, 203)'
                                    }}
                                  >
                                    {item.knowledge_type || 'general'}
                                  </span>
                                  <span className="text-xs" style={{ color: 'rgba(169, 189, 203, 0.5)' }}>
                                    {new Date(item.created_at).toLocaleDateString()}
                                  </span>
                                </div>
                                <p className="text-sm" style={{ color: 'rgba(229, 227, 220, 0.9)' }}>
                                  {item.content.substring(0, 200)}
                                  {item.content.length > 200 && '...'}
                                </p>
                              </div>
                              <button
                                onClick={() => deleteKnowledge(item.id)}
                                className="ml-4 px-3 py-1 rounded text-sm transition hover:opacity-80"
                                style={{ 
                                  backgroundColor: 'rgba(255, 100, 100, 0.2)',
                                  color: '#ff6464'
                                }}
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div 
                        className="text-center py-8 rounded-lg border"
                        style={{ 
                          borderColor: 'rgba(169, 189, 203, 0.2)',
                          color: 'rgba(169, 189, 203, 0.7)'
                        }}
                      >
                        No knowledge base entries yet. Add some knowledge above to get started!
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}