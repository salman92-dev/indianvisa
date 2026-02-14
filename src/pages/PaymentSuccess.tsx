import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, ArrowRight, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [payment, setPayment] = useState<any>(null);
  const orderId = searchParams.get("orderId");
  const applicationId = searchParams.get("applicationId");

  useEffect(() => {
    if (orderId) {
      loadPaymentDetails();
    }
  }, [orderId]);

  const loadPaymentDetails = async () => {
    const { data } = await supabase
      .from("payments")
      .select("*")
      .eq("paypal_order_id", orderId)
      .single();
    
    if (data) setPayment(data);
  };

  const handleContinueApplication = () => {
    if (applicationId) {
      navigate(`/apply-visa?id=${applicationId}`);
    } else if (payment?.application_id) {
      navigate(`/apply-visa?id=${payment.application_id}`);
    } else {
      navigate("/apply-visa");
    }
  };

  return (
    <div className="py-12">
      <div className="container max-w-2xl mx-auto px-4">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <CheckCircle className="h-12 w-12 text-green-500" />
              <div>
                <CardTitle className="text-2xl">Payment Successful!</CardTitle>
                <p className="text-muted-foreground mt-1">Your booking has been confirmed</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
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
            
            {payment && (
              <div className="space-y-2 border-t pt-4">
                <h3 className="font-semibold">Payment Details</h3>
                <dl className="grid grid-cols-2 gap-2 text-sm">
                  <dt className="text-muted-foreground">Transaction ID:</dt>
                  <dd className="font-mono text-xs">{payment.paypal_capture_id || payment.paypal_order_id}</dd>
                  <dt className="text-muted-foreground">Amount:</dt>
                  <dd>{payment.total_amount} {payment.currency}</dd>
                  <dt className="text-muted-foreground">Service:</dt>
                  <dd>{payment.service_name}</dd>
                  <dt className="text-muted-foreground">Status:</dt>
                  <dd className="capitalize text-green-600 font-medium">{payment.status}</dd>
                </dl>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button 
                onClick={handleContinueApplication}
                className="flex-1 bg-gradient-to-r from-primary to-primary/90"
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
            </div>

            <p className="text-xs text-muted-foreground text-center">
              A confirmation email has been sent to your registered email address.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PaymentSuccess;
