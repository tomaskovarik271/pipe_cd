// import { useState } from 'react' // No longer needed for default
// import reactLogo from './assets/react.svg' // No longer needed
// import viteLogo from '/vite.svg' // No longer needed
import './App.css'
import { LoginForm } from '@/components/Auth/LoginForm'; // Use alias
import { SignupForm } from '@/components/Auth/SignupForm'; // Use alias
// Import useAuthContext when providers are re-enabled
// import { useAuthContext } from '@/context/AuthContext'; 

function App() {
  // const { session, loading } = useAuthContext(); // Get auth state when ready

  // Placeholder logic - replace with actual check on session/loading
  const isLoggedIn = false; // Simulate logged out state for now
  const isLoading = false; // Simulate loading finished

  if (isLoading) {
    return <div>Loading...</div>; // Basic loading indicator
  }

  return (
    <>
      <h1>Custom CRM App</h1>
      
      {isLoggedIn ? (
        <div>
          <p>Welcome! You are logged in.</p>
          {/* TODO: Add Logout button */}
          {/* TODO: Add main application content/routing here */}
        </div>
      ) : (
        <div>
          <p>Please log in or sign up:</p>
          <LoginForm />
          <hr />
          <SignupForm />
        </div>
      )}
    </>
  )
}

export default App
