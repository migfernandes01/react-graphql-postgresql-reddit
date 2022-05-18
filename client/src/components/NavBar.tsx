import React from 'react';
import { Box, Flex, Link as ChakraLink } from '@chakra-ui/react';
import Link from 'next/link';
import { useMeQuery } from '../generated/graphql';

interface NavBarProps {

};

export const NavBar: React.FC<NavBarProps> = ({}) => {
    // run 'me()' query to detect logged in user
    // and get data and fetching
    const [{data, fetching}] = useMeQuery();

    let body = null;

    if(fetching){           // if data is loading
        body = null;
    } else if (!data?.me){  // user not logged in
        body = (
            <>
            <Link href='/login'>
                <ChakraLink mr={2}>Login</ChakraLink>
            </Link>
            <Link href='/register'>
                <ChakraLink>Register</ChakraLink>
            </Link>
            </>
        );
    } else {                // user IS logged in
        body = (
            <Flex>
                <Box mr={4}>{data.me.user?.username}</Box>
                <Link href='/login'>
                    <ChakraLink mr={2}>Logout</ChakraLink>
                </Link>
            </Flex>
        );
    }

    return (
        <Flex bg="tomato" p={4}>
            <Box ml='auto' color={'white'}>
                {body}
            </Box>
        </Flex>
    );
};