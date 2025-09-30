import React, { useState } from "react";
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  Heading,
  useToast,
} from "@chakra-ui/react";
import {  useNavigate } from "react-router-dom";

const Login = () => {


   const navigate  = useNavigate()
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();


  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await fetch("https://hkm-vanabhojan-backend-882278565284.europe-west1.run.app/admin/users/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        toast({
          title: "login  Successful.",
          description: "Admin login successfully.",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
        console.log(data)
        localStorage.setItem("token", data.token);
        localStorage.setItem("role", data.role);
        if (data.role === "admin") {
          navigate("/admin");
        } else if (data.role === "user") {
          navigate("/admin/AdminAttendanceScannedList");
        } else {
          navigate("/");
        }
      } else {
        toast({
          title: "login Failed.",
          description: data.message || "loing went wrong.",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      toast({
        title: "Error.",
        description: "Network error, please try again.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box maxW="md" mx="auto" mt={10} p={6} borderWidth={1} borderRadius="lg" boxShadow="md" >
      <Heading mb={6} textAlign="center" size="md">Admin Login</Heading>
      <form onSubmit={handleSubmit}>
        <VStack spacing={4}>
         
          <FormControl isRequired>
            <FormLabel>Email</FormLabel>
            <Input
              name="email"
              type="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleChange}
            />
          </FormControl>
          <FormControl isRequired>
            <FormLabel>Password</FormLabel>
            <Input
              name="password"
              type="password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleChange}
            />
          </FormControl>
          <Button colorScheme="teal" type="submit" isLoading={isLoading} width="full">
            Login
          </Button>
        </VStack>
      </form>
    </Box>
  );
};

export default Login;