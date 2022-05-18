// register page
import React from 'react';
import { Form, Formik } from 'formik';
import { Wrapper } from '../components/Wrapper';
import { InputField } from '../components/InputField';
import { Box, Button } from '@chakra-ui/react';
import { useRegisterMutation } from '../generated/graphql';

interface registerProps {

};

const Register: React.FC<registerProps> = ({}) => {
    // urql + graphql codegen mutation hook to create a mutation
    const [, register] = useRegisterMutation();

    return (
        <Wrapper variant='small'>
            <Formik 
                initialValues={{username: '', password: ''}}
                onSubmit={ async(values) =>  {
                    const response = await register({username: values.username, password: values.password});
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