'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  PlusIcon,
  Cog6ToothIcon,
  TrashIcon,
  ChartBarIcon,
  TableCellsIcon,
  ClockIcon,
  DocumentTextIcon,
  PlayIcon,
  SquaresPlusIcon,
  ArrowsPointingOutIcon,
  ArrowsPointingInIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import DashboardLayout from '@/components/DashboardLayout';

// Widget type definitions
interface Widget {
  id: string;
  type: 'kpi' | 'chart' | 'table' | 'timeline' | 'text' | 'action';
  title: string;
  bind: string;
  width: number;
  height: number;
  x: number;
  y: number;
  config: Record<string, any>;
  refreshInterval?: number;
}

interface Dashboard {
  id: string;
  name: string;
  description: string;
  widgets: Widget[];
  gridCols: number;
  gridRows: number;
  theme?: {
    primaryColor: string;
    backgroundColor: string;
    textColor: string;
  };
}

// Widget type configurations
const WIDGET_TYPES = [
  { id: 'kpi', name: 'KPI Card', icon: SquaresPlusIcon, defaultWidth: 2, defaultHeight: 1 },
  { id: 'chart', name: 'Chart', icon: ChartBarIcon, defaultWidth: 4, defaultHeight: 2 },
  { id: 'table', name: 'Table', icon: TableCellsIcon, defaultWidth: 6, defaultHeight: 3 },
  { id: 'timeline', name: 'Timeline', icon: ClockIcon, defaultWidth: 8, defaultHeight: 2 },
  { id: 'text', name: 'Text', icon: DocumentTextIcon, defaultWidth: 3, defaultHeight: 1 },
  { id: 'action', name: 'Action Button', icon: PlayIcon, defaultWidth: 2, defaultHeight: 1 }
];

// Available data bindings
const DATA_BINDINGS = [
  { id: 'sales.revenue', name: 'Sales Revenue', type: 'number' },
  { id: 'sales.leads', name: 'Lead Count', type: 'number' },
  { id: 'sales.conversion', name: 'Conversion Rate', type: 'percentage' },
  { id: 'sales.campaigns', name: 'Active Campaigns', type: 'number' },
  { id: 'chatbot.conversations', name: 'Chatbot Conversations', type: 'number' },
  { id: 'chatbot.satisfaction', name: 'Satisfaction Score', type: 'percentage' },
  { id: 'products.active', name: 'Active Products', type: 'number' },
  { id: 'users.total', name: 'Total Users', type: 'number' },
  { id: 'users.active', name: 'Active Users', type: 'number' },
  { id: 'revenue.monthly', name: 'Monthly Revenue', type: 'chart' },
  { id: 'leads.timeline', name: 'Leads Timeline', type: 'timeline' },
  { id: 'campaigns.table', name: 'Campaigns Table', type: 'table' },
  { id: 'static.welcome', name: 'Welcome Text', type: 'text' },
  { id: 'action.refresh', name: 'Refresh Data', type: 'action' },
  { id: 'action.export', name: 'Export Report', type: 'action' }
];

