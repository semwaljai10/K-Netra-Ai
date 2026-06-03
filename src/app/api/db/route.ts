import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { action, key, value } = await request.json();
    const token = 'nl0h71zj';
    
    if (action === 'get') {
      const url = `https://keyvalue.immanuel.co/api/KeyVal/GetValue/${token}/${key}?t=${Date.now()}`;
      const res = await fetch(url, {
        cache: 'no-store'
      });
      if (!res.ok) {
        return NextResponse.json({ error: `Failed to fetch key: ${res.status}` }, { status: res.status });
      }
      const data = await res.json();
      return NextResponse.json({ data });
    } else if (action === 'update') {
      const url = `https://keyvalue.immanuel.co/api/KeyVal/UpdateValue/${token}/${key}?value=${value}`;
      const res = await fetch(url, {
        method: 'POST',
        body: ''
      });
      if (!res.ok) {
        return NextResponse.json({ error: `Failed to update key: ${res.status}` }, { status: res.status });
      }
      const text = await res.text();
      return NextResponse.json({ success: text.trim() === 'true' });
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (err: any) {
    console.error('API proxy error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
