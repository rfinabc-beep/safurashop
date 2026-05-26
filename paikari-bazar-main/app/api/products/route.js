import { NextResponse } from 'next/server';

const SUPABASE_URL = 'https://xxqtdlwglpggqafecuka.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4cXRkbHdnbHBnZ3FhZmVjdWthIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcxNDQwODcsImV4cCI6MjA5MjcyMDA4N30.gkqQTxM1n6Jqe-fBrf9RaI1EByJTX7Uv1QvECqzSDDI';

const headers = {
  'apikey': SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
  'Prefer': 'return=representation',
};

// GET - সব products আনো
export async function GET() {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/products?select=*&order=created_at.desc`,
      { headers }
    );
    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST - নতুন product যোগ
export async function POST(request) {
  try {
    const body = await request.json();
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/products`,
      { method: 'POST', headers, body: JSON.stringify(body) }
    );
    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PUT - product update
export async function PUT(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

    const body = await request.json();
    // id, created_at বাদ দিয়ে পাঠাও
    const { id: _id, created_at, ...updateData } = body;

    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/products?id=eq.${id}`,
      { method: 'PATCH', headers, body: JSON.stringify(updateData) }
    );
    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE - product মুছো
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/products?id=eq.${id}`,
      { method: 'DELETE', headers }
    );
    return NextResponse.json({ success: res.ok });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
