import { Post } from '../entities/Post';
import { Resolver, Query, Mutation, Arg, Int, InputType, Field, Ctx, UseMiddleware, FieldResolver, Root, ObjectType } from 'type-graphql';
import { MyContext } from '../types';
import { isAuth } from '../middleware/isAuth';
import { getConnection } from 'typeorm';
import { Updoot } from '../entities/Updoot';

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

        if(ctx.req.session.userId) {
            replacements.push(ctx.req.session.userId);
        }

        // cursor index in replacements is 3 by default
        let cursorIndex = 3;

        // if we have a cursor, add cursor date to replacesments array
        if(cursor) {
            
            replacements.push(new Date(parseInt(cursor)));
            // cursor index in replacements = length of replacements
            cursorIndex = replacements.length;
        }

        // RAW SQL Query
        // Join creator with posts in a creator field
        // if we have a cursor, get posts older than that
        // order by the newest first
        // get a limit of realLimitPlusOne
        // subquery to get voteStatus field conditionally
        const posts = await getConnection().query(`
            select p.*,
            json_build_object(
                'id', u.id,
                'username', u.username,
                'email', u.email,
                'createdAt', u."createdAt",
                'updatedAt', u."updatedAt"
            ) creator,
            ${ctx.req.session.userId ? '(select value from updoot where "userId" = $2 and "postId" = p.id ) "voteStatus"' : 'null as "voteStatus"'}
            from post p
            inner join public.user u on u.id = p."creatorId"
            ${cursor ? `where p."createdAt" < $${cursorIndex}` : ''}
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
        // join creator in returned object
        return Post.findOne({ where: { id: id }, relations: ["creator"] });
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
    // takes an id arg and context object
    // pass through auth middleware before executing mutation
    @Mutation(() => Boolean)
    @UseMiddleware(isAuth)
    async deletePost(
        @Arg("id", () => Int) id:number,
        @Ctx() ctx: MyContext 
    ): Promise<boolean>{
        // delete post with postId from Updoot entity
        await Updoot.delete({ postId: id });
        // delet post with id AND creatorId (from req.session) from Post entity
        await Post.delete({ id: id, creatorId: ctx.req.session.userId });
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