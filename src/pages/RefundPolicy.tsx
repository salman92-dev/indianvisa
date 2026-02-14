import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Mail, Phone, MessageCircle } from "lucide-react";

const RefundPolicy = () => {
  return (
    <div className="py-12 px-4 bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <div className="container mx-auto max-w-4xl">
        <h1 className="text-4xl font-bold text-center mb-4">Refund Policy</h1>
        <p className="text-center text-muted-foreground mb-12">
          Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
        </p>

        <Card className="shadow-xl mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 text-destructive" />
              Important Notice
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-6">
              <p className="text-lg font-semibold text-foreground leading-relaxed">
                All payments made to Visa4Less are non-refundable, regardless of whether the visa is approved or rejected by the authorities.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Understanding Our Policy</h2>
              <p className="text-muted-foreground leading-relaxed">
                When you pay for our visa processing services, you are paying for the administrative work, 
                document verification, application assistance, and submission handling provided by Visa4Less. 
                This fee covers our professional services and is not dependent on the final visa decision 
                made by the Indian immigration authorities.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Why Refunds Are Not Provided</h2>
              <ul className="space-y-3 text-muted-foreground">
                <li className="flex items-start gap-3">
                  <span className="text-primary font-bold">1.</span>
                  <span>
                    <strong>Service Delivery:</strong> Our team begins processing your application immediately 
                    after payment, including document review, data verification, and preparation.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-primary font-bold">2.</span>
                  <span>
                    <strong>Third-Party Decisions:</strong> The final visa approval or rejection is made solely 
                    by the Indian immigration authorities, which is outside of our control.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-primary font-bold">3.</span>
                  <span>
                    <strong>Administrative Costs:</strong> Significant resources are allocated to each application, 
                    including staff time, verification processes, and system usage.
                  </span>
                </li>
              </ul>
            </div>

            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Exceptions</h2>
              <p className="text-muted-foreground leading-relaxed">
                In rare cases, partial refunds may be considered if:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                <li>A technical error on our part prevents application processing</li>
                <li>Duplicate payments were made by mistake</li>
                <li>The service was paid for but never initiated due to a system failure</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed">
                Such cases will be reviewed individually by our team. Please contact us within 7 days of payment 
                with relevant documentation.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Contact Us</h2>
              <p className="text-muted-foreground leading-relaxed">
                If you have questions about our refund policy or need assistance, please contact our support team:
              </p>
              <div className="grid sm:grid-cols-3 gap-4 mt-4">
                <a 
                  href="mailto:cs@visa4less.com"
                  className="flex items-center gap-2 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <Mail className="h-5 w-5 text-primary" />
                  <span className="text-sm">cs@visa4less.com</span>
                </a>
                <a 
                  href="tel:+971527288475"
                  className="flex items-center gap-2 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <Phone className="h-5 w-5 text-primary" />
                  <span className="text-sm">+971 52 728 8475</span>
                </a>
                <a 
                  href="https://wa.me/971527288475"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <MessageCircle className="h-5 w-5 text-primary" />
                  <span className="text-sm">WhatsApp</span>
                </a>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="text-center text-sm text-muted-foreground">
          <p>
            By making a payment on our platform, you acknowledge that you have read and agree to this Refund Policy.
          </p>
        </div>
      </div>
    </div>
  );
};

export default RefundPolicy;
