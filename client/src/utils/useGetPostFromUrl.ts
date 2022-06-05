import { usePostQuery } from "../generated/graphql";
import { useGetIntId } from "./useGetIntId";

// custom hook to get post id from url and execute post query passing the id as a variable
export const useGetPostFromUrl = () => {
    // use custom hook to get int Id from url
    const intId = useGetIntId();

    // execute post query passing the id from query (get data and fetching back)
    return usePostQuery({
        pause: intId === -1,    // pause query if id === -1
        variables: {
            id: intId 
        }
    })
}