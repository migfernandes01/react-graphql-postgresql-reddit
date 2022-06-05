import React from 'react';
import { Box, Button } from '@chakra-ui/react';
import { Formik, Form } from 'formik';
import { withUrqlClient } from 'next-urql';
import { useRouter } from 'next/router';
import { InputField } from '../../../components/InputField';
import { Layout } from '../../../components/Layout';
import { useUpdatePostMutation } from '../../../generated/graphql';
import { createUrqlClient } from '../../../utils/createUrqlClient';
import { useGetIntId } from '../../../utils/useGetIntId';
import { useGetPostFromUrl } from '../../../utils/useGetPostFromUrl';

const EditPost: React.FC = ({}) => {
    // initialize next router
    const router = useRouter();

    // execute custom hook to get post id from url as an integer
    const intId = useGetIntId();

    // execute custom hook to get post from id in url
    const [{ data, error, fetching }] = useGetPostFromUrl();

    const [, updatePost] = useUpdatePostMutation();

    // if data is fetching
    if(fetching){
        return(
            <Layout>
                <div>Loading...</div>
            </Layout>
        )
    }

    // if not fetching, no error, but data.post is null:
    if(!data?.post){
        return (
            <Layout>
                <div>Post not found...</div>
            </Layout>
        );
    }

    return (
        <Layout variant='small'>
            <Formik 
                initialValues={{ title: data.post.title, text: data.post.text }}
                onSubmit={ async(values, {setErrors}) =>  {
                    // updatePost by id passing values(title and text)
                    await updatePost({ id: intId, ...values });
                    // take user back to where he was before going to this page
                    router.back();
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
                            Update Post
                        </Button>
                    </Form>
                )}
            </Formik>
        </Layout>
    );
}

export default withUrqlClient(createUrqlClient)(EditPost);