// src/middleware.ts - ENTERPRISE FINAL (Minimal interference)
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  console.log('🔍 MIDDLEWARE - Request:', request.nextUrl.pathname)
  
  // Let client-side handle all authentication
  // Just add security headers and pass through
  const response = NextResponse.next()
  
  // Security headers
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  
  console.log('✅ MIDDLEWARE - Passing through:', request.nextUrl.pathname)
  return response
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|manifest.json).*)',
  ],
}