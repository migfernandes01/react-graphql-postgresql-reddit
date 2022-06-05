import React from 'react';
import { Box, Button, Flex, Heading, Link as ChakraLink } from '@chakra-ui/react';
import Link from 'next/link';
import { useLogoutMutation, useMeQuery } from '../generated/graphql';
import { isServer } from '../utils/isServer';

interface NavBarProps {

};

export const NavBar: React.FC<NavBarProps> = ({}) => {
    // run 'me()' query to detect logged in user
    // and get data and fetching
    const [{data, fetching}] = useMeQuery({
        pause: isServer()                   // don't user query during server side render (uses util function to detect)
    });

    // logout mutation
    const [{fetching: logoutFetching}, logout] = useLogoutMutation();

    let body = null;
    
    if(fetching){           // if data is loading
        body = null;
    } else if (!data?.me?.user){  // user not logged in
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
                <Link href="/create-post">
                    <ChakraLink mr={2}>Create Post</ChakraLink>
                </Link>
                <Box mr={4}>{data.me.user?.username}</Box>
                {/*<Link href={'/'}>*/}        
                    <Button 
                        mr={2} 
                        onClick={() => logout()} 
                        isLoading={logoutFetching} 
                        variant='link'
                    >
                        Logout
                    </Button>  
                {/*</Link>*/}   
            </Flex>
        );
    }

    return (
        <Flex zIndex={1} position='sticky' top={0} bg="tomato" p={4} align='center'>
            <Link href='/'>
                <ChakraLink>
                    <Heading>Reddit</Heading>
                </ChakraLink>
            </Link>
            <Box ml='auto' color={'white'}>
                {body}
            </Box>
        </Flex>
    );
};