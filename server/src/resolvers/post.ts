import { Post } from '../entities/Post';
import { Resolver, Query, Mutation, Arg, Int, InputType, Field, Ctx, UseMiddleware, FieldResolver, Root, ObjectType } from 'type-graphql';
import { MyContext } from '../types';
import { isAuth } from '../middleware/isAuth';
import { getConnection } from 'typeorm';

// input type with 2 field
// for user input creating a post
@InputType()
class PostInput {
    @Field()
    title: string
    @Field()
    text: string
}

// new object type with list of posts
// and a boolean "hasMore"
@ObjectType()
class PaginatedPosts {
    @Field(() => [Post])
    posts: Post[]
    @Field()
    hasMore: boolean
}

// Resolver class with either mutations or queries for Post
@Resolver(Post)
export class PostResolver {
    // Field resolver that return a 
    // snippet of a post text property
    @FieldResolver(() => String)
    textSnippet(
        @Root() root: Post  // root -> Post
    ) {
        // return first 50 characters of text
        return root.text.slice(0, 50);
    }

    // query that returns array of posts
    @Query(() => PaginatedPosts)
    async posts(
        @Arg('limit', () => Int) limit: number,                                            // limit of posts to fetch
        @Arg('cursor', () => String, { nullable: true }) cursor: string | null  // cursor pointing to current post
    ): Promise<PaginatedPosts> {
        // if limit passed > 50, we keep it as 50
        const realLimit = Math.min(50, limit);
        // realLimit + 1
        const realLimitPlusOne = realLimit + 1

        // create query builder 
        const qb = getConnection()
            .getRepository(Post)                        // name of entity
            .createQueryBuilder("p")                    // Alias
                             
            .orderBy('"createdAt"', 'DESC')             // order by descendant of 'createdAt' field
            .take(realLimitPlusOne)                     // limit amount of Posts fetched (limit +1)
        
        // if we have a cursor, add a where condition
        // get posts older from cursor post
        if(cursor){
            qb.where('"createdAt" < :cursor', { cursor: new Date(parseInt(cursor)) }) // where   
        }

        // posts = resut of query
        const posts = await qb.getMany();

        // return posts and hasMore is true IF length of posts
        // returned by query === realLimit(limit + 1)
        return { 
            posts: posts.slice(0, realLimit), 
            hasMore: posts.length === realLimitPlusOne 
        };
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