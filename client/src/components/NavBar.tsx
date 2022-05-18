import { Box, Flex, Link as ChakraLink } from '@chakra-ui/react';
import Link from 'next/link';
import React from 'react';

interface NavBarProps {

};

export const NavBar: React.FC<NavBarProps> = ({}) => {
    return (
        <Flex bg="tomato" p={4}>
            <Box ml='auto' color={'white'}>
                <Link href='/login'>
                    <ChakraLink mr={2}>Login</ChakraLink>
                </Link>
                <Link href='/register'>
                    <ChakraLink>Register</ChakraLink>
                </Link>
            </Box>
        </Flex>
    );
};