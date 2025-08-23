// Force all API routes to be dynamic
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  return Response.json({ status: 'API is running' });
}