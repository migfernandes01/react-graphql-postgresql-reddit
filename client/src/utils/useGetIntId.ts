import { useRouter } from "next/router"

// custom hook to get psot id from url parsed to an integer
export const useGetIntId = () => {
    // initialize next router
    const router = useRouter();

    // parse id from query to int or set it to -1 if any error
    const intId = typeof router.query.id === 'string' ? parseInt(router.query.id) : -1;

    return intId;

}