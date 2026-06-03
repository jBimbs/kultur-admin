"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export function LogoutButton() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  async function handleLogout() {
    setIsLoading(true);
    try {
      await fetch("/api/logout", {
        method: "POST",
      });
      router.replace("/");
    } catch (error) {
      console.error("Logout failed:", error);
      setIsLoading(false);
    }
  }

  return (
    <Button onClick={handleLogout} disabled={isLoading} variant="outline">
      {isLoading ? "Logging out..." : "Logout"}
    </Button>
  );
}