export default function DashboardBuilder() {
  const [dashboard, setDashboard] = useState<Dashboard>({
    id: 'new-dashboard',
    name: 'New Dashboard',
    description: 'Drag and drop widgets to build your dashboard',
    widgets: [],
    gridCols: 12,
    gridRows: 8,
    theme: {
      primaryColor: '#0070f3',
      backgroundColor: '#ffffff',
      textColor: '#000000'
    }
  });

  const [selectedWidget, setSelectedWidget] = useState<Widget | null>(null);
  const [draggedWidgetType, setDraggedWidgetType] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  // Grid cell size (in pixels)
  const cellSize = 80;

  // Add a new widget to the dashboard
  const addWidget = (type: string, x: number, y: number) => {
    const widgetType = WIDGET_TYPES.find(t => t.id === type);
    if (!widgetType) return;

    const newWidget: Widget = {
      id: `widget-${Date.now()}`,
      type: type as Widget['type'],
      title: widgetType.name,
      bind: DATA_BINDINGS.find(b => b.type === type)?.id || 'static.text',
      width: widgetType.defaultWidth,
      height: widgetType.defaultHeight,
      x,
      y,
      config: {}
    };

    setDashboard(prev => ({
      ...prev,
      widgets: [...prev.widgets, newWidget]
    }));

    setSelectedWidget(newWidget);
  };

  // Update widget position
  const moveWidget = (widgetId: string, x: number, y: number) => {
    setDashboard(prev => ({
      ...prev,
      widgets: prev.widgets.map(w =>
        w.id === widgetId ? { ...w, x, y } : w
      )
    }));
  };

  // Resize widget
  const resizeWidget = (widgetId: string, width: number, height: number) => {
    setDashboard(prev => ({
      ...prev,
      widgets: prev.widgets.map(w =>
        w.id === widgetId ? { ...w, width, height } : w
      )
    }));
  };

  // Delete widget
  const deleteWidget = (widgetId: string) => {
    setDashboard(prev => ({
      ...prev,
      widgets: prev.widgets.filter(w => w.id !== widgetId)
    }));
    setSelectedWidget(null);
  };

  // Update widget settings
  const updateWidget = (widgetId: string, updates: Partial<Widget>) => {
    setDashboard(prev => ({
      ...prev,
      widgets: prev.widgets.map(w =>
        w.id === widgetId ? { ...w, ...updates } : w
      )
    }));
  };

  // Handle drag and drop
  const handleDragStart = (e: React.DragEvent, type: string) => {
    setDraggedWidgetType(type);
    setIsDragging(true);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, x: number, y: number) => {
    e.preventDefault();
    if (draggedWidgetType) {
      addWidget(draggedWidgetType, x, y);
    }
    setDraggedWidgetType(null);
    setIsDragging(false);
  };

  // Save dashboard
  const saveDashboard = async () => {
    try {
      const response = await fetch('/api/dashboard/builder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dashboard)
      });

      if (response.ok) {
        setSaveMessage('Dashboard saved successfully!');
        setTimeout(() => setSaveMessage(''), 3000);
      }
    } catch (error) {
      console.error('Failed to save dashboard:', error);
      setSaveMessage('Failed to save dashboard');
      setTimeout(() => setSaveMessage(''), 3000);
    }
  };

  // Widget Settings Panel
  const renderSettingsPanel = () => {
    if (!selectedWidget) return null;

    return (
      <div className="fixed right-0 top-0 h-full w-80 bg-white shadow-lg z-50 overflow-y-auto">
        <div className="p-4 border-b">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold">Widget Settings</h3>
            <button onClick={() => setSelectedWidget(null)}>
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium mb-1">Title</label>
            <input
              type="text"
              value={selectedWidget.title}
              onChange={(e) => updateWidget(selectedWidget.id, { title: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>

          {/* Data Binding */}
          <div>
            <label className="block text-sm font-medium mb-1">Data Source</label>
            <select
              value={selectedWidget.bind}
              onChange={(e) => updateWidget(selectedWidget.id, { bind: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
            >
              {DATA_BINDINGS.map(binding => (
                <option key={binding.id} value={binding.id}>
                  {binding.name}
                </option>
              ))}
            </select>
          </div>

          {/* Size */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-sm font-medium mb-1">Width</label>
              <input
                type="number"
                min="1"
                max="12"
                value={selectedWidget.width}
                onChange={(e) => resizeWidget(selectedWidget.id, parseInt(e.target.value), selectedWidget.height)}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Height</label>
              <input
                type="number"
                min="1"
                max="8"
                value={selectedWidget.height}
                onChange={(e) => resizeWidget(selectedWidget.id, selectedWidget.width, parseInt(e.target.value))}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
          </div>

          {/* Refresh Interval */}
          <div>
            <label className="block text-sm font-medium mb-1">Refresh (seconds)</label>
            <input
              type="number"
              min="0"
              value={selectedWidget.refreshInterval || 0}
              onChange={(e) => updateWidget(selectedWidget.id, { refreshInterval: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="0 = no auto-refresh"
            />
          </div>

          {/* Widget-specific settings */}
          {selectedWidget.type === 'chart' && (
            <div>
              <label className="block text-sm font-medium mb-1">Chart Type</label>
              <select
                value={selectedWidget.config.chartType || 'line'}
                onChange={(e) => updateWidget(selectedWidget.id, {
                  config: { ...selectedWidget.config, chartType: e.target.value }
                })}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="line">Line Chart</option>
                <option value="bar">Bar Chart</option>
                <option value="pie">Pie Chart</option>
                <option value="area">Area Chart</option>
              </select>
            </div>
          )}

          {/* Delete Button */}
          <button
            onClick={() => deleteWidget(selectedWidget.id)}
            className="w-full px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 flex items-center justify-center gap-2"
          >
            <TrashIcon className="w-4 h-4" />
            Delete Widget
          </button>
        </div>
      </div>
    );
  };

  return (
    <DashboardLayout>
      {/* Header */}
      <header className="px-8 py-6 border-b border-gray-200 bg-white">
        <div className="flex justify-between items-center">
          <div>
            <input
              type="text"
              value={dashboard.name}
              onChange={(e) => setDashboard({ ...dashboard, name: e.target.value })}
              className="text-3xl font-bold bg-transparent border-none focus:outline-none"
            />
            <input
              type="text"
              value={dashboard.description}
              onChange={(e) => setDashboard({ ...dashboard, description: e.target.value })}
              className="text-sm text-gray-500 bg-transparent border-none focus:outline-none w-full mt-1"
            />
          </div>

          <div className="flex items-center gap-4">
            {saveMessage && (
              <span className="text-green-500 text-sm">{saveMessage}</span>
            )}

            <button
              onClick={() => setPreviewMode(!previewMode)}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                previewMode
                  ? 'bg-gray-100 text-gray-700'
                  : 'bg-white border border-gray-300'
              }`}
            >
              {previewMode ? (
                <>
                  <ArrowsPointingInIcon className="w-4 h-4" />
                  Exit Preview
                </>
              ) : (
                <>
                  <ArrowsPointingOutIcon className="w-4 h-4" />
                  Preview
                </>
              )}
            </button>

            <button
              onClick={saveDashboard}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2"
            >
              <CheckIcon className="w-4 h-4" />
              Save Dashboard
            </button>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-200px)]">
        {/* Widget Palette */}
        {!previewMode && (
          <div className="w-64 bg-gray-50 p-4 border-r">
            <h3 className="font-semibold mb-4">Widget Library</h3>
            <div className="space-y-2">
              {WIDGET_TYPES.map(type => (
                <div
                  key={type.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, type.id)}
                  className="p-3 bg-white rounded-lg shadow cursor-move hover:shadow-md transition-shadow flex items-center gap-3"
                >
                  <type.icon className="w-5 h-5 text-gray-500" />
                  <span className="text-sm font-medium">{type.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Dashboard Canvas */}
        <div className="flex-1 bg-gray-100 p-6 overflow-auto">
          <div
            className="relative bg-white rounded-lg shadow-lg"
            style={{
              width: dashboard.gridCols * cellSize,
              height: dashboard.gridRows * cellSize,
              backgroundImage: !previewMode ?
                'repeating-linear-gradient(0deg, #f3f4f6, #f3f4f6 1px, transparent 1px, transparent 80px), repeating-linear-gradient(90deg, #f3f4f6, #f3f4f6 1px, transparent 1px, transparent 80px)' :
                undefined
            }}
            onDragOver={handleDragOver}
          >
            {/* Grid cells (for dropping) */}
            {!previewMode && isDragging && (
              <div className="absolute inset-0 pointer-events-none">
                {Array.from({ length: dashboard.gridRows }).map((_, row) => (
                  Array.from({ length: dashboard.gridCols }).map((_, col) => (
                    <div
                      key={`${row}-${col}`}
                      className="absolute border border-blue-200 bg-blue-50 opacity-50"
                      style={{
                        left: col * cellSize,
                        top: row * cellSize,
                        width: cellSize,
                        height: cellSize
                      }}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, col, row)}
                    />
                  ))
                )).flat()}
              </div>
            )}

            {/* Widgets */}
            {dashboard.widgets.map(widget => (
              <div
                key={widget.id}
                className={`absolute border-2 rounded-lg bg-white transition-all ${
                  selectedWidget?.id === widget.id
                    ? 'border-blue-500 shadow-lg z-10'
                    : 'border-gray-200 hover:border-gray-300'
                } ${!previewMode ? 'cursor-move' : ''}`}
                style={{
                  left: widget.x * cellSize,
                  top: widget.y * cellSize,
                  width: widget.width * cellSize - 4,
                  height: widget.height * cellSize - 4
                }}
                onClick={() => !previewMode && setSelectedWidget(widget)}
                draggable={!previewMode}
                onDragStart={(e) => {
                  e.dataTransfer.effectAllowed = 'move';
                  e.dataTransfer.setData('widgetId', widget.id);
                }}
                onDragEnd={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const canvas = e.currentTarget.parentElement?.getBoundingClientRect();
                  if (canvas) {
                    const newX = Math.round((rect.left - canvas.left) / cellSize);
                    const newY = Math.round((rect.top - canvas.top) / cellSize);
                    moveWidget(widget.id, Math.max(0, newX), Math.max(0, newY));
                  }
                }}
              >
                {/* Widget content */}
                <div className="p-4 h-full flex flex-col">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold text-sm">{widget.title}</h4>
                    {!previewMode && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedWidget(widget);
                        }}
                        className="p-1 hover:bg-gray-100 rounded"
                      >
                        <Cog6ToothIcon className="w-4 h-4 text-gray-500" />
                      </button>
                    )}
                  </div>

                  {/* Widget preview */}
                  <div className="flex-1 flex items-center justify-center text-gray-400">
                    {(() => {
                      const widgetType = WIDGET_TYPES.find(t => t.id === widget.type);
                      const Icon = widgetType?.icon || SquaresPlusIcon;
                      return <Icon className="w-12 h-12" />;
                    })()}
                  </div>

                  <div className="text-xs text-gray-500 mt-2">
                    {widget.bind}
                  </div>
                </div>

                {/* Resize handle */}
                {!previewMode && selectedWidget?.id === widget.id && (
                  <div
                    className="absolute bottom-0 right-0 w-4 h-4 bg-blue-500 cursor-se-resize"
                    draggable
                    onDragStart={(e) => {
                      e.stopPropagation();
                      e.dataTransfer.effectAllowed = 'move';
                    }}
                    onDragEnd={(e) => {
                      e.stopPropagation();
                      const rect = e.currentTarget.parentElement?.getBoundingClientRect();
                      const canvas = e.currentTarget.parentElement?.parentElement?.getBoundingClientRect();
                      if (rect && canvas) {
                        const newWidth = Math.round((rect.width + 4) / cellSize);
                        const newHeight = Math.round((rect.height + 4) / cellSize);
                        resizeWidget(widget.id, Math.max(1, newWidth), Math.max(1, newHeight));
                      }
                    }}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Settings Panel */}
      {selectedWidget && !previewMode && renderSettingsPanel()}
    </DashboardLayout>
  );
}