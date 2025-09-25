'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import GridLayout, { Layout, Layouts } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import {
  ChartBarIcon,
  TableCellsIcon,
  ClockIcon,
  PresentationChartLineIcon,
  Squares2X2Icon,
  Cog6ToothIcon,
  PlusIcon,
  XMarkIcon,
  ArrowPathIcon,
  CheckIcon
} from '@heroicons/react/24/outline';

interface Widget {
  id: string;
  type: 'metric' | 'chart' | 'table' | 'timeline' | 'custom';
  name: string;
  config: any;
  data?: any;
}

interface DashboardLayout {
  id: string;
  name: string;
  layouts: Layouts;
  widgets: Widget[];
  theme: {
    primaryColor: string;
    backgroundColor: string;
    textColor: string;
    borderColor: string;
  };
}

interface DashboardBuilderProps {
  productKey: string;
  userId: string;
  initialLayout?: DashboardLayout;
  availableWidgets: Widget[];
  onSave?: (layout: DashboardLayout) => void;
  readOnly?: boolean;
}

const defaultTheme = {
  primaryColor: 'rgb(169, 189, 203)',
  backgroundColor: 'rgb(48, 54, 54)',
  textColor: 'rgb(229, 227, 220)',
  borderColor: 'rgba(169, 189, 203, 0.3)'
};

