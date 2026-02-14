import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Terms = () => {
  return (
    <div className="py-12 px-4 bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <div className="container mx-auto max-w-4xl">
        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="text-3xl">Terms & Conditions</CardTitle>
            <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none space-y-6">
            <section>
              <h2 className="text-xl font-semibold mb-3">1. Acceptance of Terms</h2>
              <p className="text-muted-foreground">
                By accessing and using Visa4Less services, you accept and agree to be bound by the terms and provision of this agreement.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">2. Service Description</h2>
              <p className="text-muted-foreground">
                Visa4Less provides visa application assistance services for Indian visas. We facilitate the application process but do not guarantee visa approval, which is at the sole discretion of Indian immigration authorities.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">3. User Responsibilities</h2>
              <p className="text-muted-foreground">
                Users are responsible for providing accurate and complete information. Any false or misleading information may result in visa rejection and service termination without refund.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">4. Payment Terms</h2>
              <p className="text-muted-foreground">
                All fees must be paid in full before application processing begins. Prices are based on the applicant's country of residence and are subject to change without notice.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">5. Refund Policy</h2>
              <p className="text-muted-foreground">
                Refunds are processed according to our Refund Policy. Service fees are non-refundable once application processing has commenced.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">6. Privacy and Data Protection</h2>
              <p className="text-muted-foreground">
                We are committed to protecting your personal information. Please review our Privacy Policy for details on how we collect, use, and protect your data.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">7. Limitation of Liability</h2>
              <p className="text-muted-foreground">
                Visa4Less is not liable for visa rejections, delays in processing, or changes in immigration policies. Our service is limited to application assistance only.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">8. Contact Information</h2>
              <p className="text-muted-foreground">
                For questions about these Terms & Conditions, please contact us at cs@visa4less.com
              </p>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Terms;
