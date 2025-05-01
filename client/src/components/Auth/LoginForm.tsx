import React, { useState } from 'react';
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

export const LoginForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (error) {
        throw error;
      }
      
      // Login successful
      // TODO: Add alternative success feedback (e.g., state change, message) if needed without toast
      console.log('Login successful!');

    } catch (err: any) {
      setError(err.error_description || err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box p={4} borderWidth="1px" borderRadius="lg" boxShadow="md">
      <Heading as="h2" size="lg" mb={6} textAlign="center">
        Login
      </Heading>
      <form onSubmit={handleLogin}>
        <Stack gap={4}>
          {error && (
            <Alert.Root status="error" borderRadius="md">
              {/* <Alert.Icon /> */}
              <Alert.Description>{error}</Alert.Description>
            </Alert.Root>
          )}
          <Field.Root id="email" required>
            <Field.Label>Email address</Field.Label>
            <Input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              placeholder="your@email.com"
            />
          </Field.Root>
          <Field.Root id="password" required>
            <Field.Label>Password</Field.Label>
            <Input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              placeholder="********"
            />
          </Field.Root>
          <Button 
            type="submit" 
            colorScheme="blue" 
            loading={loading} 
            width="full"
          >
            Log In
          </Button>
        </Stack>
      </form>
    </Box>
  );
}; 