import { useEffect, useState, useRef, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Clock, XCircle, ArrowRight, FileText, RefreshCw, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type PaymentStatusType = "pending" | "completed" | "failed" | "refunded" | "loading" | "not_found";

interface PaymentData {
  id: string;
  paypal_order_id: string;
  paypal_capture_id: string | null;
  amount: number;
  total_amount: number;
  currency: string;
  status: "pending" | "completed" | "failed" | "refunded";
  service_name: string;
  created_at: string;
  application_id: string | null;
}

const PaymentStatus = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [payment, setPayment] = useState<PaymentData | null>(null);
  const [status, setStatus] = useState<PaymentStatusType>("loading");
  const [pollCount, setPollCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const orderId = searchParams.get("orderId");
  const bookingId = searchParams.get("bookingId");
  const applicationId = searchParams.get("applicationId");

  const MAX_POLL_ATTEMPTS = 30; // Poll for up to 2.5 minutes
  const POLL_INTERVAL_MS = 5000; // 5 seconds

  const fetchPaymentStatus = useCallback(async () => {
    if (!orderId) {
      setStatus("not_found");
      return;
    }

    try {
      const { data, error } = await supabase
        .from("payments")
        .select("*")
        .eq("paypal_order_id", orderId)
        .maybeSingle();

      if (error) {
        console.error("Error fetching payment:", error);
        setStatus("failed");
        return;
      }

      if (!data) {
        // Payment record not found yet - might still be processing
        if (pollCount < MAX_POLL_ATTEMPTS) {
          setStatus("pending");
        } else {
          setStatus("not_found");
        }
        return;
      }

      setPayment(data as PaymentData);

      if (data.status === "completed") {
        setStatus("completed");
        // Stop polling once completed
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
        }
      } else if (data.status === "failed") {
        setStatus("failed");
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
        }
      } else if (data.status === "refunded") {
        setStatus("refunded");
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
        }
      } else {
        setStatus("pending");
      }
    } catch (err) {
      console.error("Payment fetch error:", err);
      setStatus("failed");
    }
  }, [orderId, pollCount]);

  // Initial fetch and polling setup
  useEffect(() => {
    fetchPaymentStatus();

    // Start polling only if we have an orderId
    if (orderId) {
      pollIntervalRef.current = setInterval(() => {
        setPollCount((prev) => {
          if (prev >= MAX_POLL_ATTEMPTS) {
            if (pollIntervalRef.current) {
              clearInterval(pollIntervalRef.current);
              pollIntervalRef.current = null;
            }
            return prev;
          }
          fetchPaymentStatus();
          return prev + 1;
        });
      }, POLL_INTERVAL_MS);
    }

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [orderId, fetchPaymentStatus]);

  const handleRetry = async () => {
    setIsRetrying(true);
    setPollCount(0);
    setStatus("loading");
    await fetchPaymentStatus();
    setIsRetrying(false);
  };

  const handleContinueApplication = () => {
    if (applicationId) {
      navigate(`/apply-visa?id=${applicationId}`);
    } else if (payment?.application_id) {
      navigate(`/apply-visa?id=${payment.application_id}`);
    } else if (bookingId) {
      navigate(`/dashboard`);
    } else {
      navigate("/apply-visa");
    }
  };

  const handleTryPaymentAgain = () => {
    navigate("/book-visa");
  };

  const getStatusIcon = () => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-16 w-16 text-green-500" />;
      case "pending":
      case "loading":
        return <Clock className="h-16 w-16 text-amber-500 animate-pulse" />;
      case "failed":
      case "not_found":
        return <XCircle className="h-16 w-16 text-destructive" />;
      case "refunded":
        return <RefreshCw className="h-16 w-16 text-blue-500" />;
      default:
        return <Loader2 className="h-16 w-16 animate-spin text-muted-foreground" />;
    }
  };

  const getStatusTitle = () => {
    switch (status) {
      case "completed":
        return "Payment Successful!";
      case "pending":
        return "Processing Payment...";
      case "loading":
        return "Checking Payment Status...";
      case "failed":
        return "Payment Failed";
      case "not_found":
        return "Payment Not Found";
      case "refunded":
        return "Payment Refunded";
      default:
        return "Payment Status";
    }
  };

  const getStatusDescription = () => {
    switch (status) {
      case "completed":
        return "Your booking has been confirmed. You can now proceed to complete your visa application.";
      case "pending":
        return "Your payment is being processed. This usually takes a few seconds. Please wait...";
      case "loading":
        return "We're checking the status of your payment. Please wait...";
      case "failed":
        return "There was an issue processing your payment. Please try again or contact support.";
      case "not_found":
        return "We couldn't find a payment with this order ID. If you recently paid, please wait a moment and refresh.";
      case "refunded":
        return "This payment has been refunded. Please contact support if you have questions.";
      default:
        return "";
    }
  };

  return (
    <div className="py-12">
      <div className="container max-w-2xl mx-auto px-4">
          <Card className="overflow-hidden">
            <CardHeader className="text-center pb-6">
              <div className="flex justify-center mb-4">
                {getStatusIcon()}
              </div>
              <CardTitle className="text-2xl">{getStatusTitle()}</CardTitle>
              <p className="text-muted-foreground mt-2 max-w-md mx-auto">
                {getStatusDescription()}
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Polling indicator for pending status */}
              {(status === "pending" || status === "loading") && (
                <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <Loader2 className="h-5 w-5 animate-spin text-amber-600 dark:text-amber-400" />
                    <div>
                      <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                        Checking payment status...
                      </p>
                      <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                        Attempt {pollCount + 1} of {MAX_POLL_ATTEMPTS}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Success next steps */}
              {status === "completed" && (
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <FileText className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <h3 className="font-semibold">Next Step: Complete Your Application</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Please complete your visa application form with all required details and upload necessary documents.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Payment details */}
              {payment && (
                <div className="space-y-2 border-t pt-4">
                  <h3 className="font-semibold">Payment Details</h3>
                  <dl className="grid grid-cols-2 gap-2 text-sm">
                    <dt className="text-muted-foreground">Order ID:</dt>
                    <dd className="font-mono text-xs truncate">{payment.paypal_order_id}</dd>
                    {payment.paypal_capture_id && (
                      <>
                        <dt className="text-muted-foreground">Transaction ID:</dt>
                        <dd className="font-mono text-xs truncate">{payment.paypal_capture_id}</dd>
                      </>
                    )}
                    <dt className="text-muted-foreground">Amount:</dt>
                    <dd className="font-medium">{payment.currency} {payment.total_amount.toFixed(2)}</dd>
                    <dt className="text-muted-foreground">Service:</dt>
                    <dd>{payment.service_name}</dd>
                    <dt className="text-muted-foreground">Status:</dt>
                    <dd className={`capitalize font-medium ${
                      payment.status === "completed" ? "text-green-600" :
                      payment.status === "pending" ? "text-amber-600" :
                      payment.status === "refunded" ? "text-blue-600" :
                      "text-destructive"
                    }`}>
                      {payment.status}
                    </dd>
                  </dl>
                </div>
              )}

              {/* Action buttons based on status */}
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                {status === "completed" && (
                  <>
                    <Button
                      onClick={handleContinueApplication}
                      className="flex-1"
                      size="lg"
                    >
                      Complete Application
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => navigate("/dashboard")}
                      className="flex-1"
                      size="lg"
                    >
                      Go to Dashboard
                    </Button>
                  </>
                )}

                {(status === "failed" || status === "not_found") && (
                  <>
                    <Button
                      onClick={handleTryPaymentAgain}
                      className="flex-1"
                      size="lg"
                    >
                      Try Payment Again
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleRetry}
                      disabled={isRetrying}
                      className="flex-1"
                      size="lg"
                    >
                      {isRetrying ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCw className="mr-2 h-4 w-4" />
                      )}
                      Check Status Again
                    </Button>
                  </>
                )}

                {(status === "pending" || status === "loading") && (
                  <Button
                    variant="outline"
                    onClick={() => navigate("/dashboard")}
                    className="w-full"
                    size="lg"
                  >
                    Go to Dashboard
                  </Button>
                )}

                {status === "refunded" && (
                  <>
                    <Button
                      onClick={handleTryPaymentAgain}
                      className="flex-1"
                      size="lg"
                    >
                      Book New Visa
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => navigate("/contact")}
                      className="flex-1"
                      size="lg"
                    >
                      Contact Support
                    </Button>
                  </>
                )}
              </div>

              {status === "completed" && (
                <p className="text-xs text-muted-foreground text-center">
                  A confirmation email has been sent to your registered email address.
                </p>
              )}
            </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PaymentStatus;
