import { NextResponse } from 'next/server';

export function middleware() {
  return NextResponse.next();
}

// Configure matcher to be empty so it runs as a no-op passthrough and has zero performance overhead
export const config = {
  matcher: [],
};
