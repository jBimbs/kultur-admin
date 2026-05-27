import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase";
import FestivalEditForm from "@/app/festivals/edit/[id]/festival-edit-form";

type Festival = {
  id: number;
  name: string | null;
  description: string | null;
  city: string | null;
  month_celebrated: string | null;
  image_url: string | null;
};

export default async function EditFestivalPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: idParam } = await params;
  const id = Number(idParam);

  if (Number.isNaN(id)) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10">
        <p className="text-rose-600">Invalid festival ID.</p>
        <Link href="/festivals/view-festivals" className="text-slate-700 underline">
          Back to festivals
        </Link>
      </div>
    );
  }

  const { data, error } = await supabaseAdmin
    .from("festivals")
    .select("id, name, description, city, month_celebrated, image_url")
    .eq("id", id)
    .single();

  if (error || !data) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10">
        <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-rose-900 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-200">
          <p className="font-semibold">Festival with ID {id} not found.</p>
          {error && <p className="mt-1 text-sm opacity-80">Error: {error.message}</p>}
        </div>
        <Link href="/festivals/view-festivals" className="text-slate-700 underline">
          Back to festivals
        </Link>
      </div>
    );
  }

  const festival: Festival = {
    id: data.id,
    name: data.name,
    description: data.description,
    city: data.city,
    month_celebrated: data.month_celebrated,
    image_url: data.image_url,
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Edit Festival</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Update festival details</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-400">
              Edit and save information for {festival.name || "this festival"}.
            </p>
          </div>
          <Link href="/festivals/view-festivals">
            <button className="inline-flex items-center rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800">
              Back to festivals
            </button>
          </Link>
        </div>

        <FestivalEditForm festival={festival} />
      </div>
    </div>
  );
}
