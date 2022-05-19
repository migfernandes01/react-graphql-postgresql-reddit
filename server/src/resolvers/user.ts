import { Resolver, ObjectType, Query, Field, Mutation, Arg, Ctx } from 'type-graphql';
import { MyContext } from '../types';
import { User } from '../entities/User';
import argon2 from 'argon2';
import { COOKIE_NAME, FORGET_PASSWORD_PREFIX } from '../constants';
import { validateRegister } from '../utils/validateRegister';
import { sendEmail } from '../utils/sendEmail';
import { v4 } from 'uuid';

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
        @Arg("email", () => String) email: string,
        @Ctx() ctx: MyContext
    ): Promise <UserResponse>{
        // call validation function
        const errors = validateRegister(email, username, password);

        // if any error in validation, return them
        if(errors) {
            return { errors: errors };
        }

        // hash password using argon 2
        const hashedPassword = await argon2.hash(password);
        // create user
        const user = ctx.em.create(User, { 
            username: username, 
            email: email,
            password: hashedPassword 
        });

        try {
            // save user to DB
            await ctx.em.persistAndFlush(user);
        } catch (error) {
            // if username already exists
            if(error.code === '23505' || error?.detail?.includes("already exists")){
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
        @Arg("usernameOrEmail", () => String) usernameOrEmail: string,
        @Arg("password", () => String) password: string,
        @Ctx() ctx: MyContext
    ): Promise <UserResponse>{
        // find one user by username or email
        const user = await ctx.em.findOne(
            User, 
            usernameOrEmail.includes('@') ? {email: usernameOrEmail} : { username: usernameOrEmail }
        );
        // if user not found
        if(!user){
            return {
                errors: [{
                    field: 'usernameOrEmail',
                    message: "Invalid credentials"
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
                    message: "Invalid credentials"
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

    // Mutation to reset's user password that returns a bool
    // Takes email
    // and context object from apollo server with orm.em and req, res
    @Mutation(() => Boolean)
    async forgotPassword(
        @Arg('email') email:string,
        @Ctx() ctx:MyContext
    ){
        // find user in DB with their email
        const user = await ctx.em.findOne(User, { email });

        // email is not valid
        if(!user) {
            // for safety, return true and do nothing
            return true;
        }

        // generate unique random token
        const token = v4();

        // store {prefix+token: user.id} in redis with an expiration date of 3 days 
        await ctx.redis.set(
            FORGET_PASSWORD_PREFIX + token, 
            user.id, 
            'EX', 
            1000 * 60 * 60 * 24 *3
        );

        // send email to their address if it exists with a link and a confirmation code
        sendEmail(
            email, 
            `<a href="http://localhost:3000/change-password/${token}">Reset Password</a>`
        );

        return true;
    }

    // Mutation to change user's password that returns a user/error
    // Takes token and newPassword
    // and context object from apollo server with orm.em and req, res
    @Mutation(() => UserResponse)
    async changePassword(
        @Arg('token') token:string,
        @Arg('newPassword') newPassword:string,
        @Ctx() ctx:MyContext 
    ): Promise<UserResponse>{
        // if new password is less than 4 chars long
        if(newPassword.length <= 3){
            return {
                errors: [{
                    field: 'newPassword',
                    message: "Password needs to be at least 4 characters long"
                }],
            };
        }

        // key = prefix+token
        const key = FORGET_PASSWORD_PREFIX+token;

        // get userId from redis using prefix+token
        // on redis we have: 
        // prefix+token: userId
        const userId = await ctx.redis.get(key);
    
        // if we didn't get a userId back
        if(!userId) {
            return {
                errors: [{
                    field: 'token',
                    message: "Token expired"
                }],
            };
        }

        // get user from DB with their ID
        const user = await ctx.em.findOne(User, { id: parseInt(userId) });

        // if we didn't get a user back
        if(!user) {
            return {
                errors: [{
                    field: 'token',
                    message: "User no longer exists"
                }],
            };
        }

        // new user password = new hashed password
        user.password = await argon2.hash(newPassword);

        // save user to DB
        await ctx.em.persistAndFlush(user);

        // log user in (update session)
        ctx.req.session.userId = user.id;

        // delete key from redis
        await ctx.redis.del(key);

        // return user is successful
        return { user };
    }
}