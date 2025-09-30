import React, { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { Spinner, Box, Text } from "@chakra-ui/react";

const ProtectedRoute = ({ allowedRoles, children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(null); // null = checking, true = authenticated, false = not authenticated
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    const validateToken = async () => {
      const token = localStorage.getItem("token");
      const role = localStorage.getItem("role");

      if (!token || !role) {
        setIsAuthenticated(false);
        return;
      }

      try {
        // Validate token using dedicated validation endpoint
        const response = await fetch("https://hkm-vanabhojan-backend-882278565284.europe-west1.run.app/admin/users/validate-token", {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (response.ok) {
          const data = await response.json();
          setIsAuthenticated(true);
          // Use role from server response instead of localStorage for security
          setUserRole(data.user.role);
          // Update localStorage with verified role
          localStorage.setItem("role", data.user.role);
        } else {
          // Token is invalid, clear localStorage
          localStorage.removeItem("token");
          localStorage.removeItem("role");
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error("Token validation error:", error);
        // Clear localStorage on any error
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        setIsAuthenticated(false);
      }
    };

    validateToken();
  }, []);

  // Show loading spinner while checking authentication
  if (isAuthenticated === null) {
    return (
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        minHeight="100vh"
        flexDirection="column"
      >
        <Spinner size="xl" color="teal.500" />
        <Text mt={4} color="gray.600">Verifying authentication...</Text>
      </Box>
    );
  }

  // Not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  // Check if user has required role
  if (!allowedRoles.includes(userRole)) {
    return (
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        minHeight="100vh"
        flexDirection="column"
      >
        <Text fontSize="xl" color="red.500" mb={4}>Access Denied</Text>
        <Text color="gray.600">You don't have permission to access this page.</Text>
      </Box>
    );
  }

  return children;
};

export default ProtectedRoute;
