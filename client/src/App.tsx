import './App.css'
// Remove direct form imports
// import { LoginForm } from '@/components/Auth/LoginForm';
// import { SignupForm } from '@/components/Auth/SignupForm';
// import { Button, Alert } from '@chakra-ui/react'; 
// import { supabase } from '@/supabase-client';
// import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'; // Import router components
import { AuthPage } from '@/components/AuthPage'; // Import AuthPage
import { DashboardPage } from '@/components/DashboardPage'; // Import DashboardPage
// Import useAuthContext when providers are re-enabled
// import { useAuthContext } from '@/context/AuthContext'; 

function App() {
  // const { session, loading } = useAuthContext(); // Get auth state when ready

  // Placeholder logic - replace with actual check on session/loading
  // We'll manage logged in state via routing now
  const isLoggedIn = false; // Replace with actual check later
  const isLoading = false; // Replace with actual check later

  // Remove logout logic, it belongs on the dashboard page now
  // const [logoutLoading, setLogoutLoading] = useState(false);
  // const [logoutError, setLogoutError] = useState<string | null>(null);
  // const handleLogout = async () => { ... };

  if (isLoading) {
    return <div>Loading...</div>; // Keep basic loading indicator for initial auth check
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route 
          path="/" 
          element={isLoggedIn ? <DashboardPage /> : <Navigate to="/auth" replace />}
        />
        <Route 
          path="/auth" 
          element={!isLoggedIn ? <AuthPage /> : <Navigate to="/" replace />}
        />
        {/* Add other routes here */}
      </Routes>
    </BrowserRouter>
  )
}

export default App
