import React from 'react';
import { EditIcon, DeleteIcon } from '@chakra-ui/icons';
import { Box, IconButton, Link as ChakraLink } from '@chakra-ui/react';
import Link from 'next/link';
import { useDeletePostMutation, useMeQuery } from '../generated/graphql';

// props for component
interface EditDeletePostButtonsProps {
    id: number;
    creatorId: number;
}

export const EditDeletePostButtons: React.FC<EditDeletePostButtonsProps> = ({ id, creatorId }) => {
    // hook for delete post mutation
    const [,deletePost] = useDeletePostMutation();

    // hook for me query to get "meData"
    const [{ data: meData }] = useMeQuery();

    if(meData?.me.user?.id !== creatorId){
        return null
    }
    
    return (
        <Box>
            <Link href='/post/edit/[id]' as={`/post/edit/${id}`}>
                <IconButton   
                as={ChakraLink}             
                aria-label="Edit Post" 
                icon={<EditIcon />}
                mr={2}
                />
            </Link>
            <IconButton 
            aria-label="Delete Post" 
            icon={<DeleteIcon />}
            onClick={() => {
                deletePost({ id: id })
            }}
            />
        </Box>
    );
}