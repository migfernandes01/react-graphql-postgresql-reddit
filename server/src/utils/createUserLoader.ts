import DataLoader from "dataloader";
import { User } from "../entities/User";

// data loader for user
// example of userIds: [1, 78, 8, 9] (array of ids)
// example of object returned: [{id: 1, username: 'tim, {...}, {...}, {...},}]
export const createUserLoader = () => new DataLoader<number, User>(async (userIds) => {
    // get all users using an array of userIds
    const users = await User.findByIds(userIds as number[]);

    // create a record with user id and User
    const userIdToUser: Record<number, User> = {};

    // fill in userIdToUser object with all users
    users.forEach(user => {
        userIdToUser[user.id] = user;
    });

    // return object with userId and the whole user
    return userIds.map(userId => userIdToUser[userId])
}); 