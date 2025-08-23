import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';


export const dynamic = 'force-dynamic';
export async function POST() {
  try {
    const cookieStore = cookies();
    
    // Clear admin cookies
    cookieStore.delete('admin_token');
    cookieStore.delete('user_role');
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Failed to logout' },
      { status: 500 }
    );
  }
}