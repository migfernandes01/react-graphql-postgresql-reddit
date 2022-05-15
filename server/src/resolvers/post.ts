import { Post } from '../entities/Post';
import { MyContext } from '../types';
import { Resolver, Query, Mutation, Ctx, Arg, Int } from 'type-graphql';

// Resolver class with either mutations or queries
@Resolver()
export class PostResolver {

    // query that returns array of posts
    // gets context object that contains orm.em
    @Query(() => [Post])
    posts(
        @Ctx() ctx: MyContext
    ): Promise<Post[]> {
        return ctx.em.find(Post, {});
    }

    // query that returns post
    // takes an id as an argument and context object containing orm.em
    @Query(() => Post, {nullable: true})
    post(
        @Arg('id', () => Int) id: number,
        @Ctx() ctx: MyContext
    ): Promise<Post | null> {
        return ctx.em.findOne(Post, { id: id });
    }

    // mutation to create post
    // takes a title arg and uses context object containing orm.em
    @Mutation(() => Post)
    async createPost(
        @Arg("title", () => String) title: string,
        @Ctx() ctx: MyContext
    ): Promise<Post | null> {
        // create Post with orm passing title
        const post = ctx.em.create(Post, { title: title });
        // save post to DB
        await ctx.em.persistAndFlush(post);
        // return created post
        return post;
    }

    // mutation to update post
    // takes an id and title arg and uses context object containing orm.em
    @Mutation(() => Post)
    async updatePost(
        @Arg("id", () => Int) id: number,
        @Arg("title", () => String) title: string,
        @Ctx() ctx: MyContext
    ): Promise<Post | null> {
        // find post to update
        const post = await ctx.em.findOne(Post, { id })
        // if post is not found
        if(!post) {
            return null;
        }
        // if title is not undefined
        if(typeof title !== 'undefined'){
            // set title to new updated title
            post.title = title;
            // save new post to DB
            await ctx.em.persistAndFlush(post);
        }
        return post;     
    }

    // Mutation to delete post
    // takes an id arg and uses context object containing orm.em
    @Mutation(() => Boolean)
    async deletePost(
        @Arg("id") id:number,
        @Ctx() ctx: MyContext
    ): Promise<boolean>{
        try {
            // delete Post with id passed through args
            await ctx.em.nativeDelete(Post, { id })
        } catch {
            return false   
        }   
        return true;
    }
}