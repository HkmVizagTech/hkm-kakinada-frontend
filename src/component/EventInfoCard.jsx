import React from "react";
import {
  Box,
  Flex,
  Text,
  VStack,
  Divider,
  useBreakpointValue,
  HStack,
} from "@chakra-ui/react";
import { CalendarIcon } from "@chakra-ui/icons";

const EventInfoCard = () => {
  const iconBoxSize = useBreakpointValue({ base: 7, md: 8 });

  return (
    <Box
      bg="white"
      borderRadius="2xl"
      boxShadow="md"
      px={{ base: 4, md: 8 }}
      py={{ base: 4, md: 6 }}
      width={{ base: "100%", md: "70%" }}
      mx="auto"
      mb={6}
      display="flex"
      flexDirection="column"
      alignItems="center"
    >
      <VStack spacing={2} align="stretch" mb={2} w="100%">
        <Box
          bg="#f7d7d7"
          px={4}
          py={2}
          borderRadius="lg"
          fontWeight="bold"
          fontSize={{ base: "sm", md: "md" }}
          color="#a94442"
          textAlign="left"
        >
          Date: <span style={{ fontWeight: "normal" }}>Sunday, 9th November 2025</span>
        </Box>
        <Box
          bg="#e0f5e6"
          px={4}
          py={2}
          borderRadius="lg"
          fontWeight="bold"
          fontSize={{ base: "sm", md: "md" }}
          color="#388e3c"
          textAlign="left"
        >
          Venue: <span style={{ fontWeight: "normal" }}>HK Vaikuntham Temple, Gambhiram</span>
        </Box>
        <Box
          bg="#e3d6f5"
          px={4}
          py={2}
          borderRadius="lg"
          fontWeight="bold"
          fontSize={{ base: "sm", md: "md" }}
          color="#6a38a2"
          textAlign="left"
        >
          Registration Fee: <span style={{ color: "#d72660", fontWeight: "bold" }}>₹99</span>
        </Box>
        <Text fontWeight="semibold" fontSize={{ base: "sm", md: "md" }} color="#6a38a2" pl={1}>
          Age Limit: <span style={{ fontWeight: "bold" }}>16 - 31 years only</span>
        </Text>
      </VStack>
      <Divider my={2} />
      <Flex
        justify="space-between"
        align="flex-end"
        mt={2}
        width="100%"
        flexWrap="wrap"
      >
        <VStack minW="20" spacing={1}>
          <CalendarIcon boxSize={iconBoxSize} color="#6a38a2" />
          <Text fontSize="xs" fontWeight="semibold" color="#6a38a2">
            Spiritual Talk
          </Text>
        </VStack>
        <VStack minW="20" spacing={1}>
          <Box fontSize="2xl" aria-label="Games" role="img">
            🎮
          </Box>
          <Text fontSize="xs" fontWeight="semibold" color="#6a38a2">
            Games
          </Text>
        </VStack>
        <VStack minW="20" spacing={1}>
          <Box fontSize="2xl" aria-label="Ecstatic Dances" role="img">
            💃
          </Box>
          <Text fontSize="xs" fontWeight="semibold" color="#6a38a2">
            Ecstatic Dances
          </Text>
        </VStack>
        <VStack minW="20" spacing={1}>
          <Box fontSize="2xl" aria-label="Delicious Prasadam" role="img">
            🍛
          </Box>
          <Text fontSize="xs" fontWeight="semibold" color="#6a38a2">
            Delicious Prasadam
          </Text>
        </VStack>
      </Flex>
    </Box>
  );
};

export default EventInfoCard;