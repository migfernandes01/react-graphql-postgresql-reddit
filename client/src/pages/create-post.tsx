import { Box, Flex, Button } from '@chakra-ui/react';
import { Formik, Form } from 'formik';
import { withUrqlClient } from 'next-urql';
import Link from 'next/link';
import router, { useRouter } from 'next/router';
import React, { useEffect } from 'react';
import { InputField } from '../components/InputField';
import { Layout } from '../components/Layout';
import { Wrapper } from '../components/Wrapper';
import { useCreatePostMutation, useMeQuery } from '../generated/graphql';
import { createUrqlClient } from '../utils/createUrqlClient';
import { toErrorMap } from '../utils/toErrorMap';
import { useIsAuth } from '../utils/useIsAuth';

const CreatePost: React.FC<{}> = ({}) => {

    // use create post mutation hook
    const [, createPost] = useCreatePostMutation();

    const router = useRouter();

    // custom query that checks if user is logged in
    useIsAuth();

    return (
        <Layout variant='small'>
            <Formik 
                initialValues={{ title: '', text: '' }}
                onSubmit={ async(values, {setErrors}) =>  {
                    // call createPost passing values as the input
                    const {error} = await createPost({ input: values });
                    if(!error){
                        // push user to /
                        router.push('/');
                    }
                }}
            >
                {({isSubmitting}) => (
                    <Form>
                        <InputField 
                            name='title' 
                            placeholder='Title' 
                            label='Title'
                        />
                        <Box mt={4}>
                            <InputField 
                                name='text' 
                                placeholder='Text...' 
                                label='Body'
                                textarea
                            />
                        </Box>
                        <Button mt={4} type='submit' color='teal' isLoading={isSubmitting}>
                            Create Post
                        </Button>
                    </Form>
                )}
            </Formik>
        </Layout>
    );
}

// use urql client to perform Graphql Mutations and Queries
export default withUrqlClient(createUrqlClient)(CreatePost);