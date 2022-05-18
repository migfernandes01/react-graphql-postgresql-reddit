import { Resolver, ObjectType, Query, Field, Mutation, Arg, Ctx } from 'type-graphql';
import { MyContext } from '../types';
import { User } from '../entities/User';
import argon2 from 'argon2';
import { COOKIE_NAME } from '../constants';

// Object type for an error with a field
@ObjectType()
class FieldError {
    @Field()
    field: string;
    @Field()
    message: string;
}

// Object type for return (with optional fields: errors and user)
@ObjectType()
class UserResponse {
    @Field(() => [FieldError], { nullable: true })
    errors?: FieldError[]

    @Field(() => User, { nullable: true })
    user?: User
}

// Resolver class with either mutations or queries
@Resolver()
export class UserResolver {
    // Query to check if user is logged in or not 
    // (through session stored)
    @Query(() => UserResponse)
    async me(@Ctx() ctx: MyContext){

        // if no userId in req session (not logged in)
        if(!ctx.req.session.userId){
            return {
                errors: [{
                    field: 'Not logged in',
                    message: 'User is not logged in'
                }]
            }
        }

        // fetch user with the user id stored in session
        const user = await ctx.em.findOne(User, { id: ctx.req.session.userId });
        // return user
        return { user };
    }

    // Mutation to register user
    // Takes username and password
    // and context object from apollo server with orm.em
    @Mutation(() => UserResponse)
    async register(
        @Arg("username", () => String) username: string,
        @Arg("password", () => String) password: string,
        @Ctx() ctx: MyContext
    ): Promise <UserResponse>{
        // if username is not long enough
        if(username.length <= 2){
            return {
                errors: [{
                    field: 'username',
                    message: 'Username must be at least 3 characters long'
                }]
            }
        }

        // if password is not long enough
        if(password.length <= 3){
            return {
                errors: [{
                    field: 'password',
                    message: 'Password must be at least 4 characters long'
                }]
            }
        }

        // hash password using argon 2
        const hashedPassword = await argon2.hash(password);
        // create user
        const user = ctx.em.create(User, { 
            username: username, 
            password: hashedPassword 
        });

        try {
            // save user to DB
            await ctx.em.persistAndFlush(user);
        } catch (error) {
            // if username already exists
            if(error.code === '23505' || error.detail.includes("already exists")){
                return {
                    errors: [{
                        field: 'username',
                        message: 'Username already exists'
                    }]
                }
            }
        }

        // set session cookie (log user in)
        ctx.req.session.userId = user.id;
        
        // return user
        return {
            user: user
        };
    }

    // Mutation to log user in
    // Takes ousername and password 
    // and context object from apollo server with orm.em
    @Mutation(() => UserResponse)
    async login(
        @Arg("username", () => String) username: string,
        @Arg("password", () => String) password: string,
        @Ctx() ctx: MyContext
    ): Promise <UserResponse>{
        // find one user by username
        const user = await ctx.em.findOne(User, { username: username });
        // if user not found
        if(!user){
            return {
                errors: [{
                    field: 'username',
                    message: "username doesn't exist"
                }],
            }
        }

        // verify hashed password (hashed password, plain password)
        const valid = await argon2.verify(user.password, password);

        // if password not valid
        if(!valid){
            return {
                errors: [{
                    field: 'password',
                    message: "invalid credentials"
                }],
            };
        }

        // set session cookie (log user in)
        ctx.req.session.userId = user.id; 

        // return user
        return {
            user: user
        };
    }

    // Mutation to log user out
    // Gets context object with req
    @Mutation(() => Boolean)
    logout(
        @Ctx() ctx:MyContext
    ){
        // return result of promise to req.session.destroy
        // to destroy session in redis
        return new Promise(resolve => ctx.req.session.destroy((err: any)=> {
            // if error, return false
            if(err){
                console.log(err);
                resolve(false);
                return;
            }

            // clear cookie (browser)
            ctx.res.clearCookie(COOKIE_NAME);

            // else return true
            resolve(true);
        }))
    }
}