import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    // Get user's license key from cookies
    const licenseKey = request.cookies.get('licenseKey')?.value;
    const userId = request.cookies.get('userId')?.value;

    if (!licenseKey || !userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get dashboard ID from query params
    const { searchParams } = new URL(request.url);
    const dashboardId = searchParams.get('id');

    if (dashboardId) {
      // Fetch specific dashboard
      const dashboard = await prisma.product_configurations.findFirst({
        where: {
          product_key: licenseKey,
          customization_type: 'dashboard',
          custom_name: dashboardId
        }
      });

      if (dashboard) {
        return NextResponse.json({
          success: true,
          dashboard: JSON.parse(dashboard.configuration as string || '{}')
        });
      } else {
        return NextResponse.json(
          { error: 'Dashboard not found' },
          { status: 404 }
        );
      }
    } else {
      // Fetch all dashboards
      const dashboards = await prisma.product_configurations.findMany({
        where: {
          product_key: licenseKey,
          customization_type: 'dashboard'
        }
      });

      return NextResponse.json({
        success: true,
        dashboards: dashboards.map(d => ({
          id: d.custom_name,
          ...JSON.parse(d.configuration as string || '{}')
        }))
      });
    }
  } catch (error) {
    console.error('Error fetching dashboards:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboards' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, description, widgets, gridCols, gridRows, theme } = body;

    // Get user's license key from cookies
    const licenseKey = request.cookies.get('licenseKey')?.value;
    const userId = request.cookies.get('userId')?.value;

    if (!licenseKey || !userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Save dashboard configuration
    const dashboardConfig = {
      id,
      name,
      description,
      widgets,
      gridCols,
      gridRows,
      theme,
      updatedAt: new Date().toISOString(),
      updatedBy: userId
    };

    // Check if dashboard exists
    const existing = await prisma.product_configurations.findFirst({
      where: {
        product_key: licenseKey,
        customization_type: 'dashboard',
        custom_name: id
      }
    });

    if (existing) {
      // Update existing dashboard
      await prisma.product_configurations.update({
        where: { id: existing.id },
        data: {
          configuration: JSON.stringify(dashboardConfig),
          updated_at: new Date()
        }
      });
    } else {
      // Create new dashboard
      await prisma.product_configurations.create({
        data: {
          product_key: licenseKey,
          license_key: licenseKey,
          customization_type: 'dashboard',
          custom_name: id,
          product_name: name,
          description,
          configuration: JSON.stringify(dashboardConfig),
          created_at: new Date()
        }
      });
    }

    // Log audit event
    await prisma.skill_audit_log.create({
      data: {
        event_type: 'dashboard_saved',
        skill_id: 'dashboard_builder',
        user_id: userId,
        license_key: licenseKey,
        event_data: {
          dashboard_id: id,
          dashboard_name: name,
          widget_count: widgets.length
        },
        created_at: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Dashboard saved successfully',
      dashboardId: id
    });
  } catch (error) {
    console.error('Error saving dashboard:', error);
    return NextResponse.json(
      { error: 'Failed to save dashboard' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Get dashboard ID from query params
    const { searchParams } = new URL(request.url);
    const dashboardId = searchParams.get('id');

    if (!dashboardId) {
      return NextResponse.json(
        { error: 'Dashboard ID required' },
        { status: 400 }
      );
    }

    // Get user's license key from cookies
    const licenseKey = request.cookies.get('licenseKey')?.value;
    const userId = request.cookies.get('userId')?.value;

    if (!licenseKey || !userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Find and delete dashboard
    const dashboard = await prisma.product_configurations.findFirst({
      where: {
        product_key: licenseKey,
        customization_type: 'dashboard',
        custom_name: dashboardId
      }
    });

    if (dashboard) {
      await prisma.product_configurations.delete({
        where: { id: dashboard.id }
      });

      // Log audit event
      await prisma.skill_audit_log.create({
        data: {
          event_type: 'dashboard_deleted',
          skill_id: 'dashboard_builder',
          user_id: userId,
          license_key: licenseKey,
          event_data: {
            dashboard_id: dashboardId
          },
          created_at: new Date()
        }
      });

      return NextResponse.json({
        success: true,
        message: 'Dashboard deleted successfully'
      });
    } else {
      return NextResponse.json(
        { error: 'Dashboard not found' },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error('Error deleting dashboard:', error);
    return NextResponse.json(
      { error: 'Failed to delete dashboard' },
      { status: 500 }
    );
  }
}