import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import {
  CheckCircle2,
  Clock,
  Shield,
  Globe,
  MessageCircle,
  FileCheck,
  Users,
  Quote,
  BadgeCheck,
} from "lucide-react";
import tajMahalImage from "@/assets/taj-mahal-hero.jpg";
import gatewayOfIndiaImage from "@/assets/gateway-of-india.jpg";
import StarRating from "@/components/StarRating";
import { supabase } from "@/integrations/supabase/client";

const Home = () => {
  // Lightweight database call to keep Supabase active (prevents free-tier auto-pause)
  useEffect(() => {
    const keepAlive = async () => {
      try {
        // Use a real database query to guarantee a network request to Supabase
        await supabase.from('countries').select('id').limit(1);
      } catch {
        // Silent catch - this is just a keep-alive call
      }
    };
    keepAlive();
  }, []);
  const whyChooseUs = [
    {
      icon: Globe,
      title: "No Embassy Visits Required",
      description: "Complete your entire Indian visa application online from anywhere in the world",
    },
    {
      icon: Clock,
      title: "Fast Indian Visa Processing",
      description: "Get your Indian tourist visa processed within 2-3 business days",
    },
    {
      icon: MessageCircle,
      title: "Live WhatsApp & Email Support",
      description: "Real-time assistance for your India visa application whenever you need it",
    },
    {
      icon: Users,
      title: "Trusted by International Travelers",
      description: "Thousands of successful Indian visa applications processed",
    },
    {
      icon: FileCheck,
      title: "Simple & Guided Process",
      description: "Step-by-step Indian visa application with expert guidance",
    },
  ];


  const testimonials = [
    {
      name: "Mark R.",
      location: "USA",
      rating: 5,
      text: "Visa4Less made the Indian visa process incredibly easy. I finished my application in less than 15 minutes and everything was handled smoothly.",
      verified: true,
    },
    {
      name: "Emma T.",
      location: "UK",
      rating: 5,
      text: "Very professional Indian visa service. The team was responsive on WhatsApp and my visa was approved faster than expected. Highly recommend!",
      verified: true,
    },
    {
      name: "Lucas M.",
      location: "Germany",
      rating: 5,
      text: "Simple, straightforward, and reliable Indian visa service. No hidden fees, no confusion. Exactly what I needed for my India trip.",
      verified: true,
    },
    {
      name: "Sarah K.",
      location: "Canada",
      rating: 5,
      text: "Applied for the whole family - 4 visas processed seamlessly. The multi-traveler booking was super convenient. Will definitely use again!",
      verified: true,
    },
    {
      name: "James W.",
      location: "Australia",
      rating: 5,
      text: "Needed my visa urgently for a business trip. The team delivered within 48 hours. Exceptional service and support throughout.",
      verified: true,
    },
    {
      name: "Sophie L.",
      location: "France",
      rating: 5,
      text: "First time applying for an Indian visa online. The step-by-step guide made it foolproof. My visa was approved without any issues!",
      verified: true,
    },
  ];

  const pricing = [
    { region: "United States", price: "$49.90", currency: "USD" },
    { region: "United Kingdom", price: "£39.90", currency: "GBP" },
    { region: "European Union", price: "€39.90", currency: "EUR" },
    { region: "Rest of World", price: "$49.90", currency: "USD" },
  ];

  return (
    <>
      <Helmet>
        <meta name="google-site-verification" content="K6Xj4SYg0WjunaaK_AKDgdSsmI_dT4tIiRTrGzql0wc" />
        <title>Indian Visa for Foreigners | Apply for Indian Tourist Visa Online - Visa4Less</title>
        <meta name="description" content="Apply for Indian visa online in minutes. Fast Indian visa service for US, UK & EU citizens. Get your Indian tourist visa with guaranteed support. 2-3 day processing." />
        <meta name="keywords" content="Indian visa for foreigners, apply Indian visa online, Indian tourist visa application, fast Indian visa service, India visa for US citizens, India visa for UK citizens, India visa for EU citizens" />
        <link rel="canonical" href="https://www.visa4less.com/" />
      </Helmet>

      {/* Hero Section with Taj Mahal Background */}
      <section className="relative overflow-hidden min-h-[90vh] flex items-center" aria-labelledby="hero-heading">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${tajMahalImage})` }}
          role="img"
          aria-label="Taj Mahal in Agra, India - iconic UNESCO World Heritage Site"
        />
        {/* Warm subtle overlay - matches reference */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/80 via-white/60 to-white/40" />
        <div className="absolute inset-0 bg-gradient-to-r from-white/90 via-white/50 to-transparent" />
        
        <div className="container mx-auto px-4 py-16 md:py-24 relative z-10">
          <header className="max-w-2xl">
            <div className="inline-block mb-6">
              <span className="inline-flex items-center rounded-full bg-primary/10 px-5 py-2 text-sm font-medium text-primary border border-primary/20">
                Trusted Visa Service Provider
              </span>
            </div>
            <h1 id="hero-heading" className="text-4xl sm:text-5xl md:text-6xl font-bold leading-tight mb-6 text-foreground">
              Your Gateway to<br />
              <span className="text-primary">Incredible India</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-lg mb-8">
              Professional assistance for international travelers seeking Indian visas. Fast, secure, and hassle-free application process.
            </p>
            <div className="flex flex-row items-center gap-4">
              <Button
                size="lg"
                asChild
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-6 shadow-md font-semibold"
              >
                <Link to="/book-visa">Apply for Visa</Link>
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                asChild 
                className="px-8 py-6 bg-white border border-border font-medium"
              >
                <Link to="/contact">Contact Us</Link>
              </Button>
            </div>
          </header>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="py-16 md:py-24 bg-background" aria-labelledby="why-choose-heading">
        <div className="container mx-auto px-4">
          <header className="text-center mb-12 md:mb-16">
            <h2 id="why-choose-heading" className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4">
              Why Choose Visa4Less for Your Indian Visa?
            </h2>
            <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
              We make your Indian tourist visa application process smooth, secure, and successful
            </p>
          </header>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            {whyChooseUs.map((item, index) => (
              <Card
                key={index}
                className="border hover:border-primary/50 transition-all hover:shadow-lg group"
              >
                <CardContent className="pt-6 pb-6">
                  <div className="flex flex-col items-center text-center space-y-3">
                    <div className="p-3 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
                      <item.icon className="h-6 w-6 text-primary" aria-hidden="true" />
                    </div>
                    <h3 className="text-base font-semibold leading-tight">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 md:py-24 bg-muted/30" aria-labelledby="testimonials-heading">
        <div className="container mx-auto px-4">
          <header className="text-center mb-12 md:mb-16">
            <h2 id="testimonials-heading" className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4">
              What Our Customers Say About Indian Visa Service
            </h2>
            <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
              Join thousands of satisfied travelers who trusted Visa4Less for their Indian visa
            </p>
          </header>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="bg-card border hover:shadow-lg transition-all">
                <CardContent className="pt-6 pb-6">
                  <div className="flex items-center justify-between mb-4">
                    <StarRating rating={testimonial.rating} size="sm" />
                    {testimonial.verified && (
                      <span className="flex items-center gap-1 text-xs text-green-600">
                        <BadgeCheck className="h-3 w-3" />
                        Verified
                      </span>
                    )}
                  </div>
                  <blockquote className="text-muted-foreground mb-6 text-sm md:text-base leading-relaxed">
                    "{testimonial.text}"
                  </blockquote>
                  <footer className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-primary font-semibold text-sm">
                        {testimonial.name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <cite className="font-semibold text-sm not-italic">{testimonial.name}</cite>
                      <p className="text-xs text-muted-foreground">{testimonial.location}</p>
                    </div>
                  </footer>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section with Gateway of India Background */}
      <section className="py-16 md:py-24 relative overflow-hidden" aria-labelledby="pricing-heading">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${gatewayOfIndiaImage})` }}
          role="img"
          aria-label="Gateway of India monument in Mumbai, India"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/95 via-background/90 to-background/95" />
        
        <div className="container mx-auto px-4 relative z-10">
          <header className="text-center mb-12 md:mb-16">
            <h2 id="pricing-heading" className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4">
              Transparent Indian Visa Pricing
            </h2>
            <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
              Simple, straightforward Indian visa pricing based on your location
            </p>
          </header>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 max-w-5xl mx-auto">
            {pricing.map((item, index) => (
              <Card
                key={index}
                className="relative overflow-hidden hover:shadow-xl transition-all border hover:border-primary/50 bg-card/95 backdrop-blur-sm"
              >
                <CardContent className="pt-6 pb-6 text-center">
                  <div className="space-y-2 md:space-y-4">
                    <h3 className="font-medium text-sm md:text-base">{item.region}</h3>
                    <div className="text-2xl md:text-4xl font-bold text-primary">
                      {item.price}
                    </div>
                    <p className="text-xs md:text-sm text-muted-foreground">{item.currency}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="text-center mt-8 md:mt-12">
            <Button size="lg" asChild className="bg-primary hover:bg-primary/90 shadow-lg">
              <Link to="/pricing">View Full Indian Visa Pricing Details</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Urgency/Reassurance Section */}
      <section className="py-16 md:py-20 bg-background" aria-labelledby="reassurance-heading">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto">
            <CheckCircle2 className="h-12 w-12 md:h-16 md:w-16 text-primary mx-auto mb-6" aria-hidden="true" />
            <h2 id="reassurance-heading" className="text-xl sm:text-2xl md:text-3xl font-bold mb-4 leading-tight">
              Don't Risk Indian Visa Delays or Rejection
            </h2>
            <p className="text-base md:text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Visa4Less ensures accurate, complete, and verified Indian visa applications every time. 
              Let our experts handle your Indian tourist visa so you can focus on planning your trip to India.
            </p>
            <Button
              size="lg"
              asChild
              className="bg-primary hover:bg-primary/90 text-primary-foreground text-base sm:text-lg px-8 sm:px-10 py-5 sm:py-7 shadow-xl hover:shadow-2xl transition-all font-semibold"
            >
              <Link to="/book-visa">Apply for Indian Visa Now</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-16 md:py-20 bg-primary text-primary-foreground" aria-labelledby="cta-heading">
        <div className="container mx-auto px-4 text-center">
          <h2 id="cta-heading" className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 md:mb-6">
            Ready to Start Your Indian Visa Application?
          </h2>
          <p className="text-base md:text-lg mb-6 md:mb-8 max-w-2xl mx-auto opacity-90">
            Join thousands of satisfied US, UK, and EU customers who have successfully obtained their
            Indian tourist visa through our fast visa service
          </p>
          <Button
            size="lg"
            variant="secondary"
            asChild
            className="text-base sm:text-lg px-8 py-5 sm:py-6 shadow-xl font-semibold"
          >
            <Link to="/book-visa">Get Started with Indian Visa Now</Link>
          </Button>
        </div>
      </section>

    </>
  );
};

export default Home;
