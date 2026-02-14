import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ApplicationData } from "@/types/visa-application";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import PayPalButton from "@/components/PayPalButton";

interface ReviewTabProps {
  data: ApplicationData;
  applicationId: string;
  onBack: () => void;
}

const ReviewTab = ({ data, applicationId, onBack }: ReviewTabProps) => {
  const navigate = useNavigate();
  const [accepted, setAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handlePaymentSuccess = (paymentData: any) => {
    navigate(`/payment-success?orderId=${paymentData.orderId}`);
  };

  const handlePaymentError = (error: any) => {
    console.error("Payment error:", error);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Review & Submit</CardTitle>
        <CardDescription>Please review your application carefully</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">Personal Information</h3>
            <dl className="grid grid-cols-2 gap-2 text-sm">
              <dt className="text-muted-foreground">Full Name:</dt>
              <dd>{data.full_name}</dd>
              <dt className="text-muted-foreground">Date of Birth:</dt>
              <dd>{data.date_of_birth}</dd>
              <dt className="text-muted-foreground">Gender:</dt>
              <dd className="capitalize">{data.gender}</dd>
              <dt className="text-muted-foreground">Nationality:</dt>
              <dd>{data.nationality}</dd>
              <dt className="text-muted-foreground">Passport Number:</dt>
              <dd>{data.passport_number}</dd>
            </dl>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Contact Information</h3>
            <dl className="grid grid-cols-2 gap-2 text-sm">
              <dt className="text-muted-foreground">Email:</dt>
              <dd>{data.email}</dd>
              <dt className="text-muted-foreground">Mobile:</dt>
              <dd>{data.mobile_isd} {data.mobile_number}</dd>
              <dt className="text-muted-foreground">Address:</dt>
              <dd>{data.residential_address}</dd>
              <dt className="text-muted-foreground">City, Country:</dt>
              <dd>{data.city}, {data.country}</dd>
            </dl>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Visa Details</h3>
            <dl className="grid grid-cols-2 gap-2 text-sm">
              <dt className="text-muted-foreground">Visa Type:</dt>
              <dd className="capitalize">{data.visa_type === "other" ? data.visa_type_other : data.visa_type}</dd>
              <dt className="text-muted-foreground">Duration:</dt>
              <dd>{data.duration_of_stay}</dd>
              <dt className="text-muted-foreground">Intended Arrival:</dt>
              <dd>{data.intended_arrival_date}</dd>
            </dl>
          </div>
        </div>

        <div className="border-t pt-4">
          <div className="flex items-start space-x-2 mb-4">
            <Checkbox 
              id="declaration" 
              checked={accepted}
              onCheckedChange={(checked) => setAccepted(checked as boolean)}
            />
            <label
              htmlFor="declaration"
              className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              I declare that all information provided is accurate and complete. I understand that providing false information may result in visa rejection and legal consequences.
            </label>
          </div>

          {!accepted && (
            <p className="text-sm text-muted-foreground mb-4">
              Please accept the declaration to proceed with payment
            </p>
          )}

          {accepted && (
            <div className="space-y-4">
              <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-semibold mb-2">Payment Summary</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Complete payment to submit your visa application
                </p>
                <PayPalButton
                  visaType={data.visa_type}
                  duration={data.duration_of_stay}
                  countryCode={data.country}
                  applicationId={applicationId}
                  onSuccess={handlePaymentSuccess}
                  onError={handlePaymentError}
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-between">
          <Button type="button" variant="outline" onClick={onBack}>
            Back
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ReviewTab;
