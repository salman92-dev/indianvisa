import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface UseAdminAuthReturn {
  isAdmin: boolean;
  loading: boolean;
  user: any;
}

/**
 * Centralized admin authentication hook.
 * Checks if the current user has admin role and redirects non-admins.
 * RLS policies on user_roles table ensure only admins can query their own role.
 */
export const useAdminAuth = (): UseAdminAuthReturn => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAdminAccess = async () => {
      if (authLoading) return;

      if (!user) {
        navigate("/login");
        setLoading(false);
        return;
      }

      try {
        // RLS policy ensures only users with admin role can see their role entry
        const { data, error } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .eq("role", "admin")
          .maybeSingle();

        if (error) {
          console.error("Admin auth check error:", error);
          navigate("/dashboard");
          setLoading(false);
          return;
        }

        if (!data) {
          // Not an admin, redirect to user dashboard
          navigate("/dashboard");
          setLoading(false);
          return;
        }

        setIsAdmin(true);
      } catch (error) {
        console.error("Admin auth check failed:", error);
        navigate("/dashboard");
      } finally {
        setLoading(false);
      }
    };

    checkAdminAccess();
  }, [user, authLoading, navigate]);

  return { isAdmin, loading: authLoading || loading, user };
};

export default useAdminAuth;
