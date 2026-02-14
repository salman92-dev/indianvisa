import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import GuaranteeBox from "@/components/booking/GuaranteeBox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check, Loader2, Save } from "lucide-react";
import SaveIndicator from "@/components/SaveIndicator";
import PayPalButton from "@/components/PayPalButton";
import { getRegionPricing, mapToISOCountryCode, getCurrencyByCountry, VisaDuration, VISA_TYPE_OPTIONS } from "@/lib/currencyUtils";
import { PhoneCountrySelect } from "@/components/PhoneCountrySelect";
import NationalitySelector from "@/components/booking/NationalitySelector";
import ApplicantCounter from "@/components/booking/ApplicantCounter";
import TravelerForm, { TravelerData } from "@/components/booking/TravelerForm";
import VisaTypeSelector from "@/components/booking/VisaTypeSelector";
import { ALL_COUNTRIES } from "@/lib/countryData";

const VISA_FEATURES = [
  "Processing within 2–3 business days",
  "Priority document verification",
  "Priority email & phone support",
  "Dedicated assistance",
  "WhatsApp notifications",
  "Pre-Arrival registration (for smoother immigration)"
];

const createEmptyTraveler = (id: string, nationality: string): TravelerData => ({
  id,
  full_name: '',
  passport_number: '',
  date_of_birth: '',
  dob_day: '',
  dob_month: '',
  dob_year: '',
  gender: '',
  nationality: nationality,
  email: '',
  phone: '',
});

