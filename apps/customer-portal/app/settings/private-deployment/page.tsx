'use client';

import { useState, useEffect } from 'react';
import {
  Database, Server, Brain, Shield, Key, Globe, Lock,
  CheckCircle, AlertCircle, Settings, Cloud, HardDrive,
  Cpu, Network, Save, TestTube, Zap
} from 'lucide-react';

export default function PrivateDeploymentPage() {
  const [activeTab, setActiveTab] = useState<'database' | 'llm' | 'security'>('database');
  const [testingConnection, setTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  
  // Database Configuration
  const [dbConfig, setDbConfig] = useState({
    type: 'postgres',
    connectionMode: 'direct', // direct or api
    host: '',
    port: 5432,
    database: '',
    username: '',
    password: '',
    ssl: true,
    apiEndpoint: '',
    apiKey: ''
  });

  // LLM Configuration
  const [llmConfig, setLlmConfig] = useState({
    provider: 'openai',
    deploymentMode: 'cloud', // cloud, self-hosted, or private-api
    apiKey: '',
    apiEndpoint: '',
    model: 'gpt-4',
    maxTokens: 4096,
    temperature: 0.7,
    dataResidency: 'us',
    encryptResponses: false,
    redactPII: true
  });

  // Security Configuration
  const [securityConfig, setSecurityConfig] = useState({
    encryptionEnabled: true,
    encryptionKey: '',
    auditLogging: true,
    ipWhitelist: '',
    dataRetention: 90,
    complianceMode: 'standard' // standard, hipaa, gdpr, sox
  });

  const testDatabaseConnection = async () => {
    setTestingConnection(true);
    setTestResult(null);
    
    try {
      const response = await fetch('/api/settings/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'database',
          config: dbConfig
        })
      });

      const result = await response.json();
      setTestResult({
        success: result.success,
        message: result.message || (result.success ? 'Connection successful!' : 'Connection failed')
      });
    } catch (error) {
      setTestResult({
        success: false,
        message: 'Failed to test connection'
      });
    } finally {
      setTestingConnection(false);
    }
  };

  const testLLMConnection = async () => {
    setTestingConnection(true);
    setTestResult(null);
    
    try {
      const response = await fetch('/api/settings/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'llm',
          config: llmConfig
        })
      });

      const result = await response.json();
      setTestResult({
        success: result.success,
        message: result.message || (result.success ? 'LLM connection successful!' : 'Connection failed')
      });
    } catch (error) {
      setTestResult({
        success: false,
        message: 'Failed to test LLM connection'
      });
    } finally {
      setTestingConnection(false);
    }
  };

  const saveConfiguration = async () => {
    try {
      const response = await fetch('/api/settings/private-deployment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          database: dbConfig,
          llm: llmConfig,
          security: securityConfig
        })
      });

      if (response.ok) {
        setTestResult({
          success: true,
          message: 'Configuration saved successfully!'
        });
      }
    } catch (error) {
      setTestResult({
        success: false,
        message: 'Failed to save configuration'
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Private Deployment Configuration
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Configure your own database and LLM for complete data privacy and control
          </p>
        </div>

        {/* Alert Banner */}
        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div>
              <h3 className="font-medium text-blue-900 dark:text-blue-100">
                Enterprise Privacy Mode
              </h3>
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                Your data never leaves your infrastructure. All processing happens within your secure environment.
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
          <nav className="flex gap-6">
            <button
              onClick={() => setActiveTab('database')}
              className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'database'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900 dark:text-gray-400'
              }`}
            >
              <Database className="w-4 h-4 inline mr-2" />
              Database Connection
            </button>
            <button
              onClick={() => setActiveTab('llm')}
              className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'llm'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900 dark:text-gray-400'
              }`}
            >
              <Brain className="w-4 h-4 inline mr-2" />
              LLM Configuration
            </button>
            <button
              onClick={() => setActiveTab('security')}
              className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'security'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900 dark:text-gray-400'
              }`}
            >
              <Lock className="w-4 h-4 inline mr-2" />
              Security Settings
            </button>
          </nav>
        </div>

        {/* Database Configuration */}
        {activeTab === 'database' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Database Configuration</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Connection Mode</label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setDbConfig({ ...dbConfig, connectionMode: 'direct' })}
                    className={`p-4 border rounded-lg text-left transition-colors ${
                      dbConfig.connectionMode === 'direct'
                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-300 dark:border-gray-600'
                    }`}
                  >
                    <Server className="w-5 h-5 mb-2 text-blue-600" />
                    <div className="font-medium">Direct Connection</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Connect directly to your database
                    </div>
                  </button>
                  <button
                    onClick={() => setDbConfig({ ...dbConfig, connectionMode: 'api' })}
                    className={`p-4 border rounded-lg text-left transition-colors ${
                      dbConfig.connectionMode === 'api'
                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-300 dark:border-gray-600'
                    }`}
                  >
                    <Network className="w-5 h-5 mb-2 text-blue-600" />
                    <div className="font-medium">API Connection</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Connect via your REST API
                    </div>
                  </button>
                </div>
              </div>

              {dbConfig.connectionMode === 'direct' ? (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-2">Database Type</label>
                    <select
                      value={dbConfig.type}
                      onChange={(e) => setDbConfig({ ...dbConfig, type: e.target.value })}
                      className="w-full p-2 border rounded-lg"
                    >
                      <option value="postgres">PostgreSQL</option>
                      <option value="mysql">MySQL</option>
                      <option value="mongodb">MongoDB</option>
                      <option value="sqlite">SQLite</option>
                      <option value="mssql">SQL Server</option>
                      <option value="oracle">Oracle</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Host</label>
                      <input
                        type="text"
                        value={dbConfig.host}
                        onChange={(e) => setDbConfig({ ...dbConfig, host: e.target.value })}
                        placeholder="localhost or your-database.com"
                        className="w-full p-2 border rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Port</label>
                      <input
                        type="number"
                        value={dbConfig.port}
                        onChange={(e) => setDbConfig({ ...dbConfig, port: parseInt(e.target.value) })}
                        className="w-full p-2 border rounded-lg"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Database Name</label>
                    <input
                      type="text"
                      value={dbConfig.database}
                      onChange={(e) => setDbConfig({ ...dbConfig, database: e.target.value })}
                      className="w-full p-2 border rounded-lg"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Username</label>
                      <input
                        type="text"
                        value={dbConfig.username}
                        onChange={(e) => setDbConfig({ ...dbConfig, username: e.target.value })}
                        className="w-full p-2 border rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Password</label>
                      <input
                        type="password"
                        value={dbConfig.password}
                        onChange={(e) => setDbConfig({ ...dbConfig, password: e.target.value })}
                        className="w-full p-2 border rounded-lg"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="ssl"
                      checked={dbConfig.ssl}
                      onChange={(e) => setDbConfig({ ...dbConfig, ssl: e.target.checked })}
                      className="rounded"
                    />
                    <label htmlFor="ssl" className="text-sm">Use SSL/TLS encryption</label>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-2">API Endpoint</label>
                    <input
                      type="url"
                      value={dbConfig.apiEndpoint}
                      onChange={(e) => setDbConfig({ ...dbConfig, apiEndpoint: e.target.value })}
                      placeholder="https://your-api.com/database"
                      className="w-full p-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">API Key</label>
                    <input
                      type="password"
                      value={dbConfig.apiKey}
                      onChange={(e) => setDbConfig({ ...dbConfig, apiKey: e.target.value })}
                      placeholder="Your secure API key"
                      className="w-full p-2 border rounded-lg"
                    />
                  </div>
                </>
              )}

              <button
                onClick={testDatabaseConnection}
                disabled={testingConnection}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {testingConnection ? 'Testing...' : 'Test Connection'}
              </button>
            </div>
          </div>
        )}

        {/* LLM Configuration */}
        {activeTab === 'llm' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">LLM Configuration</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Deployment Mode</label>
                <div className="grid grid-cols-3 gap-4">
                  <button
                    onClick={() => setLlmConfig({ ...llmConfig, deploymentMode: 'cloud' })}
                    className={`p-4 border rounded-lg text-left transition-colors ${
                      llmConfig.deploymentMode === 'cloud'
                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-300 dark:border-gray-600'
                    }`}
                  >
                    <Cloud className="w-5 h-5 mb-2 text-blue-600" />
                    <div className="font-medium">Cloud Provider</div>
                    <div className="text-xs text-gray-600">OpenAI, Anthropic, etc</div>
                  </button>
                  <button
                    onClick={() => setLlmConfig({ ...llmConfig, deploymentMode: 'self-hosted' })}
                    className={`p-4 border rounded-lg text-left transition-colors ${
                      llmConfig.deploymentMode === 'self-hosted'
                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-300 dark:border-gray-600'
                    }`}
                  >
                    <HardDrive className="w-5 h-5 mb-2 text-blue-600" />
                    <div className="font-medium">Self-Hosted</div>
                    <div className="text-xs text-gray-600">Ollama, llama.cpp</div>
                  </button>
                  <button
                    onClick={() => setLlmConfig({ ...llmConfig, deploymentMode: 'private-api' })}
                    className={`p-4 border rounded-lg text-left transition-colors ${
                      llmConfig.deploymentMode === 'private-api'
                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-300 dark:border-gray-600'
                    }`}
                  >
                    <Cpu className="w-5 h-5 mb-2 text-blue-600" />
                    <div className="font-medium">Private API</div>
                    <div className="text-xs text-gray-600">Your custom endpoint</div>
                  </button>
                </div>
              </div>

              {llmConfig.deploymentMode === 'cloud' && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-2">Provider</label>
                    <select
                      value={llmConfig.provider}
                      onChange={(e) => setLlmConfig({ ...llmConfig, provider: e.target.value })}
                      className="w-full p-2 border rounded-lg"
                    >
                      <option value="openai">OpenAI</option>
                      <option value="anthropic">Anthropic (Claude)</option>
                      <option value="azure">Azure OpenAI</option>
                      <option value="cohere">Cohere</option>
                      <option value="huggingface">Hugging Face</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">API Key</label>
                    <input
                      type="password"
                      value={llmConfig.apiKey}
                      onChange={(e) => setLlmConfig({ ...llmConfig, apiKey: e.target.value })}
                      className="w-full p-2 border rounded-lg"
                    />
                  </div>
                </>
              )}

              {llmConfig.deploymentMode === 'self-hosted' && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-2">Local Model Endpoint</label>
                    <input
                      type="url"
                      value={llmConfig.apiEndpoint}
                      onChange={(e) => setLlmConfig({ ...llmConfig, apiEndpoint: e.target.value })}
                      placeholder="http://localhost:11434"
                      className="w-full p-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Model Name</label>
                    <input
                      type="text"
                      value={llmConfig.model}
                      onChange={(e) => setLlmConfig({ ...llmConfig, model: e.target.value })}
                      placeholder="llama2, mistral, etc"
                      className="w-full p-2 border rounded-lg"
                    />
                  </div>
                </>
              )}

              {llmConfig.deploymentMode === 'private-api' && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-2">Custom API Endpoint</label>
                    <input
                      type="url"
                      value={llmConfig.apiEndpoint}
                      onChange={(e) => setLlmConfig({ ...llmConfig, apiEndpoint: e.target.value })}
                      placeholder="https://your-llm-api.com/completions"
                      className="w-full p-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">API Key (if required)</label>
                    <input
                      type="password"
                      value={llmConfig.apiKey}
                      onChange={(e) => setLlmConfig({ ...llmConfig, apiKey: e.target.value })}
                      className="w-full p-2 border rounded-lg"
                    />
                  </div>
                </>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Max Tokens</label>
                  <input
                    type="number"
                    value={llmConfig.maxTokens}
                    onChange={(e) => setLlmConfig({ ...llmConfig, maxTokens: parseInt(e.target.value) })}
                    className="w-full p-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Temperature</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="2"
                    value={llmConfig.temperature}
                    onChange={(e) => setLlmConfig({ ...llmConfig, temperature: parseFloat(e.target.value) })}
                    className="w-full p-2 border rounded-lg"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="redactPII"
                    checked={llmConfig.redactPII}
                    onChange={(e) => setLlmConfig({ ...llmConfig, redactPII: e.target.checked })}
                    className="rounded"
                  />
                  <label htmlFor="redactPII" className="text-sm">Automatically redact PII from prompts</label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="encryptResponses"
                    checked={llmConfig.encryptResponses}
                    onChange={(e) => setLlmConfig({ ...llmConfig, encryptResponses: e.target.checked })}
                    className="rounded"
                  />
                  <label htmlFor="encryptResponses" className="text-sm">Encrypt LLM responses</label>
                </div>
              </div>

              <button
                onClick={testLLMConnection}
                disabled={testingConnection}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {testingConnection ? 'Testing...' : 'Test LLM Connection'}
              </button>
            </div>
          </div>
        )}

        {/* Security Configuration */}
        {activeTab === 'security' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Security Settings</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Compliance Mode</label>
                <select
                  value={securityConfig.complianceMode}
                  onChange={(e) => setSecurityConfig({ ...securityConfig, complianceMode: e.target.value })}
                  className="w-full p-2 border rounded-lg"
                >
                  <option value="standard">Standard</option>
                  <option value="hipaa">HIPAA Compliant</option>
                  <option value="gdpr">GDPR Compliant</option>
                  <option value="sox">SOX Compliant</option>
                  <option value="pci">PCI DSS</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Data Retention (days)</label>
                <input
                  type="number"
                  value={securityConfig.dataRetention}
                  onChange={(e) => setSecurityConfig({ ...securityConfig, dataRetention: parseInt(e.target.value) })}
                  className="w-full p-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">IP Whitelist (comma-separated)</label>
                <textarea
                  value={securityConfig.ipWhitelist}
                  onChange={(e) => setSecurityConfig({ ...securityConfig, ipWhitelist: e.target.value })}
                  placeholder="192.168.1.0/24, 10.0.0.1"
                  className="w-full p-2 border rounded-lg"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="encryptionEnabled"
                    checked={securityConfig.encryptionEnabled}
                    onChange={(e) => setSecurityConfig({ ...securityConfig, encryptionEnabled: e.target.checked })}
                    className="rounded"
                  />
                  <label htmlFor="encryptionEnabled" className="text-sm">Enable end-to-end encryption</label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="auditLogging"
                    checked={securityConfig.auditLogging}
                    onChange={(e) => setSecurityConfig({ ...securityConfig, auditLogging: e.target.checked })}
                    className="rounded"
                  />
                  <label htmlFor="auditLogging" className="text-sm">Enable comprehensive audit logging</label>
                </div>
              </div>

              {securityConfig.encryptionEnabled && (
                <div>
                  <label className="block text-sm font-medium mb-2">Encryption Key</label>
                  <input
                    type="password"
                    value={securityConfig.encryptionKey}
                    onChange={(e) => setSecurityConfig({ ...securityConfig, encryptionKey: e.target.value })}
                    placeholder="Your 256-bit encryption key"
                    className="w-full p-2 border rounded-lg"
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Test Result */}
        {testResult && (
          <div className={`mt-4 p-4 rounded-lg ${
            testResult.success
              ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
              : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
          }`}>
            <div className="flex items-center gap-2">
              {testResult.success ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600" />
              )}
              <span className={`font-medium ${
                testResult.success ? 'text-green-900 dark:text-green-100' : 'text-red-900 dark:text-red-100'
              }`}>
                {testResult.message}
              </span>
            </div>
          </div>
        )}

        {/* Save Button */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={saveConfiguration}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            Save Configuration
          </button>
        </div>
      </div>
    </div>
  );
}