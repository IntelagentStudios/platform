import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  return NextResponse.json({
    version: 'v2-simplified',
    timestamp: new Date().toISOString(),
    features: {
      singleThemeColor: true,
      multipleColors: false,
      checkboxOptions: false,
      simplifiedSettings: true
    },
    settingsStructure: {
      themeColor: 'Single color for all UI elements',
      position: 'bottom-left or bottom-right',
      welcomeMessage: 'Customizable greeting',
      responseStyle: 'professional/friendly/casual/technical'
    },
    deployedAt: '2024-11-11T18:50:00Z'
  });
}