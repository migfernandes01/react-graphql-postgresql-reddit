// login page
import React from 'react';
import { Form, Formik } from 'formik';
import { Wrapper } from '../components/Wrapper';
import { InputField } from '../components/InputField';
import { Box, Button, Flex } from '@chakra-ui/react';
import { useLoginMutation } from '../generated/graphql';
import { toErrorMap } from '../utils/toErrorMap';
import { useRouter } from 'next/router';
import { withUrqlClient } from 'next-urql';
import { createUrqlClient } from '../utils/createUrqlClient';
import Link from 'next/link';

interface loginProps {

};

const Login: React.FC<loginProps> = ({}) => {
    // urql + graphql codegen mutation hook to create a mutation
    const [, login] = useLoginMutation();

    // initialize nextjs router
    const router = useRouter();

    return (
        <Wrapper variant='small'>
            <Formik 
                initialValues={{usernameOrEmail: '', password: ''}}
                onSubmit={ async(values, {setErrors}) =>  {
                    // login using URQL mutation and get response back
                    const response = await login({usernameOrEmail: values.usernameOrEmail, password: values.password});
                    // if there is errors
                    if(response.data?.login.errors) {
                        // set errors to what was returned
                        setErrors(toErrorMap(response.data.login.errors))
                    } else if(response.data?.login.user) {
                        // user registered successfully
                        // if there is a next query param
                        if(typeof router.query.next === "string"){
                            // push him there
                            router.push(router.query.next);
                        } else {
                            // othwise, push to /
                            router.push('/');
                        }
                        
                    }
                }}
            >
                {({isSubmitting}) => (
                    <Form>
                        <InputField 
                            name='usernameOrEmail' 
                            placeholder='Username/E-mail' 
                            label='Username or E-mail'
                        />
                        <Box mt={4}>
                            <InputField 
                                name='password' 
                                placeholder='Password' 
                                label='Password' 
                                type='password'
                            />
                        </Box>
                        <Flex>
                            <Link href='/forgot-password'>
                                <Button ml='auto' variant='link'>Forgot password?</Button>
                            </Link>
                        </Flex>
                        <Button mt={4} type='submit' color='teal' isLoading={isSubmitting}>
                            Login
                        </Button>
                    </Form>
                )}
            </Formik>
        </Wrapper>
    );
};

// use URQL client in this component (in order to execute mutation)
export default withUrqlClient(createUrqlClient)(Login);