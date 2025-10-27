import React, { useState, useEffect } from "react";
import image12 from './component/newLogo.png';

import {
  Box,
  Button,
  FormControl,
  FormLabel,
  FormErrorMessage,
  Input,
  RadioGroup,
  Radio,
  VStack,
  HStack,
  Stack,
  Heading,
  useToast,
  Select as ChakraSelect,
  Text,
  Container,
  InputGroup,
  InputLeftAddon,
  Image,
  Flex,
  Card,
  CardBody,
  CardHeader,
  Divider,
  SimpleGrid
} from "@chakra-ui/react";
import { CalendarIcon } from "@chakra-ui/icons";
import Select from "react-select";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import natureBg from './component/vanabhojanam-nature.jpg'; 

const initialState = {
  serialNo: "",
  name: "",
  whatsappNumber: "",
  email: "",
  gender: "",
  collegeOrWorking: "",
  companyName: "",
  college: "",
  course: "",
  year: "",
  dob: "",
  amount: "1.00",
  studentIdCard: null,
  studentIdCardPreview: "",
};

const RAZORPAY_KEY = "rzp_live_HBAc3tlMK0X5Xd";

const API_BASE = "https://hkm-kakinada-882278565284.asia-south1.run.app/users";

const Main = () => {
  const toast = useToast();
  const navigate = useNavigate();
  const [collegeOptions, setCollegeOptions] = useState([]);
  const [formData, setFormData] = useState(initialState);
  const [otherCollege, setOtherCollege] = useState("");
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!window.Razorpay) {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      document.body.appendChild(script);
      return () => {
        document.body.removeChild(script);
      };
    }
  }, []);

  useEffect(() => {
    const fetchColleges = async () => {
      try {
        const res = await axios.get(
          "https://vrc-server-110406681774.asia-south1.run.app/college"
        );
        const options = res.data.map((college) => ({
          label: college.name,
          value: college.name,
        }));

        options.push({ label: "Other College", value: "Other College" });
        setCollegeOptions(options);
      } catch (err) {
        console.error("Failed to fetch colleges:", err);
      }
    };
    fetchColleges();
  }, []);


  useEffect(() => {
    return () => {
      if (formData.studentIdCardPreview) {
        URL.revokeObjectURL(formData.studentIdCardPreview);
      }
    };
  }, [formData.studentIdCardPreview]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }

    if (field === "college" && value !== "Other College") {
      setOtherCollege("");
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Invalid file type",
          description: "Please upload a JPG, PNG, or WebP image file",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
        return;
      }

     
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please upload an image smaller than 5MB",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
        return;
      }


      const previewUrl = URL.createObjectURL(file);
      setFormData(prev => ({
        ...prev,
        studentIdCard: file,
        studentIdCardPreview: previewUrl
      }));
      
    
      if (errors.studentIdCard) {
        setErrors(prev => ({ ...prev, studentIdCard: "" }));
      }
    }
  };

  const removeFile = () => {
    
    if (formData.studentIdCardPreview) {
      URL.revokeObjectURL(formData.studentIdCardPreview);
    }
    setFormData(prev => ({
      ...prev,
      studentIdCard: null,
      studentIdCardPreview: ""
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    const {
      name,
      whatsappNumber,
      email,
      gender,
      collegeOrWorking,
      companyName,
      college,
      course,
      year,
      dob,
      studentIdCard,
    } = formData;

    if (!name.trim()) newErrors.name = "Name is required";
    if (!dob) newErrors.dob = "Date of birth is required";
    if (!whatsappNumber.trim()) {
      newErrors.whatsappNumber = "WhatsApp number is required";
    } else if (!/^\d{10}$/.test(whatsappNumber.replace(/\D/g, ""))) {
      newErrors.whatsappNumber = "Enter a valid 10-digit number";
    }
    if (!email) newErrors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = "Enter a valid email";
    if (!gender) newErrors.gender = "Please select gender";
    if (!collegeOrWorking)
      newErrors.collegeOrWorking = "Please select one option";
    if (collegeOrWorking === "Working" && !companyName.trim())
      newErrors.companyName = "Company name is required";
    if (collegeOrWorking === "College" && !college.trim()) newErrors.college = "College name is required";
    if (collegeOrWorking === "College" && college === "Other College" && !otherCollege.trim()) {
      newErrors.college = "Please enter your college name";
    }
    if (collegeOrWorking === "College" && !course.trim()) newErrors.course = "Course is required";
    if (collegeOrWorking === "College" && !year)
      newErrors.year = "Year is required";
    if (collegeOrWorking === "College" && !studentIdCard)
      newErrors.studentIdCard = "Please upload your student ID card";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePayment = async () => {
    const finalFormData = {
      ...formData,
      college:
        formData.collegeOrWorking === "College" && formData.college === "Other College"
          ? otherCollege
          : formData.college,
    };

    if (!validateForm()) return;
    setIsSubmitting(true);
    try {
      const baseAmount = formData.collegeOrWorking === "College" ? 99 : 1200;
      const amountInPaise = baseAmount * 100;

      let orderData;
      
      
      if (formData.collegeOrWorking === "College" && formData.studentIdCard) {
    
        const formDataToSend = new FormData();
        formDataToSend.append('amount', amountInPaise);
        formDataToSend.append('formData', JSON.stringify(finalFormData));
        formDataToSend.append('studentIdCard', formData.studentIdCard);

        const orderRes = await fetch(`${API_BASE}/create-order-with-file`, {
          method: "POST",
          body: formDataToSend,
        });
        orderData = await orderRes.json();
      } else {
        
        const orderRes = await fetch(`${API_BASE}/create-order`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amount: amountInPaise, formData: finalFormData }),
        });
        orderData = await orderRes.json();
      }
      
      if (!orderData.id) throw new Error("Order creation failed");

      const options = {
        key: RAZORPAY_KEY,
        amount: orderData.amount,
        currency: "INR",
        name: "Vanabhojanam Youth Festival",
        description: "Registration Fee",
        order_id: orderData.id,
        handler: async (response) => {
          try {
            const verifyRes = await fetch(
              `${API_BASE}/verify-payment`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_signature: response.razorpay_signature,
                  formData: {
                    ...finalFormData,
                    paymentMethod: "Online",
                    receipt: `receipt_${Date.now()}`,
                  },
                }),
              }
            );
            const result = await verifyRes.json();

            if (result.message === "success" || result.message === "Already Registered") {
              toast({
                title: "Registration Successful!",
                description: "Your registration is confirmed.",
                status: "success",
                duration: 5000,
                isClosable: true,
                position: "top-right",
              });
              navigate(`/thankyou/${response.razorpay_payment_id}`);
            } else {
              throw new Error(result.message);
            }
          } catch (err) {
            toast({
              title: "Payment verification failed",
              description: err.message || "Try again later",
              status: "error",
              duration: 5000,
              isClosable: true,
            });
          } finally {
            setIsSubmitting(false);
          }
        },
        prefill: {
          name: finalFormData.name,
          email: finalFormData.email,
          contact: `91${finalFormData.whatsappNumber}`,
        },
        theme: { color: "#20603d" },
        modal: {
          ondismiss: () => setIsSubmitting(false)
        }
      };
      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response){
        toast({
          title: "Payment failed",
          description: response.error && response.error.description ? response.error.description : "Try again later",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
        setIsSubmitting(false);
      });
      rzp.open();
    } catch (err) {
      toast({
        title: "Payment failed",
        description: err.message || "Try again later",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      setIsSubmitting(false);
    }
  };

  const customSelectStyles = {
    control: (base) => ({
      ...base,
      borderColor: "#C9E4CA",
      borderWidth: "2px",
      borderRadius: "8px",
      minHeight: "40px",
      background: "rgba(255,255,255,0.96)",
      boxShadow: "0 2px 12px 0 rgba(32,96,61,0.06)",
      "&:hover": { borderColor: "#20603d" },
    }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isSelected
        ? "#20603d"
        : state.isFocused
        ? "#E1F7E3"
        : "white",
      color: state.isSelected ? "white" : "#20603d",
    }),
  };

  return (
    <Box
      minH="100vh"
      bgImage={`url(${natureBg})`}
      bgAttachment="fixed"
      bgSize="cover"
      bgPosition="center"
      py={{ base: 2, md: 10 }}
      px={0}
      style={{
        backgroundColor: "#e9f8ef",
        backgroundBlendMode: "overlay",
      }}
    >
      <Container maxW="2xl" px={2} zIndex={1}>
        <Flex
          direction={{ base: "column", md: "row" }}
          align="center"
          justify="center"
          gap={6}
          mb={8}
          textAlign={{ base: "center", md: "left" }}
          flexWrap="wrap"
        >
          <Box
            boxSize={{ base: '120px', md: '150px' }}
            borderRadius="full"
            overflow="hidden"
            boxShadow="0 4px 24px 0 rgba(32,96,61,0.08)"
            border="3px solid #20603d"
            bg="white"
          >
            <Image
              src={image12}
              alt="Hare Krishna Movement Logo"
              objectFit="cover"
              width="100%"
              height="100%"
            />
          </Box>
          <Box textAlign={{ base: "center", md: "left" }}>
            <Heading fontSize={{ base: '2xl', md: '3xl' }} color="#20603d" fontWeight="bold">
              VANABHOJANAM <br /> Youth Festival
            </Heading>
            <Text fontSize={{ base: 'md', md: 'lg' }} color="#20603d" fontWeight="semibold" mt={2} letterSpacing={1}>
              A Day With Nature & Divine
            </Text>
            <Text fontSize="sm" color="#d72660" fontWeight="bold" mt={2}>
              Organised by Hare Krishna Vaikuntham Cultural Centre
            </Text>
          </Box>
        </Flex>
        <Card
          bg="rgba(255,255,255,0.97)"
          boxShadow="0 4px 24px 0 rgba(32,96,61,0.13)"
          borderRadius="2xl"
          mb={8}
        >
          <CardBody>
            <Stack direction={{ base: "column", md: "row" }} justify="space-between" align="center" spacing={4}>
              <VStack align={{ base: "center", md: "start" }} spacing={3} flex={1}>
                <HStack>
                  <CalendarIcon color="#20603d" boxSize={5} />
                  <Text fontWeight="bold" fontSize={{ base: "md", md: "lg" }} color="#20603d">
                    Sunday, 9th November 2025
                  </Text>
                </HStack>
                <HStack>
                  <Text fontSize="lg">🏛️</Text>
                  <Text 
                    fontWeight="semibold" 
                    fontSize={{ base: "sm", md: "lg" }} 
                    color="gray.700"
                    whiteSpace="normal"
                    lineHeight="1.3"
                    textAlign={{ base: "center", md: "left" }}
                  >
                    Hare Krishna Vaikuntam Temple, IIM Road, Gambheeram
                  </Text>
                </HStack>
              </VStack>
              
              <VStack align="center" spacing={2} minW="150px">
                <Text fontWeight="bold" fontSize="md" color="#20603d">
                  Registration Fee
                </Text>
                {formData.collegeOrWorking === "College" ? (
                  <VStack spacing={1}>
                    <Text fontWeight="black" fontSize="2xl" color="#388e3c">
                      ₹99
                    </Text>
                    <Text fontWeight="bold" fontSize="xs" color="#388e3c" textAlign="center">
                      Student Rate
                    </Text>
                  </VStack>
                ) : formData.collegeOrWorking === "Working" ? (
                  <VStack spacing={1}>
                    <Text fontWeight="black" fontSize="2xl" color="#d72660">
                      ₹1200
                    </Text>
                    <Text fontWeight="bold" fontSize="xs" color="#d72660" textAlign="center">
                      Professional Rate
                    </Text>
                  </VStack>
                ) : (
                  <VStack spacing={1}>
                    <Text fontWeight="black" fontSize="xl" color="#20603d">
                      ₹99 / ₹1200
                    </Text>
                    <Text fontWeight="bold" fontSize="xs" color="#20603d" textAlign="center">
                     College Student / others
                    </Text>
                  </VStack>
                )}
                <Text fontWeight="bold" fontSize="xs" color="#20603d" textAlign="center">
                  Age: 16-31 years
                </Text>
              </VStack>
            </Stack>
          </CardBody>
        </Card>
        
      
        <Card
          bg="rgba(255,255,255,0.94)"
          boxShadow="0 4px 24px 0 rgba(32,96,61,0.11)"
          borderRadius="2xl"
          mb={8}
        >
          <CardBody>
            <Divider my={2} />
            <SimpleGrid 
              columns={{ base: 2, md: 4 }} 
              spacing={{ base: 4, md: 6 }}
              mt={3}
              alignItems="center"
              justifyItems="center"
            >
              <VStack spacing={2}>
                <CalendarIcon color="#20603d" boxSize={{ base: 6, md: 7 }} />
                <Text 
                  fontWeight="medium" 
                  fontSize={{ base: "xs", md: "sm" }} 
                  color="#20603d"
                  textAlign="center"
                  lineHeight="1.2"
                >
                  Spiritual Talk
                </Text>
              </VStack>
              <VStack spacing={2}>
                <Text fontSize={{ base: "xl", md: "2xl" }}>🎮</Text>
                <Text 
                  fontWeight="medium" 
                  fontSize={{ base: "xs", md: "sm" }} 
                  color="#20603d"
                  textAlign="center"
                  lineHeight="1.2"
                >
                  Games
                </Text>
              </VStack>
              <VStack spacing={2}>
                <Text fontSize={{ base: "xl", md: "2xl" }}>💃</Text>
                <Text 
                  fontWeight="medium" 
                  fontSize={{ base: "xs", md: "sm" }} 
                  color="#20603d"
                  textAlign="center"
                  lineHeight="1.2"
                >
                  Ecstatic Dances
                </Text>
              </VStack>
              <VStack spacing={2}>
                <Text fontSize={{ base: "xl", md: "2xl" }}>🍛</Text>
                <Text 
                  fontWeight="medium" 
                  fontSize={{ base: "xs", md: "sm" }} 
                  color="#20603d"
                  textAlign="center"
                  lineHeight="1.2"
                >
                  Delicious Prasadam
                </Text>
              </VStack>
            </SimpleGrid>
          </CardBody>
        </Card>
        <Card
          bg="rgba(255,255,255,0.99)"
          boxShadow="0 4px 24px 0 rgba(32,96,61,0.13)"
          borderRadius="2xl"
        >
          <CardHeader textAlign="center">
            <Heading size="lg" color="#20603d">Vanabhojanam Registration Form</Heading>
            <Text color="gray.600" mt={2}>
              <Text as="span" color="red.500">*</Text> indicates required
            </Text>
          </CardHeader>
          <CardBody>
            <VStack spacing={6} align="stretch">
            
              <FormControl isInvalid={!!errors.name}>
                <FormLabel color="#20603d">Name <Text as="span" color="red.500">*</Text></FormLabel>
                <Input
                  placeholder="Your full name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  borderWidth={2}
                  _focus={{ borderColor: "#20603d" }}
                  bg="rgba(255,255,255,0.93)"
                />
                <FormErrorMessage>{errors.name}</FormErrorMessage>
              </FormControl>
              <FormControl isInvalid={!!errors.dob}>
                <FormLabel color="#20603d">Date of Birth <Text as="span" color="red.500">*</Text></FormLabel>
                <Input
                  type="date"
                  value={formData.dob}
                  onChange={(e) => handleInputChange("dob", e.target.value)}
                  borderWidth={2}
                  _focus={{ borderColor: "#20603d" }}
                  bg="rgba(255,255,255,0.93)"
                />
                <FormErrorMessage>{errors.dob}</FormErrorMessage>
              </FormControl>
              <FormControl isInvalid={!!errors.whatsappNumber}>
                <FormLabel color="#20603d">WhatsApp Number <Text as="span" color="red.500">*</Text></FormLabel>
                <InputGroup>
                  <InputLeftAddon bg="gray.100">+91</InputLeftAddon>
                  <Input
                    type="tel"
                    placeholder="Your WhatsApp number"
                    value={formData.whatsappNumber}
                    onChange={(e) => handleInputChange("whatsappNumber", e.target.value)}
                    borderWidth={2}
                    _focus={{ borderColor: "#20603d" }}
                    bg="rgba(255,255,255,0.93)"
                  />
                </InputGroup>
                <FormErrorMessage>{errors.whatsappNumber}</FormErrorMessage>
              </FormControl>
              <FormControl isInvalid={!!errors.email}>
                <FormLabel color="#20603d">Email <Text as="span" color="red.500">*</Text></FormLabel>
                <Input
                  type="email"
                  placeholder="your.email@example.com"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  borderWidth={2}
                  _focus={{ borderColor: "#20603d" }}
                  bg="rgba(255,255,255,0.93)"
                />
                <FormErrorMessage>{errors.email}</FormErrorMessage>
              </FormControl>
              <FormControl isInvalid={!!errors.gender}>
                <FormLabel color="#20603d">Gender <Text as="span" color="red.500">*</Text></FormLabel>
                <RadioGroup value={formData.gender} onChange={(val) => handleInputChange("gender", val)}>
                  <HStack spacing={6}>
                    <Radio value="Male" colorScheme="green">Male</Radio>
                    <Radio value="Female" colorScheme="green">Female</Radio>
                  </HStack>
                </RadioGroup>
                <FormErrorMessage>{errors.gender}</FormErrorMessage>
              </FormControl>
              <FormControl isInvalid={!!errors.collegeOrWorking}>
                <FormLabel color="#20603d">Are you a College Student or Others? <Text as="span" color="red.500">*</Text></FormLabel>
                <ChakraSelect
                  value={formData.collegeOrWorking}
                  onChange={(e) => handleInputChange("collegeOrWorking", e.target.value)}
                  borderWidth={2}
                  _focus={{ borderColor: "#20603d" }}
                  bg="rgba(255,255,255,0.93)"
                >
                  <option value="">--Select--</option>
                  <option value="College">College Student</option>
                  <option value="Working">others</option>
                </ChakraSelect>
                <FormErrorMessage>{errors.collegeOrWorking}</FormErrorMessage>
                {formData.collegeOrWorking === "College" && (
                  <Box mt={2} p={3} bg="green.50" borderRadius="md" border="1px solid" borderColor="green.200">
                    <HStack>
                      <Text fontSize="sm">ℹ️</Text>
                      <Text fontSize="sm" color="#20603d" fontWeight="medium">
                        <Text as="span" fontWeight="bold">Note:</Text> Student ID card is mandatory for verification at the event.
                        Registration fee: <Text as="span" fontWeight="bold" color="#388e3c">₹99</Text>
                      </Text>
                    </HStack>
                  </Box>
                )}
                {formData.collegeOrWorking === "Working" && (
                  <Box mt={2} p={3} bg="orange.50" borderRadius="md" border="1px solid" borderColor="orange.200">
                    <HStack>
                      <Text fontSize="sm">💼</Text>
                      <Text fontSize="sm" color="#d72660" fontWeight="medium">
                        Registration fee for working professionals: <Text as="span" fontWeight="bold" color="#d72660">₹1200</Text>
                      </Text>
                    </HStack>
                  </Box>
                )}
              </FormControl>
              {formData.collegeOrWorking === "Working" && (
                <FormControl isInvalid={!!errors.companyName}>
                  <FormLabel color="#20603d">Company Name <Text as="span" color="red.500">*</Text></FormLabel>
                  <Input
                    placeholder="Your company name"
                    value={formData.companyName}
                    onChange={(e) => handleInputChange("companyName", e.target.value)}
                    borderWidth={2}
                    _focus={{ borderColor: "#20603d" }}
                    bg="rgba(255,255,255,0.93)"
                  />
                  <FormErrorMessage>{errors.companyName}</FormErrorMessage>
                </FormControl>
              )}
              {formData.collegeOrWorking === "College" && (
                <FormControl isInvalid={!!errors.college}>
                  <FormLabel color="#20603d">College Name <Text as="span" color="red.500">*</Text></FormLabel>
                  <Box>
                    <Select
                      options={collegeOptions}
                      value={collegeOptions.find((opt) => opt.value === formData.college)}
                      onChange={(option) => {
                        handleInputChange("college", option?.value || "");
                      }}
                      placeholder="Select your college"
                      isClearable
                      styles={customSelectStyles}
                    />
                  </Box>
                  {formData.college === "Other College" && (
                    <Input
                      mt={2}
                      placeholder="Enter your college name"
                      value={otherCollege}
                      onChange={(e) => setOtherCollege(e.target.value)}
                      borderWidth={2}
                      _focus={{ borderColor: "#20603d" }}
                      bg="rgba(255,255,255,0.93)"
                    />
                  )}
                  <FormErrorMessage>{errors.college}</FormErrorMessage>
                </FormControl>
              )}
              {formData.collegeOrWorking === "College" && (
                <FormControl isInvalid={!!errors.course}>
                  <FormLabel color="#20603d">Course <Text as="span" color="red.500">*</Text></FormLabel>
                  <Input
                    placeholder="e.g., B.Tech, MBA"
                    value={formData.course}
                    onChange={(e) => handleInputChange("course", e.target.value)}
                    borderWidth={2}
                    _focus={{ borderColor: "#20603d" }}
                    bg="rgba(255,255,255,0.93)"
                  />
                  <FormErrorMessage>{errors.course}</FormErrorMessage>
                </FormControl>
              )}
              {formData.collegeOrWorking === "College" && (
                <FormControl isInvalid={!!errors.year}>
                  <FormLabel color="#20603d">Year <Text as="span" color="red.500">*</Text></FormLabel>
                  <ChakraSelect
                    value={formData.year}
                    onChange={(e) => handleInputChange("year", e.target.value)}
                    borderWidth={2}
                    _focus={{ borderColor: "#20603d" }}
                    bg="rgba(255,255,255,0.93)"
                  >
                    <option value="">--Select Year--</option>
                    <option value="1">1st</option>
                    <option value="2">2nd</option>
                    <option value="3">3rd</option>
                    <option value="4">4th</option>
                  </ChakraSelect>
                  <FormErrorMessage>{errors.year}</FormErrorMessage>
                </FormControl>
              )}
              {formData.collegeOrWorking === "College" && (
                <FormControl isInvalid={!!errors.studentIdCard}>
                  <FormLabel color="#20603d">Student ID Card <Text as="span" color="red.500">*</Text></FormLabel>
                  <Text fontSize="sm" color="gray.600" mb={2}>
                    Please upload a clear photo of your student ID card (JPG, PNG, WebP - Max 5MB)
                  </Text>
                  <Input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={handleFileChange}
                    borderWidth={2}
                    _focus={{ borderColor: "#20603d" }}
                    bg="rgba(255,255,255,0.93)"
                    p={1}
                  />
                  <FormErrorMessage>{errors.studentIdCard}</FormErrorMessage>
                  
                  {formData.studentIdCardPreview && (
                    <Box mt={3}>
                      <Text fontSize="sm" color="gray.700" mb={2}>Preview:</Text>
                      <Flex align="center" gap={3}>
                        <Image
                          src={formData.studentIdCardPreview}
                          alt="ID Card Preview"
                          maxH="120px"
                          maxW="200px"
                          objectFit="cover"
                          border="1px solid #e2e8f0"
                          borderRadius="md"
                        />
                        <Button
                          size="sm"
                          colorScheme="red"
                          variant="outline"
                          onClick={removeFile}
                        >
                          Remove
                        </Button>
                      </Flex>
                    </Box>
                  )}
                </FormControl>
              )}
              <Button
                onClick={handlePayment}
                isLoading={isSubmitting}
                loadingText="Processing"
                bgGradient="linear(to-r, #20603d, #43a047)"
                color="white"
                fontWeight="semibold"
                size="lg"
                py={6}
                w="full"
                _hover={{ transform: "translateY(-2px)", boxShadow: "lg", bg: "#20603d" }}
                transition="all 0.2s"
                disabled={isSubmitting}
                type="button"
              >
                {formData.collegeOrWorking === "College"
                  ? "Register Now for ₹99 (Student)"
                  : formData.collegeOrWorking === "Working"
                  ? "Register Now for ₹1200 (Professional)"
                  : "Register Now"
                }
              </Button>
              <Text textAlign="center" fontSize="md" mt={4} color="#20603d">
                For any queries, contact us at <Text as="a" href="mailto:krishnapulse@gmail.com" textDecoration="underline">krishnapulse@gmail.com</Text>
              </Text>
            </VStack>
          </CardBody>
        </Card>
        <Box mt={8} textAlign="center">
          <Text fontSize="md" color="#20603d" fontWeight="semibold">
            Hare Krishna Hare Krishna Krishna Krishna Hare Hare Hare Rama Hare Rama Rama Rama Hare Hare
          </Text>
        </Box>
      </Container>
    </Box>
  );
};

export default Main;