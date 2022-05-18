// util function to detect if content is being loaded on the server
export const isServer = () => {
    // if there's window: client
    // if not: server
    return typeof window === "undefined";
};