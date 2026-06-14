import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface Business {
  id: string;
  user_id: string;
  business_name: string;
  manager_phone: string;
  google_review_url: string | null;
  address: string | null;
  apology_offer: string | null;
  created_at: string;
  updated_at: string;
}

export function useBusiness() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["business", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("businesses")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      return data as Business | null;
    },
    enabled: !!user,
  });
}

export function useUpdateBusiness() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (updates: Partial<Business>) => {
      if (!user) throw new Error("Not authenticated");
      // Check whether a business row exists for this user
      const { data: existing } = await supabase
        .from("businesses")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (existing) {
        const { data, error } = await supabase
          .from("businesses")
          .update({ ...updates, updated_at: new Date().toISOString() })
          .eq("user_id", user.id)
          .select()
          .single();
        if (error) throw error;
        return data;
      }

      // First save → insert. Require a business name.
      const insertPayload = {
        user_id: user.id,
        business_name: updates.business_name?.trim() || "My Business",
        manager_phone: updates.manager_phone?.trim() || "",
        google_review_url: updates.google_review_url ?? null,
        address: updates.address ?? null,
        apology_offer: updates.apology_offer ?? null,
      };
      const { data, error } = await supabase
        .from("businesses")
        .insert(insertPayload)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["business"] });
    },
  });
}

export function useCreateBusiness() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (business: { business_name: string; manager_phone: string; google_review_url?: string; address?: string }) => {
      if (!user) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("businesses")
        .insert({ ...business, user_id: user.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["business"] });
    },
  });
}
