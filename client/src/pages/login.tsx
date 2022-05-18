// login page
import React from 'react';
import { Form, Formik } from 'formik';
import { Wrapper } from '../components/Wrapper';
import { InputField } from '../components/InputField';
import { Box, Button } from '@chakra-ui/react';
import { useLoginMutation } from '../generated/graphql';
import { toErrorMap } from '../utils/toErrorMap';
import { useRouter } from 'next/router';
import { withUrqlClient } from 'next-urql';
import { createUrqlClient } from '../utils/createUrqlClient';

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
                initialValues={{username: '', password: ''}}
                onSubmit={ async(values, {setErrors}) =>  {
                    // login using URQL mutation and get response back
                    const response = await login({username: values.username, password: values.password});
                    // if there is errors
                    if(response.data?.login.errors) {
                        // set errors to what was returned
                        setErrors(toErrorMap(response.data.login.errors))
                    } else if(response.data?.login.user) {
                        // user registered successfully
                        // push him to /
                        router.push('/');
                    }
                }}
            >
                {({isSubmitting}) => (
                    <Form>
                        <InputField 
                            name='username' 
                            placeholder='Username' 
                            label='Username'
                        />
                        <Box mt={4}>
                            <InputField 
                                name='password' 
                                placeholder='Password' 
                                label='Password' 
                                type='password'
                            />
                        </Box>
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