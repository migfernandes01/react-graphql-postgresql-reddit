import { MyContext } from "src/types";
import { MiddlewareFn } from "type-graphql";


// middleware to check if user is logged in
export const isAuth: MiddlewareFn<MyContext> = ({ context }, next) => {
    // if user is not logged in
    if(!context.req.session.userId) {
        throw new Error("not authenticated");
    }

    return next();
}