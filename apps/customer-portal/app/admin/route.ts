import { redirect } from 'next/navigation';

export async function GET() {
  // Redirect to admin portal if it's on a different domain
  // For now, redirect to a message page explaining the setup
  redirect('/admin-access');
}