import { useRouter } from "next/router";
import { usePostQuery } from "../generated/graphql";

// custom hook to get post id from url and execute post query passing the id as a variable
export const useGetPostFromUrl = () => {
    // initialize next router
    const router = useRouter();

    // parse id from query to int or set it to -1 if any error
    const intId = typeof router.query.id === 'string' ? parseInt(router.query.id) : -1;

    // execute post query passing the id from query (get data and fetching back)
    return usePostQuery({
        pause: intId === -1,    // pause query if id === -1
        variables: {
            id: intId 
        }
    })
}