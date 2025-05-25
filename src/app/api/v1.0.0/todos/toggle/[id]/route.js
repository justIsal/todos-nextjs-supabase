import createClient from '@/utils/supabase/api';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

// PATCH - Toggle status is_complete todo
export async function PATCH(request, { params }) {
  try {
    const supabase = createClient(request);
    const { id } = await params;

    // Ambil todo saat ini
    const { data: currentTodo, error: fetchError } = await supabase
      .from('todos')
      .select('is_complete')
      .eq('id', id)
      .single();

    if (fetchError) {
      return NextResponse.json({ error: 'Todo not found' }, { status: 404 });
    }

    // Toggle status is_complete
    const { data: todo, error } = await supabase
      .from('todos')
      .update({ is_complete: !currentTodo.is_complete })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ todo });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
