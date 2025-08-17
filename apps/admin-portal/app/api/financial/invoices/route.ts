import { NextRequest, NextResponse } from 'next/server'

// GET /api/financial/invoices
export async function GET(req: NextRequest) {
  // Temporarily disabled - invoice model not yet in schema
  return NextResponse.json({ 
    invoices: [],
    total: 0,
    message: 'Invoice functionality is coming soon'
  })
}

// POST /api/financial/invoices
export async function POST(req: NextRequest) {
  // Temporarily disabled - invoice model not yet in schema
  return NextResponse.json({ 
    error: 'Invoice creation is temporarily disabled'
  }, { status: 503 })
}