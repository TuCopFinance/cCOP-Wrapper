/**
 * Farcaster Webhook API Route
 * Handles notifications and events from Farcaster
 */

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Log webhook events for monitoring
    console.log('Farcaster webhook received:', {
      timestamp: new Date().toISOString(),
      event: body,
    });

    // Handle different webhook event types
    switch (body.type) {
      case 'frame_added':
        console.log('Frame added to Farcaster:', body);
        break;
      
      case 'frame_removed':
        console.log('Frame removed from Farcaster:', body);
        break;
      
      case 'notification':
        console.log('Notification event:', body);
        break;
      
      default:
        console.log('Unknown webhook event type:', body.type);
    }

    // Respond with 200 OK
    return NextResponse.json({ 
      success: true,
      received: true 
    }, { status: 200 });
    
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Failed to process webhook' 
    }, { status: 500 });
  }
}

// Handle GET requests for webhook verification
export async function GET() {
  return NextResponse.json({ 
    status: 'ok',
    service: 'cCOP Wrapper Webhook',
    timestamp: new Date().toISOString()
  });
}

