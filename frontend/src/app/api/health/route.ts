/**
 * Health check endpoint for Docker healthcheck and monitoring.
 * 
 * Returns a simple JSON response indicating the service is up.
 */
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json(
    { 
      status: 'healthy',
      service: 'sabirov-frontend',
      timestamp: new Date().toISOString()
    },
    { status: 200 }
  );
}
