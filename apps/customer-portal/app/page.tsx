import { redirect } from 'next/navigation';

export default function HomePage() {
  // The middleware will handle authentication
  // Just redirect to dashboard
  redirect('/dashboard');
}