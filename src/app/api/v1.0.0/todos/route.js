import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET(req) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      }
    );

    const { data: todos, error } = await supabase
      .from('todos')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ todos });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      }
    );
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    const formData = await request.formData();
    const headerImage = formData.get('headerImage');
    const task = formData.get('task');

    if (!headerImage || !headerImage.name) {
      return NextResponse.json(
        { error: 'Header image is required and must have a valid name.' },
        { status: 400 }
      );
    }
    if (!task) {
      return NextResponse.json({ error: 'task and content are required.' }, { status: 400 });
    }

    const date = new Date();
    const folderPath = `nama_folder/${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
      2,
      '0'
    )}`;
    const fileName = `${Date.now()}_${headerImage.name}`;
    const filePath = `${folderPath}/${fileName}`;
    console.log('file path', filePath);

    const { data, error: uploadError } = await supabase.storage
      .from('todos')
      .upload(filePath, headerImage);

    if (uploadError) {
      return NextResponse.json(
        { error: `Error uploading image: ${uploadError.message}` },
        { status: 500 }
      );
    }
    const { data: publicUrlData, error: publicUrlError } = supabase.storage
      .from('todos')
      .getPublicUrl(filePath);

    if (publicUrlError) {
      throw new Error(`Error getting public URL: ${publicUrlError.message}`);
    }

    const image_url = publicUrlData.publicUrl;
    console.log('image_url :', image_url);
    const { data: todo, error } = await supabase
      .from('todos')
      .insert([{ task, image_url }])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ jasdsd: 'image_url' }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
