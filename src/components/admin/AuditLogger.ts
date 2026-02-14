import { supabase } from "@/integrations/supabase/client";

export type AuditAction = 
  | "user_registered"
  | "payment_initiated"
  | "payment_captured"
  | "payment_failed"
  | "payment_refunded"
  | "application_created"
  | "application_submitted"
  | "application_status_changed"
  | "email_sent"
  | "email_failed"
  | "document_uploaded"
  | "webhook_received";

export interface AuditLogEntry {
  action: AuditAction;
  entity_type: "user" | "payment" | "application" | "booking" | "email" | "webhook";
  entity_id: string;
  user_id?: string;
  changes?: Record<string, unknown>;
  ip_address?: string;
  user_agent?: string;
}

// Client-side helper for logging from frontend
export const logClientAuditEvent = async (
  action: AuditAction,
  entityType: AuditLogEntry["entity_type"],
  entityId: string,
  changes?: Record<string, unknown>
): Promise<boolean> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    // Use service role via edge function for audit logging to bypass RLS
    const { error } = await supabase.functions.invoke("log-audit-event", {
      body: {
        action,
        entity_type: entityType,
        entity_id: entityId,
        user_id: user?.id || null,
        changes: changes || null,
        user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
      },
    });

    if (error) {
      console.error("Failed to log audit event:", error);
      return false;
    }
    return true;
  } catch (err) {
    console.error("Audit logging error:", err);
    return false;
  }
};
