import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type PlanName = "trial" | "starter" | "growth" | "enterprise" | "free";
export type SubStatus = "trialing" | "active" | "expired" | "cancelled" | "past_due";

const LIMITS: Record<string, { maxRequests: number; maxLocations: number; maxTeam: number }> = {
  trial: { maxRequests: 50, maxLocations: 1, maxTeam: 1 },
  starter: { maxRequests: 500, maxLocations: 1, maxTeam: 1 },
  growth: { maxRequests: Infinity, maxLocations: Infinity, maxTeam: Infinity },
  enterprise: { maxRequests: Infinity, maxLocations: Infinity, maxTeam: Infinity },
  free: { maxRequests: 0, maxLocations: 0, maxTeam: 0 },
};

export function usePlanAccess() {
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ["plan-access", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const sub = query.data;
  const plan = (sub?.plan ?? "trial") as PlanName;
  const status = (sub?.status ?? "trialing") as SubStatus;
  const trialEndsAt = sub?.trial_ends_at ? new Date(sub.trial_ends_at) : null;

  const now = Date.now();
  const msLeft = trialEndsAt ? trialEndsAt.getTime() - now : 0;
  const daysLeft = trialEndsAt ? Math.ceil(msLeft / (1000 * 60 * 60 * 24)) : 0;

  const isTrialing = status === "trialing" && plan === "trial" && msLeft > 0;
  const isPaid = (plan === "starter" || plan === "growth" || plan === "enterprise") && status === "active";
  const hasAccess = isTrialing || isPaid;
  const isExpired = !hasAccess;

  const limits = LIMITS[plan] ?? LIMITS.trial;

  return {
    isLoading: query.isLoading,
    subscription: sub,
    plan,
    status,
    trialEndsAt,
    daysLeft,
    isTrialing,
    isPaid,
    hasAccess,
    isExpired,
    limits,
    refetch: query.refetch,
  };
}
