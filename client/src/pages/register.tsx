// register page
import React from 'react';
import { Form, Formik } from 'formik';
import { Wrapper } from '../components/Wrapper';
import { InputField } from '../components/InputField';
import { Box, Button } from '@chakra-ui/react';
import { useRegisterMutation } from '../generated/graphql';
import { toErrorMap } from '../utils/toErrorMap';
import { useRouter } from 'next/router';

interface registerProps {

};

const Register: React.FC<registerProps> = ({}) => {
    // urql + graphql codegen mutation hook to create a mutation
    const [, register] = useRegisterMutation();

    // initialize nextjs router
    const router = useRouter();

    const onRegisterUser = () => {

    }

    return (
        <Wrapper variant='small'>
            <Formik 
                initialValues={{username: '', password: ''}}
                onSubmit={ async(values, {setErrors}) =>  {
                    // register using URQL mutation and get response back
                    const response = await register({username: values.username, password: values.password});
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
                            Register
                        </Button>
                    </Form>
                )}
            </Formik>
        </Wrapper>
    );
};


export default Register;