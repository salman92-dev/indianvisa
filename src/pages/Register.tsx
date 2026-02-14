import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { PhoneCountrySelect } from "@/components/PhoneCountrySelect";
import { Eye, EyeOff, Shield, Lock, CheckCircle2 } from "lucide-react";
import { validatePassword } from "@/lib/passwordValidation";
import { PasswordStrengthIndicator } from "@/components/PasswordStrengthIndicator";
import paypalLogo from "@/assets/paypal-logo.png";

// Mobile-only compact trust badges for above-the-fold
const MobileTrustBadges = () => (
  <div className="md:hidden flex items-center justify-center gap-4 py-3 bg-muted/30 rounded-lg mb-4">
    <div className="flex items-center gap-1.5">
      <img src={paypalLogo} alt="PayPal" className="h-4 w-auto" />
    </div>
    <div className="flex items-center gap-1">
      <Shield className="h-3.5 w-3.5 text-primary" strokeWidth={2} />
      <span className="text-[10px] text-muted-foreground">PCI-DSS</span>
    </div>
    <div className="flex items-center gap-1">
      <Lock className="h-3.5 w-3.5 text-primary" strokeWidth={2} />
      <span className="text-[10px] text-muted-foreground">SSL</span>
    </div>
  </div>
);

const Register = () => {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneIsd, setPhoneIsd] = useState("+1");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Field touched state for inline validation
  const [touched, setTouched] = useState({
    fullName: false,
    email: false,
    phone: false,
    password: false,
    confirmPassword: false,
  });

  const { signUp, signInWithGoogle, session } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (session) {
      navigate("/book-visa");
    }
  }, [session, navigate]);

  // Validation functions
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone: string) => {
    const phoneRegex = /^\d{7,15}$/;
    return phoneRegex.test(phone);
  };

  const passwordValidation = validatePassword(password);

  // Error messages
  const getFullNameError = () => {
    if (touched.fullName && !fullName.trim()) return "Please enter your full name";
    return "";
  };

  const getEmailError = () => {
    if (touched.email && !email) return "Please enter your email address";
    if (touched.email && !validateEmail(email)) return "Please enter a valid email address";
    return "";
  };

  const getPhoneError = () => {
    if (touched.phone && !phoneNumber) return "Please enter your phone number";
    if (touched.phone && !validatePhone(phoneNumber)) return "Phone number must be 7-15 digits";
    return "";
  };

  const getPasswordError = () => {
    if (touched.password && !password) return "Please enter a password";
    if (touched.password && !passwordValidation.isValid && passwordValidation.errors.length > 0) {
      return passwordValidation.errors[0];
    }
    return "";
  };

  const getConfirmPasswordError = () => {
    if (touched.confirmPassword && !confirmPassword) return "Please confirm your password";
    if (touched.confirmPassword && password !== confirmPassword) return "Passwords do not match";
    return "";
  };

  const handleBlur = (field: keyof typeof touched) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Mark all fields as touched
    setTouched({
      fullName: true,
      email: true,
      phone: true,
      password: true,
      confirmPassword: true,
    });

    if (!fullName.trim()) {
      toast.error("Please enter your full name");
      return;
    }

    if (!validateEmail(email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    if (!validatePhone(phoneNumber)) {
      toast.error("Please enter a valid phone number");
      return;
    }

    if (!passwordValidation.isValid) {
      toast.error(passwordValidation.errors[0] || "Please enter a stronger password");
      return;
    }

    // On desktop, validate confirm password
    if (window.innerWidth >= 768 && password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (!agreedToTerms) {
      toast.error("Please accept the Terms & Conditions");
      return;
    }

    setLoading(true);
    const fullPhone = `${phoneIsd}${phoneNumber}`;
    const { error } = await signUp(email, password, fullName, fullPhone);
    setLoading(false);

    if (error) {
      if (error.message?.includes("already registered")) {
        toast.error("This email is already registered. Please sign in instead.");
      } else {
        toast.error(error.message);
      }
    } else {
      // Send registration notification emails
      try {
        await supabase.functions.invoke('send-registration-email', {
          body: {
            fullName: fullName.trim(),
            email: email.trim(),
            phone: fullPhone,
          },
        });
      } catch (emailError) {
        console.error("Failed to send registration email:", emailError);
        // Don't block registration if email fails
      }
      
      toast.success("Registration successful! Continue your visa application below.");
      navigate("/book-visa");
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    const { error } = await signInWithGoogle();
    setLoading(false);
    
    if (error) {
      toast.error(error.message);
    }
  };

  // Mobile doesn't require confirm password match
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const isFormValid = passwordValidation.isValid && 
    (isMobile || password === confirmPassword) && 
    agreedToTerms && 
    fullName.trim() && 
    validateEmail(email) && 
    validatePhone(phoneNumber);

  return (
    <div className="flex-1 flex items-center justify-center py-4 sm:py-8 px-3 sm:px-4 bg-gradient-to-br from-primary/5 via-background to-accent/5">
        <div className="w-full max-w-md">
          {/* Mobile-only above-the-fold headline */}
          <div className="md:hidden text-center mb-4">
            <h1 className="text-xl font-bold text-foreground leading-tight">
              Apply for Your Indian Visa Online
            </h1>
            <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
              Fast, error-free Indian visa assistance for foreign travelers — verified by experts.
            </p>
            {/* Compact trust line */}
            <div className="flex items-center justify-center gap-1.5 mt-3 text-[10px] text-muted-foreground">
              <CheckCircle2 className="h-3 w-3 text-primary" />
              <span>99% approval success</span>
              <span className="text-border">•</span>
              <span>Secure payments</span>
              <span className="text-border">•</span>
              <span>Human-verified</span>
            </div>
          </div>

          {/* Mobile trust badges - above the fold */}
          <MobileTrustBadges />

          <Card className="w-full shadow-xl">
            <CardHeader className="space-y-1 text-center pb-3 sm:pb-6 pt-4 sm:pt-6 px-4 sm:px-6">
              {/* Desktop title - hidden on mobile since we have headline above */}
              <CardTitle className="hidden md:block text-xl sm:text-2xl font-bold">Create Your Account</CardTitle>
              <CardTitle className="md:hidden text-lg font-semibold">Create Your Account</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Get started with your Indian visa application
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 px-4 sm:px-6 pb-4 sm:pb-6">
              {/* Google Sign-in - Secondary option at top */}
              <Button
                type="button"
                variant="outline"
                className="w-full h-10 sm:h-11 text-sm"
                onClick={handleGoogleSignIn}
                disabled={loading}
              >
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                Continue with Google
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">Or register with email</span>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3">
                {/* Full Name */}
                <div className="space-y-1">
                  <Label htmlFor="fullname" className="text-xs sm:text-sm font-medium">
                    Full Name
                  </Label>
                  <Input
                    id="fullname"
                    placeholder="Enter your full name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    onBlur={() => handleBlur("fullName")}
                    disabled={loading}
                    autoComplete="name"
                    className={`h-9 sm:h-10 text-sm ${getFullNameError() ? "border-destructive" : ""}`}
                  />
                  {/* Mobile helper text */}
                  <p className="md:hidden text-[10px] text-muted-foreground">As per passport</p>
                  {getFullNameError() && (
                    <p className="text-[10px] sm:text-xs text-destructive">{getFullNameError()}</p>
                  )}
                </div>

                {/* Email */}
                <div className="space-y-1">
                  <Label htmlFor="email" className="text-xs sm:text-sm font-medium">
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onBlur={() => handleBlur("email")}
                    disabled={loading}
                    autoComplete="email"
                    className={`h-9 sm:h-10 text-sm ${getEmailError() ? "border-destructive" : ""}`}
                  />
                  {/* Mobile helper text */}
                  <p className="md:hidden text-[10px] text-muted-foreground">Visa updates & confirmation will be sent here</p>
                  {getEmailError() && (
                    <p className="text-[10px] sm:text-xs text-destructive">{getEmailError()}</p>
                  )}
                </div>

                {/* Phone Number */}
                <div className="space-y-1">
                  <Label htmlFor="phone" className="text-xs sm:text-sm font-medium">
                    Phone Number
                  </Label>
                  <div className="flex gap-1.5">
                    <PhoneCountrySelect value={phoneIsd} onChange={setPhoneIsd} />
                    <Input
                      id="phone"
                      type="tel"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      placeholder="Phone number"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ""))}
                      onBlur={() => handleBlur("phone")}
                      disabled={loading}
                      autoComplete="tel-national"
                      className={`flex-1 h-9 sm:h-10 text-sm ${getPhoneError() ? "border-destructive" : ""}`}
                    />
                  </div>
                  {/* Mobile helper text */}
                  <p className="md:hidden text-[10px] text-muted-foreground">Used only for visa status & support</p>
                  {getPhoneError() && (
                    <p className="text-[10px] sm:text-xs text-destructive">{getPhoneError()}</p>
                  )}
                </div>

                {/* Password */}
                <div className="space-y-1">
                  <Label htmlFor="password" className="text-xs sm:text-sm font-medium">
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Create a password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onBlur={() => handleBlur("password")}
                      disabled={loading}
                      autoComplete="new-password"
                      className={`pr-10 h-9 sm:h-10 text-sm ${getPasswordError() ? "border-destructive" : ""}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <PasswordStrengthIndicator password={password} showRules={false} />
                  {getPasswordError() && (
                    <p className="text-[10px] sm:text-xs text-destructive">{getPasswordError()}</p>
                  )}
                </div>

                {/* Confirm Password - Desktop only */}
                <div className="hidden md:block space-y-1">
                  <Label htmlFor="confirm-password" className="text-xs sm:text-sm font-medium">
                    Confirm Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="confirm-password"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm your password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      onBlur={() => handleBlur("confirmPassword")}
                      disabled={loading}
                      autoComplete="new-password"
                      className={`pr-10 h-9 sm:h-10 text-sm ${getConfirmPasswordError() ? "border-destructive" : ""}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      tabIndex={-1}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {getConfirmPasswordError() && (
                    <p className="text-[10px] sm:text-xs text-destructive">{getConfirmPasswordError()}</p>
                  )}
                </div>
              
                {/* Terms Agreement - Larger checkbox for mobile */}
                <div className="flex items-start gap-3 pt-2">
                  <Checkbox
                    id="terms"
                    checked={agreedToTerms}
                    onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
                    disabled={loading}
                    className="h-5 w-5 mt-0.5 border-2"
                  />
                  <label
                    htmlFor="terms"
                    className="text-xs sm:text-sm leading-snug peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    I agree to the{" "}
                    <Link to="/terms" className="text-primary hover:underline font-medium">
                      Terms & Conditions
                    </Link>{" "}
                    and{" "}
                    <Link to="/privacy" className="text-primary hover:underline font-medium">
                      Privacy Policy
                    </Link>
                  </label>
                </div>

                {/* Submit Button - Different text for mobile */}
                <div className="space-y-1.5 mt-3">
                  {/* Mobile CTA */}
                  <Button
                    type="submit"
                    className="md:hidden w-full h-11 text-sm font-semibold bg-primary hover:bg-primary/90"
                    disabled={loading || !isFormValid}
                  >
                    {loading ? "Creating Account..." : "Start My Indian Visa Application →"}
                  </Button>
                  {/* Desktop CTA */}
                  <Button
                    type="submit"
                    className="hidden md:flex w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90"
                    disabled={loading || !isFormValid}
                  >
                    {loading ? "Creating Account..." : "Create Account & Continue →"}
                  </Button>
                  {/* Mobile subtext */}
                  <p className="md:hidden text-center text-[10px] text-muted-foreground">
                    Takes only 3–5 minutes
                  </p>
                </div>

                {/* Trust Microcopy */}
                <div className="flex items-center justify-center gap-1.5 text-[10px] sm:text-xs text-muted-foreground">
                  <Shield className="h-3 w-3" />
                  <span>Secure • Private • Encrypted</span>
                </div>

                {/* Helper text below CTA */}
                <p className="text-center text-[10px] sm:text-xs text-muted-foreground">
                  Your data is secure and never shared.
                </p>
              </form>

              <div className="text-center text-xs sm:text-sm pt-1">
                Already have an account?{" "}
                <Link to="/login" className="text-primary font-medium hover:underline">
                  Sign in
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
    </div>
  );
};

export default Register;
