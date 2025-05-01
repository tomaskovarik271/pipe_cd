import React, { useState } from 'react';
// import React from 'react'; // Remove duplicate import
import { supabase } from '@/supabase-client'; // Use alias
import { 
  Box, 
  Button, 
  Field,
  Input, 
  Stack, 
  Heading, 
  Alert,
} from '@chakra-ui/react';

export const SignupForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSignup = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email: email,
        password: password,
        // options: { emailRedirectTo: '...' } // Optional: Add redirect URL if needed
      });

      if (error) {
        throw error;
      }
      
      // Check if user object exists and if email confirmation is required
      if (data.user && data.user.identities?.length === 0) {
         // This case might indicate an issue or unexpected state, but typically 
         // identities array will contain info if user exists. Let's assume success means potential confirmation needed.
         setSuccessMessage('Signup successful! Please check your email for confirmation.');
      } else if (data.session) {
         // User is immediately logged in (e.g., email confirmation disabled)
         setSuccessMessage('Signup successful! You are now logged in.'); 
         // AuthProvider (when enabled) should handle redirect/state update
      } else {
         // Default success message assuming email confirmation is likely
         setSuccessMessage('Signup successful! Please check your email for confirmation.');
      }

      // Clear form on success
      setEmail('');
      setPassword('');
      setConfirmPassword('');

    } catch (err: any) {
      setError(err.error_description || err.message || 'An unexpected error occurred during signup');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box p={4} borderWidth="1px" borderRadius="lg" boxShadow="md" mt={4}>
      <Heading as="h2" size="lg" mb={6} textAlign="center">
        Sign Up
      </Heading>
      <form onSubmit={handleSignup}>
        <Stack gap={4}>
          {error && (
            <Alert.Root status="error" borderRadius="md">
              <Alert.Description>{error}</Alert.Description>
            </Alert.Root>
          )}
          {successMessage && (
            <Alert.Root status="success" borderRadius="md">
              <Alert.Description>{successMessage}</Alert.Description>
            </Alert.Root>
          )}
          <Field.Root id="signup-email" required>
            <Field.Label>Email address</Field.Label>
            <Input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              placeholder="your@email.com"
              disabled={loading}
            />
          </Field.Root>
          <Field.Root id="signup-password" required>
            <Field.Label>Password</Field.Label>
            <Input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              placeholder="Create a password"
              disabled={loading}
            />
          </Field.Root>
          <Field.Root id="confirm-password" required>
            <Field.Label>Confirm Password</Field.Label>
            <Input 
              type="password" 
              value={confirmPassword} 
              onChange={(e) => setConfirmPassword(e.target.value)} 
              placeholder="Confirm your password"
              disabled={loading}
            />
          </Field.Root>
          <Button 
            type="submit" 
            colorScheme="green" 
            loading={loading} 
            width="full"
            disabled={loading}
          >
            Sign Up
          </Button>
        </Stack>
      </form>
    </Box>
  );
}; 