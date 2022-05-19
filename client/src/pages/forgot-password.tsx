import { Box, Button } from '@chakra-ui/react';
import { Formik, Form } from 'formik';
import { withUrqlClient } from 'next-urql';
import Link from 'next/link';
import router from 'next/router';
import React, { useState } from 'react';
import { InputField } from '../components/InputField';
import { Wrapper } from '../components/Wrapper';
import { useForgotPasswordMutation } from '../generated/graphql';
import { createUrqlClient } from '../utils/createUrqlClient';

const ForgotPassword: React.FC<{}> = ({}) => {
    // state for complete
    const [complete, setComplete] = useState(false);

    // forgot password mutation hook
    const [, forgotPassword] = useForgotPasswordMutation()
    return (
        <Wrapper variant='small'>
            <Formik 
                initialValues={{email: ''}}
                onSubmit={ async(values, {setErrors}) =>  {
                    // call forgot password mutation
                    await forgotPassword({email: values.email});
                    // set complete to true
                    setComplete(true);
                }}
            >
                {({isSubmitting}) => (
                    complete ? <Box>Recovery password e-mail sent.</Box> : (
                    <Form>
                        <InputField 
                            name='email' 
                            placeholder='E-mail' 
                            label='E-mail:'
                            type='email'
                        />
                        <Button mt={4} type='submit' color='teal' isLoading={isSubmitting}>
                            Forgot Password
                        </Button>
                    </Form>
                    )
                )}
            </Formik>
        </Wrapper>
    );
};

export default withUrqlClient(createUrqlClient)(ForgotPassword);