export default function DashboardBuilder({
  productKey,
  userId,
  initialLayout,
  availableWidgets,
  onSave,
  readOnly = false
}: DashboardBuilderProps) {
  const [layout, setLayout] = useState<Layout[]>([]);
  const [widgets, setWidgets] = useState<Widget[]>(initialLayout?.widgets || []);
  const [theme, setTheme] = useState(initialLayout?.theme || defaultTheme);
  const [editMode, setEditMode] = useState(false);
  const [showWidgetLibrary, setShowWidgetLibrary] = useState(false);
  const [selectedWidget, setSelectedWidget] = useState<Widget | null>(null);
  const [saving, setSaving] = useState(false);

  // Load saved layout
  useEffect(() => {
    loadDashboardLayout();
  }, [productKey, userId]);

  const loadDashboardLayout = async () => {
    try {
      const response = await fetch(`/api/dashboard/layout?productKey=${productKey}&userId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        setLayout(data.layout);
        setWidgets(data.widgets);
        setTheme(data.theme || defaultTheme);
      }
    } catch (error) {
      console.error('Error loading dashboard layout:', error);
    }
  };

  const saveDashboardLayout = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/dashboard/layout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productKey,
          userId,
          layout,
          widgets,
          theme
        })
      });

      if (response.ok) {
        onSave?.({ id: '', name: 'Custom Layout', layouts: { lg: layout }, widgets, theme });
      }
    } catch (error) {
      console.error('Error saving dashboard layout:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleLayoutChange = (newLayout: Layout[]) => {
    setLayout(newLayout);
  };

  const addWidget = (widget: Widget) => {
    const newWidget = {
      ...widget,
      id: `widget-${Date.now()}`
    };

    const newLayoutItem: Layout = {
      i: newWidget.id,
      x: 0,
      y: 0,
      w: widget.type === 'metric' ? 3 : 6,
      h: widget.type === 'metric' ? 2 : 4
    };

    setWidgets([...widgets, newWidget]);
    setLayout([...layout, newLayoutItem]);
    setShowWidgetLibrary(false);
  };

  const removeWidget = (widgetId: string) => {
    setWidgets(widgets.filter(w => w.id !== widgetId));
    setLayout(layout.filter(l => l.i !== widgetId));
  };

  const renderWidget = (widget: Widget) => {
    const widgetStyle = {
      backgroundColor: theme.backgroundColor,
      border: `1px solid ${theme.borderColor}`,
      borderRadius: '8px',
      padding: '16px',
      height: '100%',
      display: 'flex',
      flexDirection: 'column' as const
    };

    return (
      <div key={widget.id} style={widgetStyle}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '12px'
        }}>
          <h3 style={{
            color: theme.textColor,
            fontSize: '16px',
            fontWeight: 'bold',
            margin: 0
          }}>
            {widget.name}
          </h3>
          {editMode && (
            <button
              onClick={() => removeWidget(widget.id)}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '4px'
              }}
            >
              <XMarkIcon style={{ width: '16px', height: '16px', color: theme.textColor }} />
            </button>
          )}
        </div>

        <div style={{ flex: 1, overflow: 'auto' }}>
          {renderWidgetContent(widget)}
        </div>
      </div>
    );
  };

  const renderWidgetContent = (widget: Widget) => {
    switch (widget.type) {
      case 'metric':
        return (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%'
          }}>
            <div style={{ fontSize: '36px', fontWeight: 'bold', color: theme.primaryColor }}>
              {widget.data?.value || '0'}
            </div>
            <div style={{ fontSize: '14px', color: theme.textColor, opacity: 0.7 }}>
              {widget.data?.label || widget.name}
            </div>
          </div>
        );

      case 'chart':
        return (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: theme.textColor,
            opacity: 0.5
          }}>
            <ChartBarIcon style={{ width: '48px', height: '48px' }} />
          </div>
        );

      case 'table':
        return (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: theme.textColor,
            opacity: 0.5
          }}>
            <TableCellsIcon style={{ width: '48px', height: '48px' }} />
          </div>
        );

      default:
        return (
          <div style={{ color: theme.textColor, opacity: 0.5, textAlign: 'center' }}>
            Widget content
          </div>
        );
    }
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div style={{
        backgroundColor: theme.backgroundColor,
        minHeight: '100vh',
        padding: '20px'
      }}>
        {/* Header Controls */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px'
        }}>
          <h2 style={{ color: theme.textColor, fontSize: '24px', fontWeight: 'bold' }}>
            Dashboard
          </h2>

          <div style={{ display: 'flex', gap: '12px' }}>
            {!readOnly && (
              <>
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
                  <>
                    <button
                      onClick={() => setShowWidgetLibrary(true)}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: theme.primaryColor,
                        color: theme.backgroundColor,
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                    >
                      <PlusIcon style={{ width: '16px', height: '16px' }} />
                      Add Widget
                    </button>

                    <button
                      onClick={saveDashboardLayout}
                      disabled={saving}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: 'rgb(34, 197, 94)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: saving ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        opacity: saving ? 0.5 : 1
                      }}
                    >
                      {saving ? (
                        <ArrowPathIcon style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite' }} />
                      ) : (
                        <CheckIcon style={{ width: '16px', height: '16px' }} />
                      )}
                      {saving ? 'Saving...' : 'Save Layout'}
                    </button>
                  </>
                )}
              </>
            )}
          </div>
        </div>

        {/* Grid Layout */}
        <GridLayout
          className="layout"
          layout={layout}
          cols={12}
          rowHeight={60}
          width={1200}
          isDraggable={editMode}
          isResizable={editMode}
          onLayoutChange={handleLayoutChange}
          draggableHandle=".widget-drag-handle"
        >
          {widgets.map(widget => renderWidget(widget))}
        </GridLayout>

        {/* Widget Library Modal */}
        {showWidgetLibrary && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div style={{
              backgroundColor: theme.backgroundColor,
              border: `1px solid ${theme.borderColor}`,
              borderRadius: '12px',
              padding: '24px',
              maxWidth: '600px',
              width: '90%',
              maxHeight: '80vh',
              overflow: 'auto'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '24px'
              }}>
                <h3 style={{ color: theme.textColor, fontSize: '20px', fontWeight: 'bold' }}>
                  Widget Library
                </h3>
                <button
                  onClick={() => setShowWidgetLibrary(false)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '4px'
                  }}
                >
                  <XMarkIcon style={{ width: '24px', height: '24px', color: theme.textColor }} />
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                {availableWidgets.map(widget => (
                  <button
                    key={widget.id}
                    onClick={() => addWidget(widget)}
                    style={{
                      padding: '16px',
                      backgroundColor: 'rgba(169, 189, 203, 0.1)',
                      border: `1px solid ${theme.borderColor}`,
                      borderRadius: '8px',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.2s'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(169, 189, 203, 0.2)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(169, 189, 203, 0.1)';
                    }}
                  >
                    <div style={{ color: theme.textColor, fontWeight: 'bold', marginBottom: '4px' }}>
                      {widget.name}
                    </div>
                    <div style={{ color: theme.textColor, opacity: 0.7, fontSize: '12px' }}>
                      Type: {widget.type}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </DndProvider>
  );
}