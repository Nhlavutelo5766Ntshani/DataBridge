"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { getSessionAction } from "@/lib/actions/auth";
import type { SessionData } from "@/lib/auth/session";

/**
 * Hook to get the current logged-in user
 * Redirects to login if not authenticated
 */
export function useCurrentUser() {
  const router = useRouter();
  const [user, setUser] = useState<SessionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const session = await getSessionAction();
        if (session?.userId) {
          setUser(session);
        } else {
          toast.error("Please log in to continue");
          router.push("/login");
        }
      } catch (error) {
        console.error("Error loading user session:", error);
        toast.error("Please log in to continue");
        router.push("/login");
      } finally {
        setIsLoading(false);
      }
    };
    loadUser();
  }, [router]);

  return { user, isLoading, userId: user?.userId || null };
}

