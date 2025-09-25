'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { WidgetRuntime, WidgetGateway } from '../../../../../packages/ui-system/src/WidgetRuntime';
import { LayoutSchema, LayoutBuilder } from '../../../../../packages/ui-system/src/LayoutSchema';
import { DesignerEngine } from '../../../../../packages/ui-system/src/DesignerEngine';
import {
  Cog6ToothIcon,
  PlusIcon,
  ChatBubbleLeftIcon,
  ArrowPathIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

export default function OpsAgentDashboardV2() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [layout, setLayout] = useState<LayoutSchema | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [showDesigner, setShowDesigner] = useState(false);
  const [designerInput, setDesignerInput] = useState('');
  const [proposedLayout, setProposedLayout] = useState<LayoutSchema | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const theme = {
    primaryColor: 'rgb(169, 189, 203)',
    backgroundColor: 'rgb(48, 54, 54)',
    textColor: 'rgb(229, 227, 220)',
    borderColor: 'rgba(169, 189, 203, 0.3)'
  };

  useEffect(() => {
    // Check authentication
    fetch('/api/auth/me', {
      credentials: 'include'
    })
      .then(res => res.json())
      .then(data => {
        if (data.authenticated) {
          setIsAuthenticated(true);
          loadLayout();
        } else {
          setIsAuthenticated(false);
          window.location.href = '/login';
        }
      })
      .catch(() => {
        setIsAuthenticated(false);
        window.location.href = '/login';
      });
  }, []);

  const loadLayout = async () => {
    try {
      const response = await fetch('/api/ui/layout?product=ops-agent');
      if (response.ok) {
        const layoutData = await response.json();
        setLayout(layoutData);
        setActiveTab(layoutData.tabs[0]?.id || 'overview');
      } else {
        // Use default layout
        const defaultLayout = LayoutBuilder.generateDefault('ops-agent', []);
        setLayout(defaultLayout);
      }
    } catch (error) {
      console.error('Error loading layout:', error);
      // Use default layout
      const defaultLayout = LayoutBuilder.generateDefault('ops-agent', []);
      setLayout(defaultLayout);
    } finally {
      setLoading(false);
    }
  };

  const handleDesignerSubmit = async () => {
    if (!designerInput.trim()) return;

    try {
      const response = await fetch('/api/ui/designer/propose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: designerInput,
          product: 'ops-agent',
          currentLayout: layout,
          skills: [] // Would fetch actual skills
        })
      });

      if (response.ok) {
        const proposal = await response.json();
        setProposedLayout(proposal.draftLayout);
      }
    } catch (error) {
      console.error('Error getting design proposal:', error);
    }
  };

  const applyProposedLayout = () => {
    if (proposedLayout) {
      setLayout(proposedLayout);
      setProposedLayout(null);
      setShowDesigner(false);
      setDesignerInput('');
      // Save as draft
      saveLayout(true);
    }
  };

  const saveLayout = async (asDraft: boolean = false) => {
    if (!layout) return;

    try {
      const endpoint = asDraft ? '/api/ui/layout:draft' : '/api/ui/layout:publish';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product: 'ops-agent',
          layout,
          userId: 'current-user', // Would get from session
          tenantId: 'current-tenant'
        })
      });

      if (response.ok) {
        console.log(`Layout ${asDraft ? 'saved as draft' : 'published'}`);
      }
    } catch (error) {
      console.error('Error saving layout:', error);
    }
  };

  const handleWidgetAction = (action: string, result: any) => {
    console.log('Widget action executed:', action, result);
    // Could show a notification or refresh data
  };

  const logTelemetry = (widgetId: string, eventType: string, eventData?: any) => {
    fetch('/api/ui/telemetry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        widgetId,
        widgetType: 'various',
        eventType,
        eventData
      })
    }).catch(console.error);
  };

  if (isAuthenticated === null || loading) {
    return (
      <DashboardLayout>
        <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: theme.backgroundColor }}>
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2"
               style={{ borderColor: theme.primaryColor }}></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!isAuthenticated || !layout) {
    return null;
  }

  const currentTab = layout.tabs.find(t => t.id === activeTab);

  return (
    <DashboardLayout>
      <div style={{ backgroundColor: theme.backgroundColor, minHeight: '100vh' }}>
        {/* Header */}
        <div style={{
          borderBottom: `1px solid ${theme.borderColor}`,
          padding: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h1 style={{
              fontSize: '24px',
              fontWeight: 'bold',
              color: theme.textColor,
              marginBottom: '4px'
            }}>
              Operations Agent Dashboard
            </h1>
            <p style={{ color: theme.textColor, opacity: 0.7, fontSize: '14px' }}>
              {editMode ? 'Customizing Layout' : 'Workflow Automation & Management'}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={() => setShowDesigner(!showDesigner)}
              style={{
                padding: '8px 16px',
                backgroundColor: showDesigner ? theme.primaryColor : 'transparent',
                color: showDesigner ? theme.backgroundColor : theme.textColor,
                border: `1px solid ${theme.borderColor}`,
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <ChatBubbleLeftIcon style={{ width: '16px', height: '16px' }} />
              AI Designer
            </button>

            <button
              onClick={() => setEditMode(!editMode)}
              style={{
                padding: '8px 16px',
                backgroundColor: editMode ? theme.primaryColor : 'transparent',
                color: editMode ? theme.backgroundColor : theme.textColor,
                border: `1px solid ${theme.borderColor}`,
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <Cog6ToothIcon style={{ width: '16px', height: '16px' }} />
              {editMode ? 'Exit Edit' : 'Customize'}
            </button>

            {editMode && (
              <button
                onClick={() => saveLayout(false)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: 'rgb(34, 197, 94)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <CheckIcon style={{ width: '16px', height: '16px' }} />
                Publish Layout
              </button>
            )}
          </div>
        </div>

        {/* AI Designer Panel */}
        {showDesigner && (
          <div style={{
            backgroundColor: 'rgba(169, 189, 203, 0.1)',
            border: `1px solid ${theme.borderColor}`,
            borderRadius: '8px',
            margin: '20px',
            padding: '20px'
          }}>
            <h3 style={{ color: theme.textColor, marginBottom: '12px' }}>
              AI Layout Designer
            </h3>
            <div style={{ display: 'flex', gap: '12px' }}>
              <input
                type="text"
                value={designerInput}
                onChange={(e) => setDesignerInput(e.target.value)}
                placeholder="Describe what you want... e.g., 'Add a KPI for success rate' or 'Add a new tab for exceptions'"
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  backgroundColor: theme.backgroundColor,
                  color: theme.textColor,
                  border: `1px solid ${theme.borderColor}`,
                  borderRadius: '4px'
                }}
              />
              <button
                onClick={handleDesignerSubmit}
                style={{
                  padding: '8px 16px',
                  backgroundColor: theme.primaryColor,
                  color: theme.backgroundColor,
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Generate
              </button>
            </div>

            {proposedLayout && (
              <div style={{
                marginTop: '16px',
                padding: '12px',
                backgroundColor: theme.backgroundColor,
                border: `1px solid ${theme.borderColor}`,
                borderRadius: '4px'
              }}>
                <p style={{ color: theme.textColor, marginBottom: '12px' }}>
                  Proposed changes ready. Would you like to apply them?
                </p>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={applyProposedLayout}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: 'rgb(34, 197, 94)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    Apply Changes
                  </button>
                  <button
                    onClick={() => setProposedLayout(null)}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: 'transparent',
                      color: theme.textColor,
                      border: `1px solid ${theme.borderColor}`,
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tabs */}
        <div style={{
          display: 'flex',
          gap: '24px',
          padding: '0 20px',
          borderBottom: `1px solid ${theme.borderColor}`
        }}>
          {layout.tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '12px 0',
                background: 'transparent',
                border: 'none',
                borderBottom: activeTab === tab.id ? `2px solid ${theme.primaryColor}` : 'none',
                color: activeTab === tab.id ? theme.textColor : `${theme.textColor}99`,
                fontSize: '14px',
                fontWeight: activeTab === tab.id ? 'bold' : 'normal',
                cursor: 'pointer'
              }}
            >
              {tab.title}
            </button>
          ))}
          {editMode && (
            <button
              style={{
                padding: '12px',
                background: 'transparent',
                border: 'none',
                color: theme.primaryColor,
                fontSize: '14px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <PlusIcon style={{ width: '16px', height: '16px' }} />
              Add Tab
            </button>
          )}
        </div>

        {/* Widget Grid */}
        <div style={{ padding: '20px' }}>
          {currentTab?.rows.map((row, rowIndex) => (
            <div
              key={rowIndex}
              style={{
                display: 'grid',
                gridTemplateColumns: `repeat(12, 1fr)`,
                gap: '16px',
                marginBottom: '16px'
              }}
            >
              {row.columns.map((column, colIndex) => (
                <div
                  key={colIndex}
                  style={{
                    gridColumn: `span ${column.width}`
                  }}
                >
                  {column.widgets.map((widget, widgetIndex) => (
                    <div
                      key={widget.id || widgetIndex}
                      onMouseEnter={() => logTelemetry(widget.id || '', 'view')}
                    >
                      <WidgetRuntime
                        widget={widget}
                        namespace="ops-agent"
                        tenantId="current-tenant"
                        userId="current-user"
                        onAction={handleWidgetAction}
                        theme={theme}
                      />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}