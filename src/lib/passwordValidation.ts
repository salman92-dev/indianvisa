// Strong password validation utility
// DO NOT log or store passwords

const WEAK_PASSWORDS = [
  'password', 'password123', 'password1', '123456', '12345678', '123456789',
  'qwerty', 'qwerty123', 'admin', 'admin123', 'welcome', 'welcome1',
  'letmein', 'monkey', 'dragon', 'master', 'login', 'abc123',
  'iloveyou', 'sunshine', 'princess', 'football', 'baseball', 'soccer',
  'passw0rd', 'shadow', 'michael', 'jennifer', 'trustno1', 'hunter',
  'ranger', 'harley', 'batman', 'andrew', 'tigger', 'charlie',
  'robert', 'thomas', 'hockey', 'daniel', 'starwars', 'klaster',
  'george', 'computer', 'michelle', 'jessica', 'pepper', 'zxcvbn',
  'asdfgh', 'freedom', 'whatever', 'nicole', 'jordan', 'cameron',
  'secret', 'summer', 'hello', 'amanda', 'ashley', 'austin',
  'madison', 'mustang', 'access', 'thunder', 'corvette', 'fuck',
  'merlin', 'diamond', 'falcon', 'taylor', 'william', 'matthew',
  'lakers', 'maverick', 'sparky', 'buster', 'killer', 'dakota',
  'iceman', 'eagles', 'cookie', 'coffee', 'lovely', 'banana'
];

export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
  rules: {
    minLength: boolean;
    hasUppercase: boolean;
    hasLowercase: boolean;
    hasNumber: boolean;
    hasSpecial: boolean;
    notWeak: boolean;
    noRepeated: boolean;
  };
}

export function validatePassword(password: string): PasswordValidationResult {
  const trimmed = password.trim();
  const errors: string[] = [];

  // Rule checks
  const minLength = trimmed.length >= 12;
  const hasUppercase = /[A-Z]/.test(trimmed);
  const hasLowercase = /[a-z]/.test(trimmed);
  const hasNumber = /\d/.test(trimmed);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\\/`~';]/.test(trimmed);
  
  // Check for weak passwords (case-insensitive)
  const notWeak = !WEAK_PASSWORDS.includes(trimmed.toLowerCase());
  
  // Check for repeated characters only (e.g., "aaaaaaaaaa")
  const noRepeated = trimmed.length > 0 && !/^(.)\1+$/.test(trimmed);

  // Build error messages
  if (!minLength) {
    errors.push("Password must be at least 12 characters long");
  }
  if (!hasUppercase) {
    errors.push("Password must contain at least 1 uppercase letter");
  }
  if (!hasLowercase) {
    errors.push("Password must contain at least 1 lowercase letter");
  }
  if (!hasNumber) {
    errors.push("Password must contain at least 1 number");
  }
  if (!hasSpecial) {
    errors.push("Password must contain at least 1 special character (!@#$%^&*...)");
  }
  if (!notWeak) {
    errors.push("This password is too common. Please choose a stronger password");
  }
  if (!noRepeated) {
    errors.push("Password cannot consist of only repeated characters");
  }

  const isValid = minLength && hasUppercase && hasLowercase && hasNumber && hasSpecial && notWeak && noRepeated;

  return {
    isValid,
    errors,
    rules: {
      minLength,
      hasUppercase,
      hasLowercase,
      hasNumber,
      hasSpecial,
      notWeak,
      noRepeated,
    },
  };
}

export function getPasswordStrength(password: string): 'weak' | 'fair' | 'good' | 'strong' {
  const { rules } = validatePassword(password);
  const passedRules = Object.values(rules).filter(Boolean).length;
  
  if (passedRules <= 3) return 'weak';
  if (passedRules <= 5) return 'fair';
  if (passedRules <= 6) return 'good';
  return 'strong';
}
