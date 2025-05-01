import React from 'react';
import { Box, Button, Container, Heading, Text, Alert } from '@chakra-ui/react';
import { supabase } from '@/supabase-client'; // Import supabase for logout
// import { useAuthContext } from '@/context/AuthContext'; // Will use later

export const DashboardPage: React.FC = () => {
  // const { session } = useAuthContext(); // Get session later
  const [logoutLoading, setLogoutLoading] = React.useState(false);
  const [logoutError, setLogoutError] = React.useState<string | null>(null);

  const handleLogout = async () => {
    setLogoutLoading(true);
    setLogoutError(null);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      console.log('Logout successful from Dashboard!');
      // AuthProvider (when enabled) will trigger state change and redirect
    } catch (err: any) {
      console.error('Logout error:', err);
      setLogoutError(err.error_description || err.message || 'Failed to log out');
    } finally {
      setLogoutLoading(false);
    }
  };

  return (
    <Container py={10}>
      <Heading mb={4}>Dashboard</Heading>
      <Text mb={4}>Welcome! You are logged in.</Text>
      {/* TODO: Display user info from session */} 
      {/* <Text>Email: {session?.user?.email}</Text> */}

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

      <Box mt={8}>
        {/* Main application content goes here */}
        <Heading size="md" mb={4}>CRM Content Area</Heading>
        <Text>Contacts, Deals, etc. will be displayed here.</Text>
      </Box>
    </Container>
  );
}; 