import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import Stripe from 'stripe';

const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-08-27.basil'
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, requirements, skills, price } = body;

    // Get user's license key and ID from cookies
    const licenseKey = request.cookies.get('licenseKey')?.value;
    const userId = request.cookies.get('userId')?.value;

    if (!licenseKey || !userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Generate unique agent ID
    const agentId = `agent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Save agent configuration to database
    const agentConfig = {
      id: agentId,
      name,
      description,
      requirements,
      skills,
      price,
      status: price > 0 ? 'pending_payment' : 'active',
      createdAt: new Date().toISOString(),
      createdBy: userId
    };

    await prisma.product_configurations.create({
      data: {
        product_key: licenseKey,
        license_key: licenseKey,
        customization_type: 'agent',
        custom_name: agentId,
        product_name: name,
        description,
        configuration: JSON.stringify(agentConfig),
        created_at: new Date()
      }
    });

    // Log audit event
    await prisma.skill_audit_log.create({
      data: {
        event_type: 'agent_created',
        skill_id: 'agent_builder',
        user_id: userId,
        license_key: licenseKey,
        event_data: {
          agent_id: agentId,
          agent_name: name,
          skill_count: skills.length,
          total_price: price
        },
        created_at: new Date()
      }
    });

    // If paid agent, create Stripe checkout session
    if (price > 0) {
      try {
        // Create Stripe product for the agent
        const product = await stripe.products.create({
          name: `${name} - Custom AI Agent`,
          description: description || 'Custom AI agent with selected skills',
          metadata: {
            agent_id: agentId,
            license_key: licenseKey,
            user_id: userId
          }
        });

        // Create price
        const stripePrice = await stripe.prices.create({
          product: product.id,
          unit_amount: price * 100, // Convert pounds to pence
          currency: 'gbp',
          recurring: {
            interval: 'month'
          }
        });

        // Create checkout session
        const session = await stripe.checkout.sessions.create({
          payment_method_types: ['card'],
          line_items: [
            {
              price: stripePrice.id,
              quantity: 1
            }
          ],
          mode: 'subscription',
          success_url: `${process.env.NEXTAUTH_URL}/dashboard?agent=${agentId}&status=activated`,
          cancel_url: `${process.env.NEXTAUTH_URL}/agent-builder?canceled=true`,
          metadata: {
            agent_id: agentId,
            license_key: licenseKey,
            user_id: userId
          },
          subscription_data: {
            metadata: {
              agent_id: agentId,
              license_key: licenseKey,
              user_id: userId
            }
          }
        });

        return NextResponse.json({
          success: true,
          agentId,
          checkoutUrl: session.url
        });
      } catch (stripeError) {
        console.error('Stripe error:', stripeError);
        // If Stripe fails, still return success but without checkout URL
        return NextResponse.json({
          success: true,
          agentId,
          message: 'Agent created successfully. Please contact support for payment setup.'
        });
      }
    } else {
      // Free agent - activate immediately
      return NextResponse.json({
        success: true,
        agentId,
        message: 'Free agent activated successfully'
      });
    }
  } catch (error) {
    console.error('Error creating agent:', error);
    return NextResponse.json(
      { error: 'Failed to create agent' },
      { status: 500 }
    );
  }
}