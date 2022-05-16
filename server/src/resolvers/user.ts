import { Resolver, ObjectType, Field, Query, Mutation, Arg, Ctx } from 'type-graphql';
import { MyContext } from '../types';
import { User } from '../entities/User';
import argon2 from 'argon2';

// Object type for an error with a field
@ObjectType()
class FieldError {
    @Field()
    field: string;
    @Field()
    message: string;
}

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

        // return user
        return {
            user: user
        };
    }
}