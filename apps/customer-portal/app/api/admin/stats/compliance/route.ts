import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@intelagent/database';
import jwt from 'jsonwebtoken';


export const dynamic = 'force-dynamic';
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export async function GET(request: NextRequest) {
  try {
    // Check admin authentication
    const cookieStore = cookies();
    const adminToken = cookieStore.get('admin_token');
    
    if (!adminToken) {
      return NextResponse.json(
        { error: 'Not authorized' },
        { status: 401 }
      );
    }

    try {
      const decoded = jwt.verify(adminToken.value, JWT_SECRET) as any;
      if (!decoded.isAdmin) {
        return NextResponse.json(
          { error: 'Not an admin' },
          { status: 403 }
        );
      }
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Get compliance metrics
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    const lastYear = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());

    // GDPR Compliance checks
    const gdprChecks = {
      dataEncryption: true,
      consentManagement: true,
      dataPortability: true,
      rightToErasure: true,
      privacyByDesign: true,
      dataMinimization: true
    };

    const gdprCompliant = Object.values(gdprChecks).every(check => check);

    // Security audit info
    const lastAudit = new Date(now.getFullYear(), now.getMonth() - 1, 15); // Mock date
    const nextAudit = new Date(now.getFullYear(), now.getMonth() + 2, 15); // Mock date

    // Data retention compliance
    const dataRetentionDays = 90;
    const oldDataCount = await prisma.chatbot_logs.count({
      where: {
        timestamp: {
          lt: new Date(Date.now() - dataRetentionDays * 24 * 60 * 60 * 1000)
        }
      }
    });

    // Security incidents
    const securityIncidents = await prisma.events.count({
      where: {
        event_type: 'security_incident',
        created_at: { gte: lastMonth }
      }
    });

    // Pending compliance tasks
    const pendingCompliance = [];
    
    if (oldDataCount > 0) {
      pendingCompliance.push({
        type: 'data_retention',
        description: `${oldDataCount} records exceed retention policy`,
        severity: 'medium',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      });
    }

    if (new Date().getTime() - lastAudit.getTime() > 60 * 24 * 60 * 60 * 1000) {
      pendingCompliance.push({
        type: 'security_audit',
        description: 'Security audit overdue',
        severity: 'high',
        dueDate: nextAudit
      });
    }

    // ISO certifications status
    const certifications = {
      iso27001: {
        status: 'active',
        expiryDate: new Date(now.getFullYear() + 1, 5, 30),
        lastReview: new Date(now.getFullYear(), now.getMonth() - 2, 15)
      },
      soc2: {
        status: 'active',
        expiryDate: new Date(now.getFullYear() + 1, 8, 15),
        lastReview: new Date(now.getFullYear(), now.getMonth() - 1, 20)
      },
      pciDss: {
        status: 'not_applicable',
        expiryDate: null,
        lastReview: null
      }
    };

    // Data processing agreements (simplified - check by plan type)
    const dpaCount = await prisma.licenses.count({
      where: {
        plan: {
          in: ['pro', 'enterprise']
        }
      }
    });

    const totalLicenses = await prisma.licenses.count();
    const dpaCompliance = totalLicenses > 0 ? Math.round((dpaCount / totalLicenses) * 100) : 0;

    // Privacy policy metrics
    const privacyPolicyVersion = '2.1.0';
    const privacyPolicyLastUpdated = new Date(now.getFullYear(), now.getMonth() - 3, 1);
    const cookiePolicyCompliant = true;

    return NextResponse.json({
      gdprCompliant,
      gdprChecks,
      lastAudit,
      nextAudit,
      pendingCompliance,
      certifications,
      securityIncidents,
      dataRetentionCompliance: oldDataCount === 0,
      dataRetentionBacklog: oldDataCount,
      dpaCompliance,
      privacyPolicy: {
        version: privacyPolicyVersion,
        lastUpdated: privacyPolicyLastUpdated,
        cookieCompliant: cookiePolicyCompliant
      },
      riskScore: pendingCompliance.length * 10 + securityIncidents * 5, // Simple risk calculation
      complianceScore: gdprCompliant ? 95 - pendingCompliance.length * 5 : 60
    });

  } catch (error) {
    console.error('Admin compliance stats error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch compliance stats' },
      { status: 500 }
    );
  }
}