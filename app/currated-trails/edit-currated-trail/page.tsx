import { redirect } from "next/navigation";

export default function EditCurratedTrailPage() {
  // This page exists only to catch old links; the real route is /edit-currated-trail/[id].
  redirect("/currated-trails/view-currated-trails");
}

