// register page
import React from 'react';
import { Form, Formik } from 'formik';
import { Wrapper } from '../components/Wrapper';
import { InputField } from '../components/InputField';
import { Box, Button } from '@chakra-ui/react';
import { useRegisterMutation } from '../generated/graphql';
import { toErrorMap } from '../utils/toErrorMap';
import { useRouter } from 'next/router';
import { createUrqlClient } from '../utils/createUrqlClient';
import { withUrqlClient } from 'next-urql';

interface registerProps {

};

const Register: React.FC<registerProps> = ({}) => {
    // urql + graphql codegen mutation hook to create a mutation
    const [, register] = useRegisterMutation();

    // initialize nextjs router
    const router = useRouter();

    return (
        <Wrapper variant='small'>
            <Formik 
                initialValues={{email: '', username: '', password: ''}}
                onSubmit={ async(values, {setErrors}) =>  {
                    // register using URQL mutation and get response back
                    const response = await register({email: values.email, username: values.username, password: values.password});
                    // if there is errors
                    if(response.data?.register.errors) {
                        // set errors to what was returned
                        setErrors(toErrorMap(response.data.register.errors))
                    } else if(response.data?.register.user) {
                        // user registered successfully
                        // push him to /
                        router.push('/');
                    }
                }}
            >
                {({isSubmitting}) => (
                    <Form>
                        <InputField 
                            name='email' 
                            placeholder='Email' 
                            label='Email'
                        />
                        <Box mt={4}>
                            <InputField 
                                name='username' 
                                placeholder='Username' 
                                label='Username'
                            />
                        </Box>
                        <Box mt={4}>
                            <InputField 
                                name='password' 
                                placeholder='Password' 
                                label='Password' 
                                type='password'
                            />
                        </Box>
                        <Button mt={4} type='submit' color='teal' isLoading={isSubmitting}>
                            Register
                        </Button>
                    </Form>
                )}
            </Formik>
        </Wrapper>
    );
};

// use URQL client in this component (in order to execute mutation) 
export default withUrqlClient(createUrqlClient)(Register);