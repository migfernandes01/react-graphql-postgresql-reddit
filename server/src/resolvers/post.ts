import { Post } from '../entities/Post';
import { Resolver, Query, Mutation, Arg, Int } from 'type-graphql';

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
    @Mutation(() => Post)
    async createPost(
        @Arg("title", () => String) title: string,
    ): Promise<Post | null> {
        // create a Post passing a title and save it to DB
        return Post.create({title}).save();
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