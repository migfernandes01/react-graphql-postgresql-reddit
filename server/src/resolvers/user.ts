import { Resolver, Query, Mutation, Arg, Ctx } from 'type-graphql';
import { MyContext } from '../types';
import { User } from '../entities/User';
import argon2 from 'argon2';


// Resolver class with either mutations or queries
@Resolver()
export class UserResolver {

    // Mutation to register user
    // Takes options of type UsernamePasswordInput 
    // and context object from apollo server with orm.em
    @Mutation(() => User)
    async register(
        @Arg("username", () => String) username: string,
        @Arg("password", () => String) password: string,
        @Ctx() ctx: MyContext
    ){
        // hash password using argon 2
        const hashedPassword = await argon2.hash(password);
        // create user
        const user = ctx.em.create(User, { 
            username: username, 
            password: hashedPassword 
        });
        // save user to DB
        await ctx.em.persistAndFlush(user);
        // return user
        return user;
    }
}