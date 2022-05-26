import { useRouter } from "next/router";
import { useEffect } from "react";
import { useMeQuery } from "../generated/graphql";

// custom hook to check if user is auth onMount
export const useIsAuth = () => {
    // use me query
    const [{ data, fetching }] = useMeQuery();

    const router = useRouter();

    // when the component is rendered
    useEffect(() => {
        // if user is not logged in
        if(!fetching && !data?.me?.user?.id){
            // redirect user to /login with a next param as router.pathname 
            // (where user was originally trying to go)
            router.replace("/login?next=" + router.pathname);
        }
    }, [data, router])
}