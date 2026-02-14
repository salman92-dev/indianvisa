import { Helmet } from "react-helmet-async";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, FileCheck, Phone, MessageCircle, Users, Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";
import indiaGateImage from "@/assets/india-gate.jpg";

const Pricing = () => {
  const navigate = useNavigate();

  const countryPricing = [
    { country: "United States", price: "49.90", currency: "USD", symbol: "$" },
    { country: "United Kingdom", price: "39.90", currency: "GBP", symbol: "£" },
    { country: "European Union", price: "39.90", currency: "EUR", symbol: "€" },
    { country: "Rest of World", price: "49.90", currency: "USD", symbol: "$" },
  ];

  const serviceFeatures = [
    {
      icon: Clock,
      title: "Processing within 2–3 business days",
      description: "Fast turnaround for your visa application"
    },
    {
      icon: FileCheck,
      title: "Priority document verification",
      description: "Expert review of all your documents"
    },
    {
      icon: Phone,
      title: "Priority email & phone support",
      description: "Direct access to our support team"
    },
    {
      icon: Users,
      title: "Dedicated assistance",
      description: "Personal guidance throughout the process"
    },
    {
      icon: MessageCircle,
      title: "WhatsApp notifications",
      description: "Real-time updates on your application status"
    },
    {
      icon: Shield,
      title: "Pre-arrival registration",
      description: "Hassle-free immigration process upon arrival"
    },
  ];

  return (
    <>
      <Helmet>
        <title>Indian Visa Pricing | Affordable Visa Fees for US, UK, EU Citizens - Visa4Less</title>
        <meta name="description" content="Transparent Indian visa pricing from $49.90 USD. Fast Indian visa service for US, UK & EU citizens. No hidden fees. Apply for Indian tourist visa online today." />
        <meta name="keywords" content="Indian visa price, India visa cost, Indian tourist visa fees, India visa for US citizens cost, UK India visa price, EU India visa fees" />
        <link rel="canonical" href="https://www.visa4less.com/pricing" />
        <meta property="og:title" content="Indian Visa Pricing | Affordable Visa Fees - Visa4Less" />
        <meta property="og:description" content="Transparent Indian visa pricing from $49.90 USD. Fast processing for US, UK & EU citizens." />
        <meta property="og:url" content="https://www.visa4less.com/pricing" />
      </Helmet>
      
      {/* Hero Section with Indian Background */}
      <section className="relative py-16 overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${indiaGateImage})` }}
          role="img"
          aria-label="India Gate landmark in New Delhi, India"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/95 via-background/90 to-background" />
        
        <div className="container mx-auto px-4 relative z-10">
          <header className="text-center max-w-3xl mx-auto mb-8">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Indian Visa Pricing – Transparent & Affordable
            </h1>
            <p className="text-lg text-muted-foreground">
              Simple, straightforward pricing for your Indian tourist visa application. No hidden fees.
            </p>
          </header>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto mb-8">
            {countryPricing.map((item, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow bg-card/95 backdrop-blur-sm">
                <CardContent className="pt-6 pb-4">
                  <h3 className="font-medium text-sm mb-3">{item.country}</h3>
                  <p className="text-2xl md:text-3xl font-bold text-primary">
                    {item.symbol}{item.price}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">{item.currency}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center">
            <Button 
              variant="default" 
              size="lg"
              onClick={() => navigate("/book-visa")}
              className="bg-primary hover:bg-primary/90"
            >
              Apply for Indian Visa Now
            </Button>
          </div>
        </div>
      </section>

      {/* What's Included Section */}
      <section className="py-20 bg-gradient-to-b from-background to-muted/30">
        <div className="container mx-auto px-4">
          <header className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              What's Included in Your Indian Visa Service
            </h2>
            <p className="text-lg text-muted-foreground">
              Everything you need for a smooth and successful Indian visa application
            </p>
          </header>

          <Card className="max-w-4xl mx-auto border-primary/20 shadow-xl">
            <CardHeader className="text-center pb-6 bg-gradient-to-r from-primary/5 to-accent/5 rounded-t-lg">
              <CardTitle className="text-2xl">Complete Indian Visa Service Package</CardTitle>
              <CardDescription className="text-base">
                30-Day Indian Tourist Visa Processing for Foreign Nationals
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-8 pb-8">
              <ul className="grid md:grid-cols-2 gap-6">
                {serviceFeatures.map((feature, index) => (
                  <li key={index} className="flex items-start gap-4 p-4 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="p-2 rounded-full bg-primary/10 flex-shrink-0">
                      <feature.icon className="h-5 w-5 text-primary" aria-hidden="true" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">{feature.title}</h3>
                      <p className="text-sm text-muted-foreground">{feature.description}</p>
                    </div>
                  </li>
                ))}
              </ul>
              
              <div className="mt-8 pt-6 border-t border-border">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-center sm:text-left">
                    <p className="text-sm text-muted-foreground mb-1">Starting from</p>
                    <p className="text-3xl font-bold text-primary">£39.90 / $49.90</p>
                    <p className="text-xs text-muted-foreground">Based on your location</p>
                  </div>
                  <Button 
                    size="lg"
                    onClick={() => navigate("/book-visa")}
                    className="bg-gradient-to-r from-primary to-primary/90 shadow-lg px-8"
                  >
                    Start Indian Visa Application
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <aside className="mt-12 text-center">
            <p className="text-muted-foreground mb-4">
              Have questions about Indian visa requirements?
            </p>
            <Button variant="link" onClick={() => navigate("/contact")}>
              Contact our visa experts for assistance
            </Button>
          </aside>
        </div>
      </section>
    </>
  );
};

export default Pricing;
