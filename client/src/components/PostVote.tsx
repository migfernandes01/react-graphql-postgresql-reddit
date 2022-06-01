import React, { useState } from 'react';
import { ChevronDownIcon, ChevronUpIcon } from '@chakra-ui/icons';
import { Flex, IconButton } from '@chakra-ui/react';
import { PostSnippetFragment, useVoteMutation } from '../generated/graphql';

// interface to define this component's props
interface PostVoteProps {
    // post
    post: PostSnippetFragment 
}

export const PostVote: React.FC<PostVoteProps> = ({ post }) => {
    // state for loading (3 possible states)
    const [loadingState, setLoadingState ] = useState<'updoot-loading' | 'downdoot-loading' | 'not-loading'>('not-loading');

    // get vote function from vote mutation
    const [, vote] = useVoteMutation();
    
    return (
        <Flex direction='column' justifyContent='center' alignItems='center' mr={4}>
            <IconButton 
                aria-label='up-vote post'
                onClick={async () => {
                    setLoadingState('updoot-loading')
                    await vote({postId: post.id, value: 1})
                    setLoadingState('not-loading')
                }}
                isLoading={loadingState==='updoot-loading'}
                icon={<ChevronUpIcon />}
            />
            {post.points}
            <IconButton 
                aria-label='down-vote post'
                onClick={async () => {
                    setLoadingState('downdoot-loading')
                    await vote({postId: post.id, value: -1})
                    setLoadingState('not-loading')
                }}
                isLoading={loadingState==='downdoot-loading'}
                icon={<ChevronDownIcon />}
            />
        </Flex>
    );
}