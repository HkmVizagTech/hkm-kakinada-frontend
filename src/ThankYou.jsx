import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Center,
  Flex,
  Heading,
  Icon,
  Image,
  Link,
  Stack,
  Text,
  VStack,
  Spinner,
  HStack,
  SimpleGrid,
} from '@chakra-ui/react';
import {
  CheckCircle,
  Calendar,
  MapPin,
  Phone,
  Mail,
  ArrowLeft,
} from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import vanabhojanamLogo from './component/newLogo.png';
import natureBg from './component/vanabhojanam-nature.jpg'; 

export default function ThankYouPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [status, setStatus] = useState('loading');
  const [candidate, setCandidate] = useState(null);

  const checkPaymentStatus = async (showLoading = true) => {
    if (showLoading) setStatus('loading');
    
    try {
      console.log(`🔍 Checking payment status for ID: ${id}...`);
      const res = await axios.get(`https://hkm-kakinada-882278565284.asia-south1.run.app/users/verify-payment/${id}`);
      
      if (res.data.success && res.data.candidate) {
        console.log("✅ Payment verification successful:", res.data.candidate);
        setCandidate(res.data.candidate);
        
     
        if (res.data.candidate.paymentStatus === 'Paid') {
          setStatus('success');
          return 'success';
        } else if (res.data.candidate.paymentStatus === 'Failed') {
          setStatus('failed');
          return 'failed';
        } else {
          setStatus('pending');
          return 'pending';
        }
      } else {
        setStatus('invalid');
        return 'invalid';
      }
    } catch (err) {
      console.error("❌ Payment verification error:", err);
      setStatus('error');
      return 'error';
    }
  };

  useEffect(() => {
    let attempts = 0;
    const maxAttempts = 10; 
    let pollInterval;

    const verifyPaymentWithPolling = async () => {
      const result = await checkPaymentStatus(attempts === 0);
      
      if (result === 'success' || result === 'failed') {
        if (pollInterval) clearInterval(pollInterval);
        return;
      }
      
      attempts++;
      if (attempts >= maxAttempts) {
        if (pollInterval) clearInterval(pollInterval);
        return;
      }
    };

    if (id) {
    
      verifyPaymentWithPolling();
      
      
      pollInterval = setInterval(verifyPaymentWithPolling, 3000);
    }

  
    return () => {
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [id]);

  if (status === 'loading') {
    return (
      <Center 
        minH="100vh" 
        bgImage={`url(${natureBg})`}
        bgAttachment="fixed"
        bgSize="cover"
        bgPosition="center"
        style={{
          backgroundColor: "#e9f8ef",
          backgroundBlendMode: "overlay",
        }}
      >
        <Spinner size="xl" color="teal.500" />
      </Center>
    );
  }

  if (status === 'pending') {
    return (
      <Box 
        minH="100vh" 
        bgImage={`url(${natureBg})`}
        bgAttachment="fixed"
        bgSize="cover"
        bgPosition="center"
        style={{
          backgroundColor: "#e9f8ef",
          backgroundBlendMode: "overlay",
        }}
        py={8}
        px={4}
      >
        <Box textAlign="center" mt={20} p={6}>
          <VStack spacing={4}>
          <Spinner size="xl" color="orange.500" />
          <Heading size="lg" color="orange.500">
            Payment Processing
          </Heading>
          <Text>
            Your payment is being processed. This usually takes 10-20 seconds.
          </Text>
          <Text fontSize="sm" color="gray.600">
            Payment ID: {id}
          </Text>
          <Text fontSize="sm" color="gray.500">
            Please wait... We're automatically checking your payment status.
          </Text>
          <Button colorScheme="teal" variant="ghost" onClick={() => navigate('/')}>
            Register Another Person
          </Button>
          <Text fontSize="xs" color="gray.400">
            Need help? Contact support with your payment ID above.
          </Text>
        </VStack>
        </Box>
      </Box>
    );
  }

  if (status === 'failed') {
    return (
      <Box 
        minH="100vh" 
        bgImage={`url(${natureBg})`}
        bgAttachment="fixed"
        bgSize="cover"
        bgPosition="center"
        style={{
          backgroundColor: "#e9f8ef",
          backgroundBlendMode: "overlay",
        }}
        py={8}
        px={4}
      >
        <Box textAlign="center" mt={20} p={6}>
          <VStack spacing={4}>
          <Text fontSize="6xl">❌</Text>
          <Heading size="lg" color="red.500">
            Payment Failed
          </Heading>
          <Text>
            Your payment was not successful. This could be due to payment cancellation, 
            insufficient funds, or a technical issue.
          </Text>
          {candidate?.paymentFailureReason && (
            <Text fontSize="sm" color="gray.600" p={3} bg="gray.100" borderRadius="md">
              Reason: {candidate.paymentFailureReason}
            </Text>
          )}
          <Text fontSize="sm" color="gray.600">
            Payment ID: {id}
          </Text>
          <VStack spacing={3}>
            <Button colorScheme="teal" onClick={() => navigate('/')}>
              Try Registration Again
            </Button>
            <Button colorScheme="gray" variant="outline" onClick={() => window.location.href = 'mailto:krishnapulse@gmail.com'}>
              Contact Support
            </Button>
          </VStack>
        </VStack>
        </Box>
      </Box>
    );
  }

  if (status === 'invalid' || status === 'error') {
    return (
      <Box 
        minH="100vh" 
        bgImage={`url(${natureBg})`}
        bgAttachment="fixed"
        bgSize="cover"
        bgPosition="center"
        style={{
          backgroundColor: "#e9f8ef",
          backgroundBlendMode: "overlay",
        }}
        py={8}
        px={4}
      >
        <Box textAlign="center" mt={20} p={6}>
          <VStack spacing={4}>
          <Heading size="lg" color={status === 'invalid' ? 'red.500' : 'orange.500'}>
            {status === 'invalid' ? 'Invalid Payment' : 'Server Error'}
          </Heading>
          <Text>
            {status === 'invalid'
              ? "This payment ID is not valid or doesn't match any registration."
              : 'Something went wrong while verifying your payment. Please try again later.'}
          </Text>
          <Button colorScheme="teal" onClick={() => navigate('/')}>
            Go Back to Home
          </Button>
        </VStack>
        </Box>
      </Box>
    );
  }

  return (
    <Box 
      minH="100vh" 
      bgImage={`url(${natureBg})`}
      bgAttachment="fixed"
      bgSize="cover"
      bgPosition="center"
      py={{ base: 2, md: 8 }}
      px={4}
      style={{
        backgroundColor: "#e9f8ef",
        backgroundBlendMode: "overlay",
      }}
    >
      <Box maxW="2xl" mx="auto">
        <Flex
          align="center"
          justify="center"
          gap={4}
          mb={8}
          direction="row"
          textAlign="left"
          flexWrap="wrap"
        >
          <Box position="relative" minW="96px">
            <Image
              src={vanabhojanamLogo}
              alt="Vanabhojanam Youth Festival Logo"
              boxSize="96px"
              rounded="full"
              shadow="lg"
            />
            <Center
              position="absolute"
              top="-2"
              right="-2"
              bg="green.500"
              rounded="full"
              p={1}
            >
              <Icon as={CheckCircle} w={6} h={6} color="white" />
            </Center>
          </Box>
          <Box ml={2}>
            <Heading size="lg" color="black" fontWeight="bold" lineHeight="short">
              VANABHOJANAM <br /> Youth Festival
            </Heading>
            <Text fontSize="md" fontWeight="semibold" mt={2} color="gray.700">
              A Day With Nature & Divine
            </Text>
          </Box>
        </Flex>

        <Box
          bgGradient="linear(to-r, #20603d, #43a047)"
          color="white"
          p={6}
          rounded="lg"
          shadow="xl"
          textAlign="center"
          mb={6}
        >
          <Heading fontSize="2xl" mb={2}>🎉 Registration Successful!</Heading>
          <Text fontSize="lg" opacity={0.9}>
            Welcome to Vanabhojanam Youth Festival 2025
          </Text>
        </Box>

        {candidate && (
          <Box bg="white" p={4} rounded="lg" shadow="md" mb={6}>
            <Text fontWeight="bold" color="#20603d" mb={1}>
              Thank you, {candidate.name}!
            </Text>
            <Text fontSize="sm" color="gray.600">
              We've received your payment of ₹{candidate.paymentAmount || 'N/A'}
            </Text>
            <Text fontSize="sm" color="gray.500">Payment ID: {candidate.paymentId || id}</Text>
          </Box>
        )}

        <Box bg="white" p={6} rounded="lg" shadow="lg" mb={6}>
          <Stack spacing={6}>
            <Box textAlign="center">
              <Heading size="md" color="#20603d" mb={2}>
                Your Registration is Confirmed!
              </Heading>
            </Box>

            <VStack spacing={4} align="stretch">
              <Flex align="center" gap={3} p={3} bg="green.50" rounded="lg">
                <Icon as={Calendar} w={5} h={5} color="#20603d" />
                <Box>
                  <Text fontWeight="semibold">Event Date</Text>
                  <Text fontSize="sm" color="gray.600">Sunday, 16th November 2025</Text>
                </Box>
              </Flex>

              <Flex align="center" gap={3} p={3} bg="green.50" rounded="lg">
                <Icon as={MapPin} w={5} h={5} color="#20603d" />
                <Box>
                  <Text fontWeight="semibold">Venue</Text>
                  <Text fontSize="sm" color="gray.600">Ratna siri Food Court & Resort,NTR Beach park,vakalapudi,Kakinada</Text>
                </Box>
              </Flex>

              <Flex align="center" gap={3} p={3} bg="green.50" rounded="lg">
                <Icon as={Phone} w={5} h={5} color="#20603d" />
                <Box>
                  <Text fontWeight="semibold">WhatsApp Updates</Text>
                  <Text fontSize="sm" color="gray.600">
                    You'll receive event updates and group links on WhatsApp
                  </Text>
                </Box>
              </Flex>

              <Flex align="center" gap={3} p={3} bg="green.50" rounded="lg">
                <Box>
                  <Text fontWeight="semibold" color="#20603d">Highlights</Text>
                  <SimpleGrid columns={{ base: 1, sm: 2, md: 4 }} spacing={3} mt={2}>
                    <Box textAlign="center" fontSize="sm">
                      <Text fontWeight="semibold">Spiritual Talk</Text>
                    </Box>
                    <Box textAlign="center" fontSize="sm">
                      <Text fontWeight="semibold">Games</Text>
                    </Box>
                    <Box textAlign="center" fontSize="sm">
                      <Text fontWeight="semibold">Ecstatic Dances</Text>
                    </Box>
                    <Box textAlign="center" fontSize="sm">
                      <Text fontWeight="semibold">Delicious Prasadam</Text>
                    </Box>
                  </SimpleGrid>
                </Box>
              </Flex>
            </VStack>

            <Box textAlign="center" p={4} bg="gray.100" rounded="lg">
              <Text fontSize="sm" fontWeight="semibold" mb={2}>Need Help?</Text>
              <HStack justify="center" spacing={4} fontSize="sm">
                <Link
                  href="mailto:gdhd@hkmvizag.org"
                  color="#20603d"
                  display="flex"
                  alignItems="center"
                  gap={1}
                >
                  <Icon as={Mail} w={4} h={4} />
                  Email Support
                </Link>
                <Link
                  href="tel:+919876543210"
                  color="#20603d"
                  display="flex"
                  alignItems="center"
                  gap={1}
                >
                  <Icon as={Phone} w={4} h={4} />
                  Call Us
                </Link>
              </HStack>
            </Box>
          </Stack>
        </Box>

        <Center>
          <Button
            onClick={() => navigate('/')}
            variant="ghost"
            leftIcon={<ArrowLeft />}
          >
            Register Another Participant
          </Button>
        </Center>

        <Box
          textAlign="center"
          mt={8}
          p={4}
          bgGradient="linear(to-r, #20603d, #43a047)"
          color="white"
          rounded="lg"
        >
          <Text fontWeight="semibold" mb={1}>🙏 Hare Krishna! 🙏</Text>
          <Text fontSize="sm" opacity={0.9}>
            We're excited for a day with nature & divine!
          </Text>
        </Box>
      </Box>
    </Box>
  );
}