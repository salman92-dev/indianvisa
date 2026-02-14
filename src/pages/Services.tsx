import { Helmet } from "react-helmet-async";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plane, FileCheck, Clock, Shield, Users, MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";
import indiaGateImage from "@/assets/india-gate.jpg";

const Services = () => {
  const services = [
    {
      icon: Plane,
      title: "30-Day Indian Tourist Visa",
      description: "Complete e-Visa processing for tourism, sightseeing, and casual business visits to India with expert guidance from our team.",
    },
    {
      icon: FileCheck,
      title: "Document Verification for Indian Visa",
      description: "Thorough document checking and verification to ensure your Indian visa application meets all requirements before submission.",
    },
    {
      icon: Clock,
      title: "Fast 2-3 Day Indian Visa Processing",
      description: "Quick turnaround with Indian visa processing completed within 2-3 business days for your peace of mind.",
    },
    {
      icon: Shield,
      title: "Secure Visa Application Processing",
      description: "Your documents and personal information are handled with the highest level of security and confidentiality.",
    },
    {
      icon: Users,
      title: "Dedicated Visa Application Support",
      description: "Personal assistance from our expert team throughout your Indian visa application process via email, phone, and WhatsApp.",
    },
    {
      icon: MessageCircle,
      title: "Real-time Visa Status Updates",
      description: "Stay informed with WhatsApp notifications and email updates on your Indian visa application status.",
    },
  ];

  return (
    <>
      <Helmet>
        <title>Indian Visa Services | Apply for India Tourist Visa Online - Visa4Less</title>
        <meta name="description" content="Professional Indian visa application services for US, UK & EU citizens. Fast 2-3 day processing, document verification, and dedicated support. Apply online today." />
        <meta name="keywords" content="Indian visa services, apply Indian visa online, India tourist visa application, Indian e-visa service, fast Indian visa processing" />
        <link rel="canonical" href="https://www.visa4less.com/services" />
        <meta property="og:title" content="Indian Visa Services | Apply for India Visa Online - Visa4Less" />
        <meta property="og:description" content="Professional Indian visa application services. Fast 2-3 day processing for US, UK & EU citizens." />
        <meta property="og:url" content="https://www.visa4less.com/services" />
      </Helmet>
      
      {/* Hero Section with Indian Background */}
      <section className="relative py-20 overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${indiaGateImage})` }}
          role="img"
          aria-label="India Gate monument, a famous landmark in New Delhi, India"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/95 via-background/90 to-background" />
        
        <div className="container mx-auto px-4 relative z-10">
          <header className="text-center max-w-3xl mx-auto mb-16">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Indian Visa Application Services
            </h1>
            <p className="text-lg text-muted-foreground">
              Professional Indian visa services tailored to your travel needs. We make the India visa application process simple, fast, and stress-free for international travelers.
            </p>
          </header>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {services.map((service, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow bg-card/95 backdrop-blur-sm border-2 hover:border-primary/50">
                <CardHeader>
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <service.icon className="w-6 h-6 text-primary" aria-hidden="true" />
                  </div>
                  <CardTitle>{service.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    {service.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            Ready to Apply for Your Indian Visa?
          </h2>
          <p className="text-lg opacity-90 mb-6 max-w-2xl mx-auto">
            Start your Indian tourist visa application today and travel to India with confidence.
          </p>
          <Button size="lg" variant="secondary" asChild>
            <Link to="/book-visa">Start Indian Visa Application</Link>
          </Button>
        </div>
      </section>

      {/* Company Info Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold mb-4">About Visa4Less</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto mb-4">
            Visa4Less is a professional visa processing service dedicated to helping international travelers obtain their Indian visas quickly and efficiently. Trusted by travelers from the United States, United Kingdom, European Union, and worldwide.
          </p>
          <p className="text-sm text-muted-foreground">
            A subsidiary of Fly4Less® LLC OPC
          </p>
        </div>
      </section>
    </>
  );
};

export default Services;
