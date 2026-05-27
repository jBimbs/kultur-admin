import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const name = (form.get('name') as string) || '';
    const description = (form.get('description') as string) || '';
    const city = (form.get('city') as string) || '';
    const month_celebrated = (form.get('month_celebrated') as string) || '';
    const latitude = form.get('latitude') as string | null;
    const longitude = form.get('longitude') as string | null;
    const image = form.get('image') as File | null;

    if (!name.trim() || !description.trim()) {
      return NextResponse.json({ error: 'Name and description are required.' }, { status: 400 });
    }

    let imageUrl: string | null = null;

    if (image && image.size > 0) {
      const buffer = Buffer.from(await image.arrayBuffer());
      const fileName = `FESTIVALS/${Date.now()}_${image.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
      const bucket = 'KulturAR-assets';

      const { error: uploadError } = await supabaseAdmin.storage
        .from(bucket)
        .upload(fileName, buffer, { upsert: true });

      if (uploadError) {
        return NextResponse.json({ error: uploadError.message }, { status: 500 });
      }

      const { data } = supabaseAdmin.storage.from(bucket).getPublicUrl(fileName);
      imageUrl = data?.publicUrl || null;
    }

    const insertObj: any = {
      name: name.trim(),
      description: description.trim(),
      city: city.trim(),
      month_celebrated: month_celebrated.trim(),
      image_url: imageUrl,
    };

    if (latitude) insertObj.latitude = Number(latitude);
    if (longitude) insertObj.longitude = Number(longitude);

    const { error: dbError } = await supabaseAdmin.from('festivals').insert([insertObj]);

    if (dbError) {
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Unknown error' }, { status: 500 });
  }
}
