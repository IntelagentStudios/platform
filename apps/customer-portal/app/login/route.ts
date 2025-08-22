import { redirect } from 'next/navigation';

export async function GET() {
  // Redirect old login URLs to the new license validation page
  redirect('/validate-license');
}