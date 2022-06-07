import { Post } from '../entities/Post';
import { Resolver, Query, Mutation, Arg, Int, InputType, Field, Ctx, UseMiddleware, FieldResolver, Root, ObjectType } from 'type-graphql';
import { MyContext } from '../types';
import { isAuth } from '../middleware/isAuth';
import { getConnection } from 'typeorm';
import { Updoot } from '../entities/Updoot';
import { User } from '../entities/User';

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
    // Field resolver that returns a 
    // snippet of a post text property
    @FieldResolver(() => String)
    textSnippet(
        @Root() root: Post  // root -> Post
    ) {
        // return first 50 characters of text
        return root.text.slice(0, 50);
    }

    // Field resolver that returns a 
    // post creator for each post
    @FieldResolver(() => User)
    creator(
        @Root() post: Post,     // post 
        @Ctx() ctx: MyContext   // context containing userLoader
    ) {
        // return object containing a User when calling
        // load method of userLoader with the creatorId on Post
        return ctx.userLoader.load(post.creatorId);
    }

    // Field resolver that returns a 
    // votaStatus for each post/logged in user
    @FieldResolver(() => Int, { nullable: true })
    async voteStatus(
        @Root() post: Post,     // post 
        @Ctx() ctx: MyContext   // context containing userLoader
    ) {
        // if no user is logged in
        if(!ctx.req.session.userId){
            return null;
        }

        // call updoot loader with postId and current user
        const updoot = await ctx.updootLoader.load({postId: post.id, userId: ctx.req.session.userId})
        
        // if we got an updoot from loader, return updoot.value otherwise return null
        return updoot ? updoot.value : null;
    }

    // query that returns array of posts
    @Query(() => PaginatedPosts)
    async posts(
        @Arg('limit', () => Int) limit: number,                                             // limit of posts to fetch
        @Arg('cursor', () => String, { nullable: true }) cursor: string | null,             // cursor pointing to current post
        @Ctx() ctx: MyContext                                                               // Context
    ): Promise<PaginatedPosts> {
        // if limit passed > 50, we keep it as 50
        const realLimit = Math.min(50, limit);
        // realLimit + 1
        const realLimitPlusOne = realLimit + 1;

        // SQL replacement starts with realLimitPlusOne and current userId
        const replacements: any[] = [realLimitPlusOne];


        // if we have a cursor, add cursor date to replacesments array
        if(cursor) {
            replacements.push(new Date(parseInt(cursor)));
        }

        // RAW SQL Query
        // if we have a cursor, get posts older than that
        // order by the newest first
        // get a limit of realLimitPlusOne
        const posts = await getConnection().query(`
            select p.*
            from post p
            ${cursor ? `where p."createdAt" < $2` : ''}
            order by p."createdAt" DESC
            limit $1
        `, replacements);

        //console.log(posts);

        // SAME:

        /* // create query builder 
        const qb = getConnection()
            .getRepository(Post)                        // name of entity
            .createQueryBuilder("p")                    // Alias
            .innerJoinAndSelect(                        // JOIN creator 
                "p.creator",
                "u",
                'u.id = p."creatorId"'
            )
            .orderBy('p."createdAt"', 'DESC')             // order by descendant of 'createdAt' field
            .take(realLimitPlusOne)                     // limit amount of Posts fetched (limit +1)
        
        // if we have a cursor, add a where condition
        // get posts older from cursor post
        if(cursor){
            qb.where('p."createdAt" < :cursor', { cursor: new Date(parseInt(cursor)) }) // where   
        }

        // posts = resut of query
        const posts = await qb.getMany(); */

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
    // passing through an authentication middleware
    // takes an id title and text arg
    @Mutation(() => Post)
    @UseMiddleware(isAuth)
    async updatePost(
        @Arg("id", () => Int) id: number,
        @Arg("title") title: string,
        @Arg("text") text: string,
        @Ctx() ctx: MyContext
    ): Promise<Post | null> {
        // use query builder to run update query
        const post = await getConnection()
            .createQueryBuilder()
            .update(Post)                                       // update Post
            .set({ title: title, text: text })                  // set title and text
            .where('id = :id and "creatorId" = :creatorId', {   // using id and creatorId 
                id, 
                creatorId: ctx.req.session.userId 
            })
            .returning('*')                                     // returning all fields
            .execute();

        // post.raw is an array containing the updated posts 

        // return raw property of query in postion 0
        return post.raw[0];

        // update title and text of post with id of id and creatorId = id of logged user
        // return Post.update({ id, creatorId: ctx.req.session.userId }, { title, text });  
    }

    // Mutation to delete post
    // takes an id arg and context object
    // pass through auth middleware before executing mutation
    @Mutation(() => Boolean)
    @UseMiddleware(isAuth)
    async deletePost(
        @Arg("id", () => Int) id:number,
        @Ctx() ctx: MyContext 
    ): Promise<boolean>{
        // find post to delete
        const post = await Post.findOne({ where: { id: id } });

        // if we couldn't find the post with that id, return false
        if(!post) {
            return false;
        }

        // if post was not created by the user that is trying to delete it
        if(post.creatorId !== ctx.req.session.userId){
            throw new Error('Not Authorized');
        }

        // without CASCADING
        // delete post with postId from Updoot entity
        // await Updoot.delete({ postId: id });

        // With CASCADING:
        // Post gets deleted in Post entity and in Updoot entity
        // delet post with id AND creatorId (from req.session) from Post entity
        await Post.delete({ id: id, creatorId: ctx.req.session.userId });

        // return true if everything goes well
        return true;
    }

    // Mutation to vote on a post
    // takes a post id
    // gets the context
    // returns a bool
    // passes through auth validation middleware
    @Mutation(() => Boolean)
    @UseMiddleware(isAuth)
    async vote(
        @Arg('postId', () => Int) postId: number,
        @Arg('value', () => Int) value: number,
        @Ctx() ctx: MyContext
    ) {
        // get userId based on our session
        const { userId } = ctx.req.session;

        // find updoot based on postId and userId
        const updoot = await Updoot.findOne({ where: {postId: postId, userId: userId} });

        // if value !== -1, it's an upvote
        const isUpVote = value !== -1;

        // if isUpVote, voteValue = 1, else voteValue = -1
        const voteValue = isUpVote ? 1 : -1; 

        // the user has voted on the post before && 
        // changing from up to down or down to up
        if (updoot && updoot.value !== voteValue) {
            // start transaction and add queries to queue
            await getConnection().transaction(async tm => {
                // update value of updoot for postId and userId
                await tm.query(`
                    update updoot
                    set value = $1
                    where "postId" = $2 and "userId" = $3
                `, [voteValue, postId, userId]);

                // update points on post with id of postId
                // points = points + (2 * voteValue)
                // either points = points + 2 OR points = points + (-2)
                await tm.query(`
                    update post
                    set points = points + $1
                    where id = $2;
                `, [2 * voteValue, postId]);
            })

        } else if(!updoot) {
            // has never voted on this post before

            // start transaction and add queries to queue
            await getConnection().transaction(async tm => {
                // insert userId, postId and voteValue into updoot
                await tm.query(`
                    insert into updoot ("userId", "postId", value)
                    values ($1, $2, $3)
                `, [userId, postId, voteValue]);

                // update points on post with id of postId
                await tm.query(`
                    update post
                    set points = points + $1
                    where id = $2;
                `, [voteValue, postId]);
            })
        }

        return true;
    }
}