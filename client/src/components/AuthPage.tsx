import React from 'react';
import { Box, Container, Heading, VStack } from '@chakra-ui/react';
import { LoginForm } from '@/components/Auth/LoginForm';
import { SignupForm } from '@/components/Auth/SignupForm';

export const AuthPage: React.FC = () => {
  return (
    <Container centerContent py={10}>
      <VStack gap={8} align="stretch" w="full" maxW="md">
        <Heading textAlign="center">Welcome to the CRM</Heading>
        <LoginForm />
        <SignupForm />
      </VStack>
    </Container>
  );
}; 