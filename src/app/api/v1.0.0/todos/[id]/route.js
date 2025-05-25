import createClient from '@/utils/supabase/api';
import { NextResponse } from 'next/server';
function extractFilePathFromUrl(imageUrl) {
  if (!imageUrl) return null;

  // Contoh URL: https://your-project.supabase.co/storage/v1/object/public/todos/nama_folder/2024-01/1704067200000_image.jpg
  // Hasil: nama_folder/2024-01/1704067200000_image.jpg
  const urlParts = imageUrl.split('/storage/v1/object/public/todos/');
  return urlParts.length > 1 ? urlParts[1] : null;
}
export async function GET(request, { params }) {
  try {
    const supabase = createClient(request);
    const { id } = await params;

    const { data: todo, error } = await supabase.from('todos').select('*').eq('id', id).single();

    if (error) {
      return NextResponse.json({ error: 'Todo not found' }, { status: 404 });
    }

    return NextResponse.json({ todo });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const supabase = createClient(request);
    const { id } = await params;

    const { data: currentTodo, error: fetchError } = await supabase
      .from('todos')
      .select('*')
      .eq('id', id)
      .single();
    console.log('currentTodo : ', currentTodo);
    if (fetchError || !currentTodo) {
      return NextResponse.json({ error: 'Todo not found' }, { status: 404 });
    }

    const formData = await request.formData();
    const headerImage = formData.get('headerImage');
    const task = formData.get('task');
    const is_complete = formData.get('is_complete');

    const updateData = {};
    if (task !== undefined) updateData.task = task;
    if (is_complete !== undefined) updateData.is_complete = is_complete === 'true';

    // Handle image update if new image is provided
    if (headerImage && headerImage.name) {
      // Delete old image from storage if it exists
      if (currentTodo.image_url) {
        const oldFilePath = extractFilePathFromUrl(currentTodo.image_url);
        if (oldFilePath) {
          const { error: deleteError } = await supabase.storage.from('todos').remove([oldFilePath]);

          if (deleteError) {
            console.error('Error deleting old image:', deleteError);
          }
        }
      }

      // Upload new image
      const date = new Date();
      const folderPath = `nama_folder/${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
        2,
        '0'
      )}`;
      const fileName = `${Date.now()}_${headerImage.name}`;
      const filePath = `${folderPath}/${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
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

      updateData.image_url = publicUrlData.publicUrl;
    }

    const { data: todo, error } = await supabase
      .from('todos')
      .update(updateData)
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

export async function DELETE(request, { params }) {
  try {
    const supabase = createClient(request);
    const { id } = await params;

    // Get current todo data first to get the image URL
    const { data: currentTodo, error: fetchError } = await supabase
      .from('todos')
      .select('image_url')
      .eq('id', id)
      .single();

    if (fetchError || !currentTodo) {
      return NextResponse.json({ error: 'Todo not found' }, { status: 404 });
    }

    // Delete the image from storage if it exists
    if (currentTodo.image_url) {
      const filePath = extractFilePathFromUrl(currentTodo.image_url);
      if (filePath) {
        const { error: deleteStorageError } = await supabase.storage
          .from('todos')
          .remove([filePath]);

        if (deleteStorageError) {
          console.error('Error deleting image from storage:', deleteStorageError);
          // Continue with database deletion even if storage deletion fails
        }
      }
    }

    // Delete the todo from database
    const { error } = await supabase.from('todos').delete().eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ message: 'Todo and associated image deleted successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
