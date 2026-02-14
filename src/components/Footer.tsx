import { Link } from "react-router-dom";
import { Phone, Mail, MapPin, MessageCircle } from "lucide-react";
import { memo } from "react";
import NewsletterForm from "@/components/NewsletterForm";
import TrustBadges from "@/components/TrustBadges";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const Footer = memo(() => {
  return (
    <footer className="bg-muted/50">
      {/* Trust Badges Bar */}
      <TrustBadges variant="footer" />
      <div className="container mx-auto px-4 py-12">
        
        {/* MOBILE VIEW: Accordion sections */}
        <div className="md:hidden space-y-4">
          {/* Company Info - Always visible on mobile */}
          <div className="space-y-3 pb-4 border-b border-border/50">
            <div>
              <h3 className="text-xl font-bold text-primary">Visa4Less</h3>
              <p className="text-xs text-muted-foreground mt-1">A subsidiary of Fly4Less® LLC OPC</p>
            </div>
            <p className="text-sm text-muted-foreground">
              Professional Indian visa application assistance for international travelers.
            </p>
          </div>

          <Accordion type="single" collapsible className="w-full">
            {/* Quick Links Accordion */}
            <AccordionItem value="quick-links" className="border-b border-border/50">
              <AccordionTrigger className="text-sm font-semibold py-3 hover:no-underline">
                Quick Links
              </AccordionTrigger>
              <AccordionContent>
                <ul className="space-y-2 text-sm pb-2">
                  <li>
                    <Link to="/services" className="text-muted-foreground hover:text-primary transition-colors">
                      Services
                    </Link>
                  </li>
                  <li>
                    <Link to="/pricing" className="text-muted-foreground hover:text-primary transition-colors">
                      Pricing
                    </Link>
                  </li>
                  <li>
                    <Link to="/book-visa" className="text-muted-foreground hover:text-primary transition-colors">
                      Apply Now
                    </Link>
                  </li>
                  <li>
                    <Link to="/contact" className="text-muted-foreground hover:text-primary transition-colors">
                      Contact Us
                    </Link>
                  </li>
                  <li>
                    <Link to="/login" className="text-muted-foreground hover:text-primary transition-colors">
                      Login
                    </Link>
                  </li>
                </ul>
              </AccordionContent>
            </AccordionItem>

            {/* Legal Accordion */}
            <AccordionItem value="legal" className="border-b border-border/50">
              <AccordionTrigger className="text-sm font-semibold py-3 hover:no-underline">
                Legal
              </AccordionTrigger>
              <AccordionContent>
                <ul className="space-y-2 text-sm pb-2">
                  <li>
                    <Link to="/privacy" className="text-muted-foreground hover:text-primary transition-colors">
                      Privacy Policy
                    </Link>
                  </li>
                  <li>
                    <Link to="/terms" className="text-muted-foreground hover:text-primary transition-colors">
                      Terms & Conditions
                    </Link>
                  </li>
                  <li>
                    <Link to="/refund" className="text-muted-foreground hover:text-primary transition-colors">
                      Refund Policy
                    </Link>
                  </li>
                </ul>
              </AccordionContent>
            </AccordionItem>

            {/* Contact Accordion */}
            <AccordionItem value="contact" className="border-b border-border/50">
              <AccordionTrigger className="text-sm font-semibold py-3 hover:no-underline">
                Contact Us
              </AccordionTrigger>
              <AccordionContent>
                <ul className="space-y-3 text-sm text-muted-foreground pb-2">
                  <li className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 mt-1 flex-shrink-0 text-primary" />
                    <span>Al Irshad St., Al Hisn,<br />Abu Dhabi, UAE</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Phone className="h-4 w-4 flex-shrink-0 text-primary" />
                    <a href="tel:+971527288475" className="hover:text-primary transition-colors">
                      +971 52 728 8475
                    </a>
                  </li>
                  <li className="flex items-center gap-2">
                    <MessageCircle className="h-4 w-4 flex-shrink-0 text-primary" />
                    <a 
                      href="https://wa.me/971527288475" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="hover:text-primary transition-colors"
                    >
                      WhatsApp Support
                    </a>
                  </li>
                  <li className="flex items-center gap-2">
                    <Mail className="h-4 w-4 flex-shrink-0 text-primary" />
                    <a href="mailto:cs@visa4less.com" className="hover:text-primary transition-colors">
                      cs@visa4less.com
                    </a>
                  </li>
                </ul>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          {/* Newsletter - Always visible on mobile */}
          <div className="pt-4">
            <NewsletterForm />
          </div>
        </div>

        {/* DESKTOP/TABLET VIEW: Original grid layout */}
        <div className="hidden md:grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <div>
              <h3 className="text-xl font-bold text-primary">Visa4Less</h3>
              <p className="text-xs text-muted-foreground mt-1">A subsidiary of Fly4Less® LLC OPC</p>
            </div>
            <p className="text-sm text-muted-foreground">
              Professional Indian visa application assistance for international travelers. 
              Fast, secure, and reliable service.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="font-semibold">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/services" className="text-muted-foreground hover:text-primary transition-colors">
                  Services
                </Link>
              </li>
              <li>
                <Link to="/pricing" className="text-muted-foreground hover:text-primary transition-colors">
                  Pricing
                </Link>
              </li>
              <li>
                <Link to="/book-visa" className="text-muted-foreground hover:text-primary transition-colors">
                  Apply Now
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-muted-foreground hover:text-primary transition-colors">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link to="/login" className="text-muted-foreground hover:text-primary transition-colors">
                  Login
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div className="space-y-4">
            <h4 className="font-semibold">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/privacy" className="text-muted-foreground hover:text-primary transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-muted-foreground hover:text-primary transition-colors">
                  Terms & Conditions
                </Link>
              </li>
              <li>
                <Link to="/refund" className="text-muted-foreground hover:text-primary transition-colors">
                  Refund Policy
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-muted-foreground hover:text-primary transition-colors">
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h4 className="font-semibold">Contact Us</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <MapPin className="h-4 w-4 mt-1 flex-shrink-0 text-primary" />
                <span>Al Irshad St., Al Hisn,<br />Abu Dhabi, UAE</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 flex-shrink-0 text-primary" />
                <a href="tel:+971527288475" className="hover:text-primary transition-colors">
                  +971 52 728 8475
                </a>
              </li>
              <li className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4 flex-shrink-0 text-primary" />
                <a 
                  href="https://wa.me/971527288475" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-primary transition-colors"
                >
                  WhatsApp Support
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 flex-shrink-0 text-primary" />
                <a href="mailto:cs@visa4less.com" className="hover:text-primary transition-colors">
                  cs@visa4less.com
                </a>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <NewsletterForm />
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-border">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
            <div className="text-center md:text-left">
              <p className="font-medium">Visa4Less – A subsidiary of Fly4Less® LLC OPC</p>
              <p className="text-xs mt-1">UAE Office: Al Irshad St., Al Hisn, Abu Dhabi, UAE</p>
            </div>
            <p className="text-xs">© {new Date().getFullYear()} Fly4Less® LLC OPC. All rights reserved.</p>
          </div>
          <p className="text-xs text-muted-foreground text-center mt-4">
            Fly4Less® is a registered trademark in the UAE and India. Unauthorized use is strictly prohibited.
          </p>
        </div>
      </div>
    </footer>
  );
});

Footer.displayName = "Footer";

export default Footer;
