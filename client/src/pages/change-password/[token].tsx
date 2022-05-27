import React, { useState } from 'react';
import { NextPage } from 'next';
import { Box, Button } from '@chakra-ui/react';
import { Formik, Form } from 'formik';
import { useRouter } from 'next/router';
import { InputField } from '../../components/InputField';
import { Wrapper } from '../../components/Wrapper';
import { toErrorMap } from '../../utils/toErrorMap';
import { useChangePasswordMutation } from '../../generated/graphql';
import { withUrqlClient } from 'next-urql';
import { createUrqlClient } from '../../utils/createUrqlClient';
import Link from 'next/link';

// Change password component
// Next page type containing a token as parameter
export const ChangePassword: NextPage = () => {
    // next router
    const router = useRouter();

    console.log(router.query);

    // change password mutation hook
    const [, changePassword] = useChangePasswordMutation();

    // state for token error
    const [tokenError, setTokenError] = useState('');
    
    return (
        <Wrapper variant='small'>
            <Formik 
                initialValues={{ newPassword: '' }}
                onSubmit={ async(values, {setErrors}) =>  {
                    // changePassword using URQL mutation and get response back
                    const response = await changePassword({
                        token: typeof router.query.token === "string" ? router.query.token : "", 
                        newPassword: values.newPassword});
                    // if there is errors
                    if(response.data?.changePassword.errors) {
                        // map errors
                        const errorMap = toErrorMap(response.data.changePassword.errors);
                        // if there is a token key in error map
                        if('token' in errorMap){
                            // set token error
                            setTokenError(errorMap.token);
                        }
                        // set errors to what was returned from toErrorMap
                        setErrors(errorMap)
                    } else if(response.data?.changePassword.user) {
                        // user registered successfully
                        // push him to /
                        router.push('/');
                    }
                }}
            >
                {({isSubmitting}) => (
                    <Form>
                        <InputField 
                            name='newPassword' 
                            placeholder='New password' 
                            label='New password'
                            type='password'
                        />
                        {tokenError && (
                            <Box>
                                <Box color='red'>{tokenError}</Box>
                                <Link href='/forgot-password'>
                                    <Button variant='link' color='red'>Forgot password?</Button>
                                </Link>
                            </Box>
                        )}
                        <Button mt={4} type='submit' color='teal' isLoading={isSubmitting}>
                            Change Password
                        </Button>
                    </Form>
                )}
            </Formik>
        </Wrapper>
    );
};

// use urql client to call mutation
export default withUrqlClient(createUrqlClient)(ChangePassword);