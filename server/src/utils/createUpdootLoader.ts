import DataLoader from "dataloader";
import { Updoot } from "../entities/Updoot";

// data loader for updoots
// gets an array of objects with a postId and userId
// return Updoot or null
export const createUpdootLoader = () => new DataLoader<{postId: number, userId: number}, Updoot | null> (
    async (keys) => {
        // get all updoots using keys(array of objects with a postId and userId)
        const updoots = await Updoot.findByIds(keys as any);

        // create an object with string and Updoot
        const updootIdsToUpdoot: Record<string, Updoot> = {};

        // fill in updootIdsToUpdoot object with all userIds and postIds
        updoots.forEach(updoot => {
            updootIdsToUpdoot[`${updoot.userId}|${updoot.postId}`] = updoot;
        });

        // return object with userIds and postIds
        return keys.map(key => updootIdsToUpdoot[`${key.userId}|${key.postId}`])
    }
); 