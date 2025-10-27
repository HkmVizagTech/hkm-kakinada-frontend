import React, { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { Spinner, Box, Text } from "@chakra-ui/react";

const ProtectedRoute = ({ allowedRoles, children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(null); 
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
        console.log(" Validating token:", token);
        console.log(" Stored role:", role);
        
        const response = await fetch("https://hkm-kakinada-882278565284.asia-south1.run.app/admin/users/validate-token", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          }
        });

        console.log(" Token validation response status:", response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log(" Token validation successful:", data);
          setIsAuthenticated(true);
          setUserRole(data.user.role);
          localStorage.setItem("role", data.user.role);
        } else {
          const errorData = await response.text();
          console.error(" Token validation failed:", response.status, errorData);
          localStorage.removeItem("token");
          localStorage.removeItem("role");
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error(" Token validation error:", error);
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        setIsAuthenticated(false);
      }
    };

    validateToken();
  }, []);

 
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


  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  
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