const BookVisa = () => {
  const { user, session, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  
  const [nationality, setNationality] = useState<string>('');
  const [visaDuration, setVisaDuration] = useState<VisaDuration>('30_days');
  const [applicantCount, setApplicantCount] = useState(1);
  const [travelers, setTravelers] = useState<TravelerData[]>([]);
  const [expandedTraveler, setExpandedTraveler] = useState(0);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const autoSaveRef = useRef<NodeJS.Timeout | null>(null);
  
  // Contact info for the main user
  const [mainEmail, setMainEmail] = useState('');
  const [mainPhone, setMainPhone] = useState('');
  const [mainPhoneIsd, setMainPhoneIsd] = useState('+971');

  // Initialize travelers when count changes
  useEffect(() => {
    setTravelers(prev => {
      const newTravelers = [...prev];
      
      // Add new travelers if count increased
      while (newTravelers.length < applicantCount) {
        const id = crypto.randomUUID();
        newTravelers.push(createEmptyTraveler(id, nationality));
      }
      
      // Remove travelers if count decreased
      while (newTravelers.length > applicantCount) {
        newTravelers.pop();
      }
      
      return newTravelers;
    });
  }, [applicantCount, nationality]);

  // Update nationality for all travelers when main nationality changes
  useEffect(() => {
    if (nationality) {
      setTravelers(prev => prev.map(t => ({
        ...t,
        nationality: t.nationality || nationality
      })));
      
      // Update phone ISD based on nationality
      const country = ALL_COUNTRIES.find(c => c.code === nationality);
      if (country) {
        setMainPhoneIsd(country.isd);
      }
    }
  }, [nationality]);

  // Pre-fill email from user
  useEffect(() => {
    if (user?.email && !mainEmail) {
      setMainEmail(user.email);
    }
  }, [user?.email, mainEmail]);

  // Instant auto-save on any data change (debounced to batch rapid changes)
  useEffect(() => {
    if (!nationality || !user) return;
    
    // Clear any pending save
    if (autoSaveRef.current) {
      clearTimeout(autoSaveRef.current);
    }
    
    // Save after 300ms debounce to batch rapid changes
    autoSaveRef.current = setTimeout(() => {
      saveProgress(true);
    }, 300);

    return () => {
      if (autoSaveRef.current) {
        clearTimeout(autoSaveRef.current);
      }
    };
  }, [nationality, travelers, mainEmail, mainPhone, mainPhoneIsd, visaDuration, user]);

  // Save on visibility change (when user switches browser tabs)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && nationality && user) {
        // Immediately save when user leaves the tab
        saveProgress(true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [nationality, user]);

  const saveProgress = async (silent = false) => {
    if (!user || !nationality) return;
    
    setSaving(true);
    try {
      // Store only non-sensitive draft data in sessionStorage (clears on tab close)
      // Avoid storing passport numbers and full DOBs for security
      const draftData = {
        user_id: user.id,
        nationality,
        visa_duration: visaDuration,
        main_email: mainEmail,
        main_phone_isd: mainPhoneIsd,
        // Don't store phone number in session storage
        travelers: travelers.map(t => ({
          full_name: t.full_name,
          // Don't store passport numbers in session storage for security
          dob_day: t.dob_day,
          dob_month: t.dob_month,
          dob_year: t.dob_year,
          gender: t.gender,
          nationality: t.nationality,
          email: t.email,
        })),
        updated_at: new Date().toISOString(),
      };

      // Use sessionStorage instead of localStorage - data is cleared when tab closes
      sessionStorage.setItem(`booking_draft_${user.id}`, JSON.stringify(draftData));
      setLastSaved(new Date());
      
      if (!silent) {
        toast.success("Progress saved!");
      }
    } catch (error) {
      console.error("Error saving draft:", error);
      if (!silent) {
        toast.error("Failed to save progress");
      }
    } finally {
      setSaving(false);
    }
  };

  // Load saved draft on mount (from sessionStorage)
  useEffect(() => {
    if (!user) return;
    
    // Also clean up any old localStorage drafts for security
    const oldDraft = localStorage.getItem(`booking_draft_${user.id}`);
    if (oldDraft) {
      localStorage.removeItem(`booking_draft_${user.id}`);
    }
    
    const savedDraft = sessionStorage.getItem(`booking_draft_${user.id}`);
    if (savedDraft) {
      try {
        const draft = JSON.parse(savedDraft);
        if (draft.nationality) setNationality(draft.nationality);
        if (draft.visa_duration) setVisaDuration(draft.visa_duration);
        if (draft.main_email) setMainEmail(draft.main_email);
        if (draft.main_phone_isd) setMainPhoneIsd(draft.main_phone_isd);
        if (draft.travelers && draft.travelers.length > 0) {
          setApplicantCount(draft.travelers.length);
          setTravelers(draft.travelers.map((t: any, i: number) => ({
            ...t,
            id: crypto.randomUUID(),
            // These fields need to be re-entered for security
            passport_number: '',
            phone: '',
          })));
        }
        // Draft loaded successfully - no toast needed
      } catch (e) {
        console.error("Error loading draft:", e);
      }
    }
  }, [user]);

  const pricing = nationality ? getRegionPricing(nationality, visaDuration) : null;
  const totalPrice = pricing ? pricing.price * applicantCount : 0;
  const currencySymbol = pricing?.currency === 'GBP' ? '£' : pricing?.currency === 'EUR' ? '€' : '$';
  const selectedVisaType = VISA_TYPE_OPTIONS.find(v => v.id === visaDuration);

  const updateTraveler = useCallback((index: number, data: TravelerData) => {
    setTravelers(prev => {
      const updated = [...prev];
      updated[index] = data;
      return updated;
    });
  }, []);

  const deleteTraveler = useCallback((index: number) => {
    if (index === 0) return; // Can't delete first traveler
    setTravelers(prev => prev.filter((_, i) => i !== index));
    setApplicantCount(prev => prev - 1);
  }, []);

  const validateAllTravelers = () => {
    if (!nationality) {
      toast.error("Please select your nationality");
      return false;
    }
    
    if (!mainEmail.trim()) {
      toast.error("Please enter your email address");
      return false;
    }
    
    if (!mainPhone.trim() || mainPhone.length < 7) {
      toast.error("Please enter a valid phone number");
      return false;
    }

    for (let i = 0; i < travelers.length; i++) {
      const t = travelers[i];
      if (!t.full_name.trim()) {
        toast.error(`Please enter full name for Traveler ${i + 1}`);
        setExpandedTraveler(i);
        return false;
      }
      if (!t.passport_number.trim()) {
        toast.error(`Please enter passport number for Traveler ${i + 1}`);
        setExpandedTraveler(i);
        return false;
      }
      if (!t.dob_day || !t.dob_month || !t.dob_year) {
        toast.error(`Please enter date of birth for Traveler ${i + 1}`);
        setExpandedTraveler(i);
        return false;
      }
      if (!t.gender) {
        toast.error(`Please select gender for Traveler ${i + 1}`);
        setExpandedTraveler(i);
        return false;
      }
      if (!t.nationality) {
        toast.error(`Please select nationality for Traveler ${i + 1}`);
        setExpandedTraveler(i);
        return false;
      }
    }
    
    return true;
  };

  const createBookingWithTravelers = async () => {
    if (!validateAllTravelers() || !user || !pricing) return null;

    setCreating(true);
    try {
      // Create booking record
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .insert({
          user_id: user.id,
          total_travelers: applicantCount,
          total_amount_paid: totalPrice,
          currency: pricing.currency,
          payment_status: 'pending',
          visa_type: visaDuration,
          price_per_traveler: pricing.price,
        })
        .select('id')
        .maybeSingle();

      if (bookingError) throw bookingError;
      if (!booking?.id) {
        throw new Error('Booking could not be created. Please try again.');
      }

      // Create traveler records
      const travelerInserts = travelers.map((t) => {
        const dateOfBirth =
          t.date_of_birth ||
          (t.dob_year && t.dob_month && t.dob_day
            ? `${t.dob_year}-${t.dob_month}-${t.dob_day}`
            : '');

        if (!dateOfBirth) {
          throw new Error('Please enter a valid date of birth for all travelers.');
        }

        return {
          booking_id: booking.id,
          full_name: t.full_name,
          passport_number: t.passport_number,
          nationality: t.nationality || nationality,
          date_of_birth: dateOfBirth,
          gender: t.gender,
          email: t.email || mainEmail,
          phone: t.phone || `${mainPhoneIsd}${mainPhone}`,
          application_status: 'pending',
        };
      });

      const { error: travelersError } = await supabase
        .from('travelers')
        .insert(travelerInserts);

      if (travelersError) throw travelersError;

      setBookingId(booking.id);
      return booking.id;
    } catch (error: any) {
      console.error("Error creating booking:", error);
      const msg =
        error?.message ||
        error?.error_description ||
        error?.details ||
        "Failed to create booking. Please try again.";
      toast.error(msg);
      return null;
    } finally {
      setCreating(false);
    }
  };

  const handlePaymentSuccess = useCallback(
    (payload: any) => {
      const orderId = payload?.orderId ?? payload;
      // Navigate to payment status page for polling
      navigate(
        `/payment-status?orderId=${encodeURIComponent(String(orderId))}&bookingId=${bookingId}`
      );
    },
    [navigate, bookingId]
  );

  const handlePaymentError = useCallback((err: any) => {
    console.error("Payment error:", err);
    const msg = err?.message || err?.error_description || "Payment failed. Please try again.";
    toast.error(msg);
  }, []);

  const allTravelersComplete = travelers.every(t => 
    t.full_name.trim() && 
    t.passport_number.trim() && 
    t.dob_day && t.dob_month && t.dob_year && 
    t.gender && 
    t.nationality
  );

  const canProceed = nationality && mainEmail.trim() && mainPhone.trim() && allTravelersComplete;

  if (!session) {
    return (
      <div className="py-12">
        <div className="container max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-3xl font-bold mb-4">Book Your Indian Visa</h1>
          <p className="text-muted-foreground mb-8">Please login or register to continue with your visa application.</p>
          <div className="flex gap-4 justify-center">
            <Button onClick={() => navigate("/login")}>Login</Button>
            <Button variant="outline" onClick={() => navigate("/register")}>Register</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8 pb-32">
      <div className="container max-w-4xl mx-auto px-4">
          {/* Hero Section */}
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-3">
              Book Your <span className="text-primary">Indian Visa</span>
            </h1>
            <div className="flex items-center justify-center gap-3">
              <p className="text-muted-foreground">
                Choose your visa type and complete your application
              </p>
              {nationality && <SaveIndicator saving={saving} lastSaved={lastSaved} />}
            </div>
          </div>

          {/* Step 1: Nationality & Visa Type */}
          <Card className="mb-6">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">1</div>
                <div>
                  <CardTitle className="text-lg">Select Nationality & Visa Type</CardTitle>
                  <CardDescription>Pricing is determined by your nationality</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <NationalitySelector value={nationality} onChange={setNationality} />
              
              {nationality && (
                <>
                  {/* Visa Type Selection Cards */}
                  <VisaTypeSelector 
                    value={visaDuration} 
                    onChange={setVisaDuration} 
                    nationality={nationality} 
                  />
                  
                  {/* Selected Visa Features */}
                  <div className="p-4 bg-muted/50 rounded-lg border">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{selectedVisaType?.name}</span>
                      <span className="text-lg font-bold text-primary">
                        {currencySymbol}{pricing?.price.toFixed(2)} <span className="text-sm font-normal text-muted-foreground">per person</span>
                      </span>
                    </div>
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-1 mt-3">
                      {VISA_FEATURES.slice(0, 4).map((feature, idx) => (
                        <li key={idx} className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Check className="h-3 w-3 text-primary flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <ApplicantCounter count={applicantCount} onChange={setApplicantCount} />
                </>
              )}
            </CardContent>
          </Card>

          {/* Step 2: Contact Info */}
          {nationality && (
            <Card className="mb-6">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">2</div>
                  <div>
                    <CardTitle className="text-lg">Your Contact Information</CardTitle>
                    <CardDescription>We'll send updates to this contact</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="main-email">Email Address *</Label>
                  <Input
                    id="main-email"
                    type="email"
                    value={mainEmail}
                    onChange={(e) => setMainEmail(e.target.value)}
                    placeholder="your@email.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Phone Number *</Label>
                  <div className="flex gap-2">
                    <PhoneCountrySelect
                      value={mainPhoneIsd}
                      onChange={setMainPhoneIsd}
                    />
                    <Input
                      type="tel"
                      value={mainPhone}
                      onChange={(e) => setMainPhone(e.target.value.replace(/[^0-9]/g, ''))}
                      placeholder="Phone number"
                      maxLength={15}
                      className="flex-1"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Traveler Details */}
          {nationality && (
            <Card className="mb-6">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">3</div>
                  <div>
                    <CardTitle className="text-lg">Traveler Details</CardTitle>
                    <CardDescription>Enter passport details for each traveler</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {travelers.map((traveler, index) => (
                  <TravelerForm
                    key={traveler.id}
                    index={index}
                    traveler={traveler}
                    defaultNationality={nationality}
                    defaultEmail={mainEmail}
                    defaultPhone={`${mainPhoneIsd}${mainPhone}`}
                    isExpanded={expandedTraveler === index}
                    canDelete={index > 0}
                    onToggle={() => setExpandedTraveler(expandedTraveler === index ? -1 : index)}
                    onUpdate={(data) => updateTraveler(index, data)}
                    onDelete={() => deleteTraveler(index)}
                  />
                ))}
              </CardContent>
            </Card>
          )}

          {/* Save Progress & Guarantee Box */}
          {nationality && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <GuaranteeBox />
              
              <Card className="h-fit">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-semibold">Save Your Progress</h3>
                      <p className="text-sm text-muted-foreground">
                        {lastSaved 
                          ? `Last saved: ${lastSaved.toLocaleTimeString()}`
                          : "Auto-saves every 20 seconds"
                        }
                      </p>
                    </div>
                    <Button 
                      variant="outline" 
                      onClick={() => saveProgress(false)}
                      disabled={saving}
                    >
                      {saving ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Save className="h-4 w-4 mr-2" />
                      )}
                      Save Progress
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Your data is saved locally. You can close this page and resume later.
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

      {/* Fixed Bottom Payment Bar */}
      {nationality && pricing && (
        <div className="fixed bottom-0 left-0 right-0 bg-card border-t shadow-lg z-50">
          <div className="container max-w-4xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs text-muted-foreground">{selectedVisaType?.name}</p>
                <p className="text-sm text-muted-foreground">Total for {applicantCount} traveler{applicantCount > 1 ? 's' : ''}</p>
                <p className="text-2xl font-bold text-primary">
                  {pricing.currency} {totalPrice.toFixed(2)}
                </p>
              </div>
              
              <div className="flex-1 max-w-xs">
                {creating ? (
                  <Button disabled className="w-full h-12">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Preparing...
                  </Button>
                ) : bookingId ? (
                   <PayPalButton
                     visaType="tourist"
                     duration={visaDuration}
                     countryCode={mapToISOCountryCode(nationality)}
                     applicationId={bookingId}
                     currency={pricing.currency}
                     onSuccess={handlePaymentSuccess}
                     onError={handlePaymentError}
                   />
                ) : (
                  <Button 
                    className="w-full h-12 text-base"
                    onClick={createBookingWithTravelers}
                    disabled={!canProceed}
                  >
                    Continue to Payment for {applicantCount} Traveler{applicantCount > 1 ? 's' : ''}
                  </Button>
                )}
              </div>
            </div>
            
            {/* Secure payments note */}
            <div className="flex items-center justify-between mt-3 pt-3 border-t">
              <p className="text-xs text-muted-foreground">
                By proceeding, you agree to our{" "}
                <Link to="/refund" className="text-primary hover:underline">Refund Policy</Link>
              </p>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Secure payments via</span>
                <img src="/paypal-logo.png" alt="PayPal" className="h-4" />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookVisa;
