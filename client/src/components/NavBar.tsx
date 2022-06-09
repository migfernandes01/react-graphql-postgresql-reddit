import React from 'react';
import { Box, Button, Flex, Heading, Link as ChakraLink } from '@chakra-ui/react';
import Link from 'next/link';
import { useLogoutMutation, useMeQuery } from '../generated/graphql';
import { isServer } from '../utils/isServer';
import { useRouter } from 'next/router';

interface NavBarProps {

};

export const NavBar: React.FC<NavBarProps> = ({}) => {
    // initialize router
    const router = useRouter();

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
            <Flex align='center'>
                <Link href="/create-post">
                    <Button colorScheme='facebook' as={ChakraLink} mr={4}>Create Post</Button>
                </Link>
                <Box mr={4}>{data.me.user?.username}</Box>
                {/*<Link href={'/'}>*/}        
                    <Button 
                        mr={2} 
                        onClick={async () => {
                            await logout();
                            router.reload() // reload page after logout
                        }} 
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
        <Flex zIndex={1} position='sticky' top={0} bg="tomato" p={4}>
            <Flex flex={1} m='auto' align='center' maxW={800}>
                <Link href='/'>
                    <ChakraLink>
                        <Heading>Reddit</Heading>
                    </ChakraLink>
                </Link>
                <Box ml='auto' color={'white'}>
                    {body}
                </Box>
            </Flex>
        </Flex>
    );
};