import React, { useEffect, useState } from "react";
import {
  Box,
  Heading,
  Select,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Button,
  Spinner,
  Input,
  Flex,
  FormControl,
  FormLabel,
  Tag,
  Tooltip,
  Text,
  Badge,
  chakra,
  HStack,
  VStack,
  Image,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useDisclosure,
  Divider,
  Grid,
  GridItem,
  Icon,
  Avatar,
  useToast,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
} from "@chakra-ui/react";
import { 
  CheckCircleIcon, 
  WarningIcon, 
  TimeIcon, 
  PhoneIcon, 
  DownloadIcon,
  EmailIcon,
  CalendarIcon,
  ViewIcon,
  CheckIcon,
  CloseIcon,
  RepeatIcon,
} from "@chakra-ui/icons";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { useNavigate } from "react-router-dom";
import Layout from "./component/Layout";

const statusColors = {
  Paid: "green",
  Pending: "yellow",
  Failed: "red",
  Refunded: "orange",
};

const CandidateExport = () => {
  const [data, setData] = useState([]);
  const [filteredCollege, setFilteredCollege] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [filteredPaymentStatus, setFilteredPaymentStatus] = useState("");
  const [search, setSearch] = useState("");
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [actionLoading, setActionLoading] = useState({});

  const navigate = useNavigate();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { 
    isOpen: isAlertOpen, 
    onOpen: onAlertOpen, 
    onClose: onAlertClose 
  } = useDisclosure();
  const [alertAction, setAlertAction] = useState(null);
  const cancelRef = React.useRef();
  const toast = useToast();

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem("token");
      
      setLoading(true);
      try {
        const response = await fetch("https://hkm-vanabhojan-backend-882278565284.europe-west1.run.app/users", {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (response.status === 401 || response.status === 403) {
          
          localStorage.removeItem("token");
          localStorage.removeItem("role");
          navigate("/admin/login");
          return;
        }

        const data = await response.json();
        console.log("API Response:", data);
        const candidates = data.candidates || data;
        
        if (Array.isArray(candidates)) {
          setData(candidates);
        } else {
          console.error("API response is not an array:", data);
          setData([]); 
        }
        setLoading(false);
      } catch (err) {
        console.error("Failed to fetch data", err);
        setData([]); 
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  const filterByDate = (candidate) => {
    if (!startDate && !endDate) return true;
    const candidateDate = new Date(candidate.registrationDate);
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(new Date(endDate).setHours(23, 59, 59, 999)) : null;
    if (start && candidateDate < start) return false;
    if (end && candidateDate > end) return false;
    return true;
  };

  const filteredData = (Array.isArray(data) ? data : []).filter((c) => {
    const collegeMatch = filteredCollege ? c.college === filteredCollege : true;
    const dateMatch = filterByDate(c);
    const paymentMatch = filteredPaymentStatus ? c.paymentStatus === filteredPaymentStatus : true;
    const searchMatch =
      search.length < 2 ||
      [c.name, c.email, c.whatsappNumber, c.college, c.companyName]
        .join(" ")
        .toLowerCase()
        .includes(search.toLowerCase());
    return collegeMatch && dateMatch && paymentMatch && searchMatch;
  });

  const uniqueColleges = [...new Set((Array.isArray(data) ? data : []).map((c) => c.college).filter(Boolean))];

  const handleCandidateClick = (candidate) => {
    setSelectedCandidate(candidate);
    onOpen();
  };

  const handleAction = async (action, candidateId) => {
    setAlertAction({ action, candidateId });
    onAlertOpen();
  };

  const confirmAction = async () => {
    if (!alertAction) return;
    
    const { action, candidateId } = alertAction;
    setActionLoading(prev => ({ ...prev, [candidateId]: true }));
    
    try {
      const token = localStorage.getItem("token");
      const endpoint = `https://hkm-vanabhojan-backend-882278565284.europe-west1.run.app/users/${candidateId}`;
      
      let updateData = {};
      switch (action) {
        case 'accept':
          updateData = { paymentStatus: 'Paid', adminAction: 'Accepted' };
          break;
        case 'reject':
          updateData = { paymentStatus: 'Failed', adminAction: 'Rejected' };
          break;
        case 'refund':
          updateData = { paymentStatus: 'Refunded', adminAction: 'Refunded' };
          break;
      }

      const response = await fetch(endpoint, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        // Update local data
        setData(prevData => 
          prevData.map(candidate => 
            candidate._id === candidateId 
              ? { ...candidate, ...updateData }
              : candidate
          )
        );
        
        // Update selected candidate if it's the same one
        if (selectedCandidate?._id === candidateId) {
          setSelectedCandidate(prev => ({ ...prev, ...updateData }));
        }

        toast({
          title: `Candidate ${action}ed successfully`,
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      } else {
        throw new Error(`Failed to ${action} candidate`);
      }
    } catch (error) {
      toast({
        title: `Failed to ${alertAction.action} candidate`,
        description: error.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setActionLoading(prev => ({ ...prev, [candidateId]: false }));
      onAlertClose();
      setAlertAction(null);
    }
  };

  const exportToExcel = () => {
    const dataToExport = Array.isArray(filteredData) ? filteredData : [];
    const worksheet = XLSX.utils.json_to_sheet(
      dataToExport.map((row) => ({
        "S.No": row.serialNo,
        Name: row.name,
        Gender: row.gender,
        Email: row.email,
        College: row.college,
        "Company Name": row.companyName,
        Course: row.course,
        "College/Working": row.collegeOrWorking,
        Year: row.year,
        Phone: row.whatsappNumber,
        "Order ID": row.orderId,
        "Payment Amount": row.paymentAmount,
        "Payment Date": row.paymentDate
          ? new Date(row.paymentDate).toLocaleString()
          : "",
        "Payment Status": row.paymentStatus,
        "Payment Method": row.paymentMethod,
        "Registration Date": row.registrationDate
          ? new Date(row.registrationDate).toLocaleString()
          : "",
        "Student ID Card URL": row.studentIdCardUrl || "N/A",
        Attendance: row.attendance ? "Yes" : "No",
        "Receipt No": row.receipt,
      }))
    );
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Candidates");
    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });

    const file = new Blob([excelBuffer], {
      type: "application/octet-stream",
    });
    saveAs(file, "candidates.xlsx");
  };

  if (loading)
    return (
      <Layout>
        <Flex justify="center" align="center" minH="70vh">
          <Spinner size="xl" />
        </Flex>
      </Layout>
    );

  return (
    <Layout>
      <Box px={{ base: 2, md: 8 }} py={6} maxW="100vw" minH="100vh" bg="gray.50">
        <Flex justify="space-between" align="center" mb={6} wrap="wrap">
          <Heading size="lg" color="teal.700">
            Candidate List
          </Heading>
          <Button
            colorScheme="teal"
            variant="outline"
            leftIcon={<TimeIcon />}
            onClick={() => navigate("/admin/attendance")}
          >
            Go to Attendance
          </Button>
        </Flex>

        <Box
          mb={4}
          overflowX="auto"
          py={2}
          px={2}
          bg="white"
          borderRadius="md"
          boxShadow="sm"
        >
          <Flex gap={4} align="flex-end" wrap="nowrap" minW="600px">
            <FormControl w="180px">
              <FormLabel fontSize="sm">College</FormLabel>
              <Select
                placeholder="Select College"
                onChange={(e) => setFilteredCollege(e.target.value)}
                value={filteredCollege}
                bg="gray.50"
                size="sm"
              >
                {uniqueColleges.map((college, i) => (
                  <option key={i} value={college}>
                    {college}
                  </option>
                ))}
              </Select>
            </FormControl>
            <FormControl w="150px">
              <FormLabel fontSize="sm">Payment</FormLabel>
              <Select
                placeholder="Status"
                value={filteredPaymentStatus}
                onChange={(e) => setFilteredPaymentStatus(e.target.value)}
                bg="gray.50"
                size="sm"
              >
                <option value="Paid">Paid</option>
                <option value="Pending">Pending</option>
                <option value="Failed">Failed</option>
              </Select>
            </FormControl>
            <FormControl w="150px">
              <FormLabel fontSize="sm">From</FormLabel>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                bg="gray.50"
                size="sm"
              />
            </FormControl>
            <FormControl w="150px">
              <FormLabel fontSize="sm">To</FormLabel>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                bg="gray.50"
                size="sm"
              />
            </FormControl>
            <FormControl w="220px">
              <FormLabel fontSize="sm">Search</FormLabel>
              <Input
                placeholder="Name, email, phone, college..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                bg="gray.50"
                size="sm"
              />
            </FormControl>
            <Button
              colorScheme="teal"
              leftIcon={<DownloadIcon />}
              onClick={exportToExcel}
              variant="solid"
              size="sm"
              minW="140px"
            >
              Export to Excel
            </Button>
          </Flex>
        </Box>

        <HStack mb={4}>
          <Badge colorScheme="purple" fontSize="lg">
            Total Records: {filteredData?.length || 0}
          </Badge>
          <Badge colorScheme="green" fontSize="md">
            Paid: {(Array.isArray(filteredData) ? filteredData : []).filter((c) => c.paymentStatus === "Paid").length}
          </Badge>
          <Badge colorScheme="yellow" fontSize="md">
            Pending: {(Array.isArray(filteredData) ? filteredData : []).filter((c) => c.paymentStatus === "Pending").length}
          </Badge>
          <Badge colorScheme="red" fontSize="md">
            Failed: {(Array.isArray(filteredData) ? filteredData : []).filter((c) => c.paymentStatus === "Failed").length}
          </Badge>
        </HStack>

        <Box overflowX="auto" rounded="md" boxShadow="md" bg="white" p={2}>
          <Box mb={2} p={2} bg="blue.50" borderRadius="md" border="1px solid" borderColor="blue.200">
            <HStack>
              <Icon as={ViewIcon} color="blue.500" boxSize={4} />
              <Text fontSize="sm" color="blue.700" fontWeight="medium">
                Click on any candidate row to view detailed information and take actions
              </Text>
            </HStack>
          </Box>
          
          <Table variant="simple" size="sm">
            <Thead bg="gray.100">
              <Tr>
                <Th>#</Th>
                <Th>Name</Th>
                <Th>Gender</Th>
                <Th>Phone</Th>
                <Th>College/Company</Th>
                <Th>Course</Th>
                <Th>Year</Th>
                <Th>ID Card</Th>
                <Th>Reg Date</Th>
                <Th>Payment</Th>
                <Th>Payment Method</Th>
                <Th>Attendance</Th>
              </Tr>
            </Thead>
            <Tbody>
              {filteredData?.map((candidate, idx) => (
                <Tr 
                  key={candidate._id} 
                  _hover={{ bg: "blue.50", cursor: "pointer" }} 
                  onClick={() => handleCandidateClick(candidate)}
                  transition="all 0.2s"
                >
                  <Td>{idx + 1}</Td>
                  <Td>
                    <HStack>
                     
                      <Box>
                        <Text fontWeight="semibold">{candidate.name}</Text>
                        <Text fontSize="xs" color="gray.500">
                          {candidate.serialNo || "-"}
                        </Text>
                      </Box>
                    </HStack>
                  </Td>
                  <Td>{candidate.gender}</Td>
                 
                  <Td>
                    <Tooltip label={candidate.whatsappNumber} fontSize="xs">
                      <HStack spacing={1}>
                        <PhoneIcon boxSize={3} color="green.500" />
                        <Text fontSize="sm" noOfLines={1} maxW="110px">
                          {candidate.whatsappNumber}
                        </Text>
                      </HStack>
                    </Tooltip>
                  </Td>
                  <Td>
                    <Text fontSize="sm">
                      {candidate.college || (
                        <chakra.span color="blue.600">{candidate.companyName || "-"}</chakra.span>
                      )}
                    </Text>
                  </Td>
                  <Td>{candidate.course || "-"}</Td>
                  <Td>{candidate.year || "-"}</Td>
                  <Td>
                    {candidate.studentIdCardUrl ? (
                      <VStack spacing={2} align="center">
                        <Image
                          src={candidate.studentIdCardUrl}
                          alt="Student ID Card"
                          boxSize="60px"
                          objectFit="cover"
                          borderRadius="md"
                          border="1px solid"
                          borderColor="gray.200"
                          cursor="pointer"
                          onClick={() => window.open(candidate.studentIdCardUrl, '_blank')}
                          _hover={{ transform: "scale(1.05)", boxShadow: "md" }}
                          transition="all 0.2s"
                        />
                        <Button
                          size="xs"
                          colorScheme="blue"
                          variant="outline"
                          onClick={() => window.open(candidate.studentIdCardUrl, '_blank')}
                        >
                          View Full
                        </Button>
                      </VStack>
                    ) : candidate.collegeOrWorking === "College" ? (
                      <VStack spacing={1}>
                        <Box 
                          boxSize="60px" 
                          bg="red.50" 
                          border="2px dashed" 
                          borderColor="red.200" 
                          borderRadius="md"
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                        >
                          <WarningIcon color="red.400" />
                        </Box>
                        <Text fontSize="xs" color="red.500">
                          No ID Card
                        </Text>
                      </VStack>
                    ) : (
                      <VStack spacing={1}>
                        <Box 
                          boxSize="60px" 
                          bg="gray.50" 
                          border="1px solid" 
                          borderColor="gray.200" 
                          borderRadius="md"
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                        >
                          <Text fontSize="xs" color="gray.400">N/A</Text>
                        </Box>
                        <Text fontSize="xs" color="gray.400">
                          Working Prof.
                        </Text>
                      </VStack>
                    )}
                  </Td>
                  <Td>
                    {candidate.registrationDate
                      ? new Date(candidate.registrationDate).toLocaleDateString()
                      : "N/A"}
                  </Td>
                  <Td>
                    <Tag
                      size="sm"
                      colorScheme={statusColors[candidate.paymentStatus] || "gray"}
                      ml={1}
                    >
                      {candidate.paymentStatus}
                    </Tag>
                  </Td>
                  <Td>
                    {candidate.paymentMethod ? (
                      <Tag colorScheme="orange" size="sm">
                        {candidate.paymentMethod}
                      </Tag>
                    ) : (
                      <Tag colorScheme="gray" size="sm">
                        -
                      </Tag>
                    )}
                  </Td>
               
                  <Td>
                    {candidate.attendance ? (
                      <CheckCircleIcon color="green.400" />
                    ) : (
                      <WarningIcon color="gray.400" />
                    )}
                  </Td>
                 
                </Tr>
              ))}
              {filteredData?.length === 0 && (
                <Tr>
                  <Td colSpan={16}>
                    <Text color="gray.400" textAlign="center" py={10}>
                      No candidates found.
                    </Text>
                  </Td>
                </Tr>
              )}
            </Tbody>
          </Table>
        </Box>

        {/* Candidate Details Modal */}
        <Modal isOpen={isOpen} onClose={onClose} size="4xl" scrollBehavior="inside">
          <ModalOverlay bg="blackAlpha.600" backdropFilter="blur(10px)" />
          <ModalContent maxH="90vh" borderRadius="xl" boxShadow="2xl">
            <ModalHeader bg="gradient-to-r from-teal.500 to-blue.500" color="white" borderTopRadius="xl">
              <HStack spacing={3}>
                <Avatar
                  name={selectedCandidate?.name}
                  size="md"
                  bg="white"
                  color="teal.500"
                />
                <VStack align="start" spacing={0}>
                  <Text fontSize="xl" fontWeight="bold">
                    {selectedCandidate?.name}
                  </Text>
                  <Text fontSize="sm" opacity={0.9}>
                    Registration Details
                  </Text>
                </VStack>
              </HStack>
            </ModalHeader>
            <ModalCloseButton color="white" />
            
            {selectedCandidate && (
              <ModalBody p={6}>
                <VStack spacing={6} align="stretch">
                  {/* Payment Status Section */}
                  <Box>
                    <HStack justify="space-between" align="center" mb={4}>
                      <Heading size="md" color="gray.700">
                        Payment Information
                      </Heading>
                      <Tag
                        size="lg"
                        colorScheme={statusColors[selectedCandidate.paymentStatus] || "gray"}
                        borderRadius="full"
                        px={4}
                        py={2}
                      >
                        {selectedCandidate.paymentStatus}
                      </Tag>
                    </HStack>
                    
                    <Grid templateColumns="repeat(auto-fit, minmax(250px, 1fr))" gap={4}>
                      <GridItem>
                        <Box bg="gray.50" p={4} borderRadius="lg" border="1px solid" borderColor="gray.200">
                          <HStack spacing={3}>
                            <Icon as={RepeatIcon} color="green.500" boxSize={5} />
                            <VStack align="start" spacing={0}>
                              <Text fontSize="sm" color="gray.600">Payment Amount</Text>
                              <Text fontSize="lg" fontWeight="bold" color="green.600">
                                ₹{selectedCandidate.paymentAmount || 'N/A'}
                              </Text>
                            </VStack>
                          </HStack>
                        </Box>
                      </GridItem>
                      
                      <GridItem>
                        <Box bg="gray.50" p={4} borderRadius="lg" border="1px solid" borderColor="gray.200">
                          <HStack spacing={3}>
                            <Icon as={ViewIcon} color="blue.500" boxSize={5} />
                            <VStack align="start" spacing={0}>
                              <Text fontSize="sm" color="gray.600">Order ID</Text>
                              <Text fontSize="sm" fontWeight="semibold" noOfLines={1}>
                                {selectedCandidate.orderId || 'N/A'}
                              </Text>
                            </VStack>
                          </HStack>
                        </Box>
                      </GridItem>
                      
                      <GridItem>
                        <Box bg="gray.50" p={4} borderRadius="lg" border="1px solid" borderColor="gray.200">
                          <HStack spacing={3}>
                            <Icon as={CalendarIcon} color="purple.500" boxSize={5} />
                            <VStack align="start" spacing={0}>
                              <Text fontSize="sm" color="gray.600">Payment Date</Text>
                              <Text fontSize="sm" fontWeight="semibold">
                                {selectedCandidate.paymentDate 
                                  ? new Date(selectedCandidate.paymentDate).toLocaleDateString()
                                  : 'N/A'
                                }
                              </Text>
                            </VStack>
                          </HStack>
                        </Box>
                      </GridItem>
                      
                      <GridItem>
                        <Box bg="gray.50" p={4} borderRadius="lg" border="1px solid" borderColor="gray.200">
                          <HStack spacing={3}>
                            <Tag colorScheme="orange" size="sm">Method</Tag>
                            <Text fontSize="sm" fontWeight="semibold">
                              {selectedCandidate.paymentMethod || 'N/A'}
                            </Text>
                          </HStack>
                        </Box>
                      </GridItem>
                    </Grid>
                  </Box>

                  <Divider />

                  {/* Personal Information */}
                  <Box>
                    <Heading size="md" color="gray.700" mb={4}>
                      Personal Information
                    </Heading>
                    
                    <Grid templateColumns="repeat(auto-fit, minmax(300px, 1fr))" gap={4}>
                      <GridItem>
                        <VStack align="stretch" spacing={3}>
                          <HStack>
                            <Icon as={EmailIcon} color="teal.500" />
                            <VStack align="start" spacing={0}>
                              <Text fontSize="xs" color="gray.500">Email</Text>
                              <Text fontSize="sm" fontWeight="medium">{selectedCandidate.email}</Text>
                            </VStack>
                          </HStack>
                          
                          <HStack>
                            <Icon as={PhoneIcon} color="green.500" />
                            <VStack align="start" spacing={0}>
                              <Text fontSize="xs" color="gray.500">WhatsApp Number</Text>
                              <Text fontSize="sm" fontWeight="medium">{selectedCandidate.whatsappNumber}</Text>
                            </VStack>
                          </HStack>
                          
                          <HStack>
                            <Text fontSize="sm" color="gray.500" minW="60px">Gender:</Text>
                            <Tag size="sm" colorScheme="purple">{selectedCandidate.gender}</Tag>
                          </HStack>
                          
                          <HStack>
                            <Text fontSize="sm" color="gray.500" minW="60px">DOB:</Text>
                            <Text fontSize="sm" fontWeight="medium">
                              {selectedCandidate.dob 
                                ? new Date(selectedCandidate.dob).toLocaleDateString()
                                : 'N/A'
                              }
                            </Text>
                          </HStack>
                        </VStack>
                      </GridItem>
                      
                      <GridItem>
                        <VStack align="stretch" spacing={3}>
                          <HStack>
                            <Text fontSize="sm" color="gray.500" minW="80px">Type:</Text>
                            <Tag size="sm" colorScheme="blue">
                              {selectedCandidate.collegeOrWorking}
                            </Tag>
                          </HStack>
                          
                          {selectedCandidate.collegeOrWorking === 'College' ? (
                            <>
                              <HStack>
                                <Text fontSize="sm" color="gray.500" minW="80px">College:</Text>
                                <Text fontSize="sm" fontWeight="medium" noOfLines={2}>
                                  {selectedCandidate.college || 'N/A'}
                                </Text>
                              </HStack>
                              
                              <HStack>
                                <Text fontSize="sm" color="gray.500" minW="80px">Course:</Text>
                                <Text fontSize="sm" fontWeight="medium">
                                  {selectedCandidate.course || 'N/A'}
                                </Text>
                              </HStack>
                              
                              <HStack>
                                <Text fontSize="sm" color="gray.500" minW="80px">Year:</Text>
                                <Text fontSize="sm" fontWeight="medium">
                                  {selectedCandidate.year || 'N/A'}
                                </Text>
                              </HStack>
                            </>
                          ) : (
                            <HStack>
                              <Text fontSize="sm" color="gray.500" minW="80px">Company:</Text>
                              <Text fontSize="sm" fontWeight="medium">
                                {selectedCandidate.companyName || 'N/A'}
                              </Text>
                            </HStack>
                          )}
                        </VStack>
                      </GridItem>
                    </Grid>
                  </Box>

                  {/* Student ID Card Section */}
                  {selectedCandidate.collegeOrWorking === 'College' && (
                    <>
                      <Divider />
                      <Box>
                        <Heading size="md" color="gray.700" mb={4}>
                          Student ID Card
                        </Heading>
                        
                        {selectedCandidate.studentIdCardUrl ? (
                          <VStack spacing={4}>
                            <Image
                              src={selectedCandidate.studentIdCardUrl}
                              alt="Student ID Card"
                              maxH="300px"
                              maxW="400px"
                              objectFit="contain"
                              borderRadius="lg"
                              border="2px solid"
                              borderColor="gray.200"
                              boxShadow="md"
                            />
                            <Button
                              colorScheme="blue"
                              variant="outline"
                              leftIcon={<ViewIcon />}
                              onClick={() => window.open(selectedCandidate.studentIdCardUrl, '_blank')}
                            >
                              View Full Size
                            </Button>
                          </VStack>
                        ) : (
                          <Box
                            p={8}
                            textAlign="center"
                            bg="red.50"
                            border="2px dashed"
                            borderColor="red.200"
                            borderRadius="lg"
                          >
                            <WarningIcon color="red.400" boxSize={8} mb={2} />
                            <Text color="red.600" fontWeight="medium">
                              No ID Card Uploaded
                            </Text>
                            <Text fontSize="sm" color="red.500">
                              Student verification may be required
                            </Text>
                          </Box>
                        )}
                      </Box>
                    </>
                  )}

                  {/* Registration Info */}
                  <Divider />
                  <Box>
                    <Heading size="md" color="gray.700" mb={4}>
                      Registration Details
                    </Heading>
                    
                    <Grid templateColumns="repeat(auto-fit, minmax(200px, 1fr))" gap={4}>
                      <GridItem>
                        <Text fontSize="sm" color="gray.500">Registration Date</Text>
                        <Text fontSize="sm" fontWeight="medium">
                          {selectedCandidate.registrationDate
                            ? new Date(selectedCandidate.registrationDate).toLocaleDateString()
                            : 'N/A'
                          }
                        </Text>
                      </GridItem>
                      
                      <GridItem>
                        <Text fontSize="sm" color="gray.500">Serial Number</Text>
                        <Text fontSize="sm" fontWeight="medium">
                          {selectedCandidate.serialNo || 'N/A'}
                        </Text>
                      </GridItem>
                      
                      <GridItem>
                        <Text fontSize="sm" color="gray.500">Attendance</Text>
                        <HStack>
                          {selectedCandidate.attendance ? (
                            <>
                              <CheckCircleIcon color="green.500" />
                              <Text fontSize="sm" color="green.600" fontWeight="medium">Present</Text>
                            </>
                          ) : (
                            <>
                              <WarningIcon color="orange.400" />
                              <Text fontSize="sm" color="orange.600" fontWeight="medium">Not Marked</Text>
                            </>
                          )}
                        </HStack>
                      </GridItem>
                      
                      <GridItem>
                        <Text fontSize="sm" color="gray.500">Receipt</Text>
                        <Text fontSize="sm" fontWeight="medium">
                          {selectedCandidate.receipt || 'N/A'}
                        </Text>
                      </GridItem>
                    </Grid>
                  </Box>
                </VStack>
              </ModalBody>
            )}
            
            <ModalFooter bg="gray.50" borderBottomRadius="xl" p={6}>
              <HStack spacing={4} w="full" justify="center">
                <Button
                  colorScheme="green"
                  leftIcon={<CheckIcon />}
                  onClick={() => handleAction('accept', selectedCandidate._id)}
                  isLoading={actionLoading[selectedCandidate?._id]}
                  size="lg"
                  px={8}
                >
                  Accept
                </Button>
                
                <Button
                  colorScheme="red"
                  leftIcon={<CloseIcon />}
                  onClick={() => handleAction('reject', selectedCandidate._id)}
                  isLoading={actionLoading[selectedCandidate?._id]}
                  size="lg"
                  px={8}
                >
                  Reject
                </Button>
                
                <Button
                  colorScheme="orange"
                  leftIcon={<RepeatIcon />}
                  onClick={() => handleAction('refund', selectedCandidate._id)}
                  isLoading={actionLoading[selectedCandidate?._id]}
                  size="lg"
                  px={8}
                >
                  Refund
                </Button>
                
                <Button
                  variant="ghost"
                  onClick={onClose}
                  size="lg"
                  px={8}
                >
                  Close
                </Button>
              </HStack>
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* Confirmation Alert Dialog */}
        <AlertDialog
          isOpen={isAlertOpen}
          leastDestructiveRef={cancelRef}
          onClose={onAlertClose}
        >
          <AlertDialogOverlay>
            <AlertDialogContent>
              <AlertDialogHeader fontSize="lg" fontWeight="bold">
                Confirm Action
              </AlertDialogHeader>

              <AlertDialogBody>
                Are you sure you want to <strong>{alertAction?.action}</strong> this candidate's registration?
                This action will update their payment status and cannot be undone.
              </AlertDialogBody>

              <AlertDialogFooter>
                <Button ref={cancelRef} onClick={onAlertClose}>
                  Cancel
                </Button>
                <Button
                  colorScheme={alertAction?.action === 'accept' ? 'green' : 
                           alertAction?.action === 'reject' ? 'red' : 'orange'}
                  onClick={confirmAction}
                  ml={3}
                  isLoading={actionLoading[alertAction?.candidateId]}
                >
                  Confirm {alertAction?.action}
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialogOverlay>
        </AlertDialog>
      </Box>
    </Layout>
  );
};

export default CandidateExport;