import React from 'react';
import { Box, Flex, useColorModeValue } from '@chakra-ui/react';
import Sidebar from './Sidebar';


const Layout = ({ children }) => {

  const bg = useColorModeValue("#F5F5F5", "#121212"); 

  return (
    <Flex minHeight="100vh" bg={bg}>
      <Sidebar />
  <Box flex="1" bg={bg} p={{ base: 1, md: 3 }} ml={{ base: 0, md: "220px" }} mt={{ base: "56px", md: 0 }}>
        {children}
      </Box>
    </Flex>
  );
};

export default Layout;