import './App.css'
import { LoginForm } from '@/components/Auth/LoginForm';
import { SignupForm } from '@/components/Auth/SignupForm';
import { Button, Alert } from '@chakra-ui/react';
import { supabase } from '@/supabase-client';
import { useState } from 'react';
// Import useAuthContext when providers are re-enabled
// import { useAuthContext } from '@/context/AuthContext'; 

function App() {
  // const { session, loading } = useAuthContext(); // Get auth state when ready

  // Placeholder logic - replace with actual check on session/loading
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);

  const handleLogout = async () => {
    setLogoutLoading(true);
    setLogoutError(null);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      console.log('Logout successful!');
      setIsLoggedIn(false);
      // AuthProvider (when enabled) will update the real state
    } catch (err: any) {
      console.error('Logout error:', err);
      setLogoutError(err.error_description || err.message || 'Failed to log out');
    } finally {
      setLogoutLoading(false);
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <h1>Custom CRM App</h1>
      
      {isLoggedIn ? (
        <div>
          <p>Welcome! You are logged in.</p>
          {logoutError && (
            <Alert.Root status="error" mt={2} borderRadius="md">
              <Alert.Description>{logoutError}</Alert.Description>
            </Alert.Root>
          )}
          <Button 
            mt={4} 
            onClick={handleLogout} 
            loading={logoutLoading}
            colorScheme="red"
          >
            Log Out
          </Button>
          {/* TODO: Add main application content/routing here */}
        </div>
      ) : (
        <div>
          <Button onClick={() => setIsLoggedIn(true)} mb={4}>Simulate Login</Button> 
          <p>Please log in or sign up:</p>
          <LoginForm />
          <hr style={{ margin: '20px 0' }}/> { /* Basic separator */ }
          <SignupForm />
        </div>
      )}
    </>
  )
}

export default App
