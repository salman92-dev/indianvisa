import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

interface PaymentCredit {
  id: string;
  paypal_order_id: string;
  total_amount: number;
  currency: string;
  created_at: string;
  service_name: string;
}

export const usePaymentCredits = () => {
  const { user } = useAuth();
  const [credits, setCredits] = useState<PaymentCredit[]>([]);
  const [loading, setLoading] = useState(true);

  const loadCredits = useCallback(async () => {
    if (!user) {
      setCredits([]);
      setLoading(false);
      return;
    }

    try {
      // Find completed payments that don't have a linked application
      const { data, error } = await supabase
        .from("payments")
        .select("id, paypal_order_id, total_amount, currency, created_at, service_name, application_id")
        .eq("user_id", user.id)
        .eq("status", "completed")
        .is("application_id", null)
        .order("created_at", { ascending: true });

      if (error) throw error;

      setCredits(data || []);
    } catch (error) {
      console.error("Error loading payment credits:", error);
      setCredits([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadCredits();
  }, [loadCredits]);

  const useCredit = async (applicationId: string): Promise<boolean> => {
    if (credits.length === 0) return false;

    const creditToUse = credits[0];

    try {
      // Link the payment to the application
      const { error } = await supabase
        .from("payments")
        .update({ application_id: applicationId })
        .eq("id", creditToUse.id);

      if (error) throw error;

      // Refresh credits
      await loadCredits();
      return true;
    } catch (error) {
      console.error("Error using credit:", error);
      return false;
    }
  };

  return {
    credits,
    availableCredits: credits.length,
    loading,
    refresh: loadCredits,
    useCredit,
  };
};
