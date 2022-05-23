import { Post } from '../entities/Post';
import { Resolver, Query, Mutation, Arg, Int, InputType, Field, Ctx, UseMiddleware } from 'type-graphql';
import { MyContext } from '../types';
import { isAuth } from '../middleware/isAuth';

// input type with 2 field
// for user input creating a post
@InputType()
class PostInput {
    @Field()
    title: string
    @Field()
    text: string
}

// Resolver class with either mutations or queries
@Resolver()
export class PostResolver {

    // query that returns array of posts
    @Query(() => [Post])
    posts(): Promise<Post[]> {
        // find all posts
        return Post.find();
    }

    // query that returns post
    // takes an id as an argument
    @Query(() => Post, {nullable: true})
    post(
        @Arg('id', () => Int) id: number
    ): Promise<Post | null> {
        // find post by id
        return Post.findOne({ where: { id: id } });
    }

    // mutation to create post
    // takes a title as an argument
    // use isAuth middleware before running resolver to check if user is authenticated
    @Mutation(() => Post)
    @UseMiddleware(isAuth)
    async createPost(
        @Arg("input") input: PostInput,
        @Ctx() ctx: MyContext
    ): Promise<Post | null> {
        // create a Post passing the input (input type with 2 fields) 
        // and save it to DB
        return Post.create({
            ...input,
            creatorId: ctx.req.session.userId
        }).save();
    }

    // mutation to update post
    // takes an id and title arg
    @Mutation(() => Post)
    async updatePost(
        @Arg("id", () => Int) id: number,
        @Arg("title", () => String) title: string
    ): Promise<Post | null> {
        // find post to update
        const post = await Post.findOne({ where: { id } })
        // if post is not found
        if(!post) {
            return null;
        }
        // if title is not undefined
        if(typeof title !== 'undefined'){
            // update post with id of id and new title
            Post.update({id}, {title});
        }
        return post;     
    }

    // Mutation to delete post
    // takes an id arg 
    @Mutation(() => Boolean)
    async deletePost(
        @Arg("id") id:number
    ): Promise<boolean>{
        // delet post with id
        await Post.delete(id);
        return true;
    }
}