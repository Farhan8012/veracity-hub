/**
 * Maps error codes/messages to user-friendly messages
 * Prevents exposing internal implementation details to users
 */

const authErrorMap: Record<string, string> = {
  // Supabase auth error codes
  'invalid_credentials': 'Invalid email or password',
  'invalid_login_credentials': 'Invalid email or password',
  'email_not_confirmed': 'Please verify your email address',
  'user_already_exists': 'An account with this email already exists',
  'email_already_exists': 'An account with this email already exists',
  'weak_password': 'Password must be stronger',
  'user_not_found': 'No account found with this email',
  'over_request_rate_limit': 'Too many attempts. Please try again later',
  'signup_disabled': 'Sign up is currently disabled',
  'invalid_email': 'Please enter a valid email address',
  'email_address_invalid': 'Please enter a valid email address',
};

const databaseErrorMap: Record<string, string> = {
  // Common Postgres error codes
  '23505': 'This record already exists',
  '23503': 'This operation cannot be completed due to related data',
  '23514': 'The provided data does not meet the requirements',
  '42501': 'You do not have permission to perform this action',
  'PGRST116': 'Record not found',
};

export function getUserFriendlyError(error: any): string {
  if (!error) return 'An unexpected error occurred. Please try again.';
  
  // Check for Supabase auth error codes
  const errorCode = error.code || error.error_code || '';
  const errorMessage = error.message || '';
  
  // Check auth errors first
  if (authErrorMap[errorCode]) {
    return authErrorMap[errorCode];
  }
  
  // Check database errors
  if (databaseErrorMap[errorCode]) {
    return databaseErrorMap[errorCode];
  }
  
  // Check for common error message patterns
  if (errorMessage.toLowerCase().includes('invalid login credentials')) {
    return 'Invalid email or password';
  }
  
  if (errorMessage.toLowerCase().includes('email not confirmed')) {
    return 'Please verify your email address';
  }
  
  if (errorMessage.toLowerCase().includes('already registered') || 
      errorMessage.toLowerCase().includes('already exists')) {
    return 'An account with this email already exists';
  }
  
  if (errorMessage.toLowerCase().includes('network') || 
      errorMessage.toLowerCase().includes('fetch')) {
    return 'Network error. Please check your connection and try again.';
  }
  
  if (errorMessage.toLowerCase().includes('timeout')) {
    return 'Request timed out. Please try again.';
  }
  
  // Return generic message for unmapped errors
  // This prevents leaking internal details
  return 'An error occurred. Please try again later.';
}

/**
 * Validation utilities for user inputs
 */
export const validation = {
  maxTagLength: 50,
  maxProfileNameLength: 100,
  maxClaimLength: 5000,
  
  tagPattern: /^[a-zA-Z0-9\s\-_]+$/,
  
  validateTag(tag: string): { valid: boolean; error?: string } {
    const trimmed = tag.trim();
    
    if (!trimmed) {
      return { valid: false, error: 'Tag cannot be empty' };
    }
    
    if (trimmed.length > this.maxTagLength) {
      return { valid: false, error: `Tag must be ${this.maxTagLength} characters or less` };
    }
    
    if (!this.tagPattern.test(trimmed)) {
      return { valid: false, error: 'Tags can only contain letters, numbers, spaces, hyphens, and underscores' };
    }
    
    return { valid: true };
  },
  
  validateProfileName(name: string): { valid: boolean; error?: string } {
    if (name.length > this.maxProfileNameLength) {
      return { valid: false, error: `Name must be ${this.maxProfileNameLength} characters or less` };
    }
    
    return { valid: true };
  },
  
  validateClaim(claim: string): { valid: boolean; error?: string } {
    const trimmed = claim.trim();
    
    if (!trimmed) {
      return { valid: false, error: 'Please enter a news claim to verify' };
    }
    
    if (trimmed.length > this.maxClaimLength) {
      return { valid: false, error: `Claim must be ${this.maxClaimLength} characters or less` };
    }
    
    return { valid: true };
  },
};
