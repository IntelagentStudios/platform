import { redirect } from 'next/navigation';

export async function GET() {
  // Redirect to admin login
  redirect('/admin/login');
}