import React from 'react';
import { withUrqlClient } from 'next-urql';
import { createUrqlClient } from '../../utils/createUrqlClient';
import { useRouter } from 'next/router';
import { usePostQuery } from '../../generated/graphql';
import { Layout } from '../../components/Layout';
import { Heading } from '@chakra-ui/react';

const Post: React.FC = ({}) => {
    // initialize router
    const router = useRouter();

    // parse id from query to int or set it to -1 if any error
    const intId = typeof router.query.id === 'string' ? parseInt(router.query.id) : -1;

    // execute post query passing the id from query (get data and fetching back)
    const [{ data, error, fetching }] = usePostQuery({
        pause: intId === -1,    // pause query if id === -1
        variables: {
            id: intId 
        }
    })

    // if query data is being fetched:
    if(fetching) {
        return (
            <Layout>
                <div>Loading...</div>
            </Layout>
        );
    }

    // if error:
    if(error) {
        return (
            <Layout>
                <div>Error...</div>
            </Layout>
        );
    }

    // if not fetching, no error, but data.post is null:
    if(!data?.post){
        return (
            <Layout>
                <div>Post not found...</div>
            </Layout>
        );
    }

    console.log('post data', data);

    return (
        <Layout>
            <Heading mb={4}>{data.post.title}</Heading>
            {data.post.text}
        </Layout>
    );
}

// connect component with URQL client using SSR
export default withUrqlClient(createUrqlClient, { ssr: true })(Post);