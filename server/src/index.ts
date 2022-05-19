import 'reflect-metadata';
import { MikroORM } from '@mikro-orm/core';
import { COOKIE_NAME, __prod__ } from './constants';
import { Post } from './entities/Post';
import mikroConfig from './mikro-orm.config';
import express from 'express';
import { ApolloServer } from 'apollo-server-express';
import { ApolloServerPluginLandingPageGraphQLPlayground } from "apollo-server-core";
import { buildSchema } from 'type-graphql';
import { HelloResolver } from './resolvers/hello';
import { PostResolver } from './resolvers/post';
import { UserResolver } from './resolvers/user';
import session from "express-session";
import connectReddis from 'connect-redis';
import { createClient } from "redis";
import Redis from 'ioredis';
import { MyContext } from './types';
import cors from 'cors';
// import { User } from './entities/User';

// async main funtion
const Main = async () => {
    // delete all users -> in case we need
    //await orm.em.nativeDelete(User, {});
    
    // initialize ORM and connect to DB
    const orm = await MikroORM.init(mikroConfig);

    // run migrations
    await orm.getMigrator().up();
    
    // create express server
    const app = express();

    // connect to redis
    const RedisStore = connectReddis(session);
    const redis = new Redis();
    // redisClient.connect().catch(console.error);

    // use cors in every route accepting CORS from localhost:300
    // and accepting credentials
    app.use(cors({
        origin: "http://localhost:3000",
        credentials: true,
    }))

    // session middleware
    app.use(
        session({
            name: COOKIE_NAME,                                                // name of cookie
            store: new RedisStore({                                     // store session using redis
                client: redis as any,  
                disableTouch: true,
            }),    
            saveUninitialized: false,                                   // don't create a session if not needed                  
            secret: "keyboard cat",                                     // secret word
            resave: false,         
            cookie: {                                                   // create cookie
                maxAge: 1000 * 60 * 60 * 24 * 10,                       // 10 days
                httpOnly: true,
                secure: __prod__,                                       // cookie only works in https
                sameSite: 'lax'  ,                                      // csrf
            }
        })
    );

    // create apollo server passing a schema
    const apolloServer = new ApolloServer({
        schema: await buildSchema({
            resolvers: [HelloResolver, PostResolver, UserResolver],
            validate: false
        }),
        plugins: [       // use GraphQL Playground
            ApolloServerPluginLandingPageGraphQLPlayground({
            })
        ],
        // object accessible by resolvers 
        // we pass orm.em to manage the DB in the resolvers
        // we also pass the request and response
        context: ({ req, res }): MyContext => ({ em: orm.em, req, res, redis })
    });

    // start apollo server
    await apolloServer.start();

    // create graphql endpoint on express server
    apolloServer.applyMiddleware({ app, cors: false });

    // listen on port 4000
    app.listen(4000, () => {
        console.log('LISTENING ON PORT 4000');
    })

    // run sql

    /* const post = orm.em.create(Post, { title: "My first post" });
    await orm.em.persistAndFlush(post); */
    const posts = await orm.em.find(Post, {});
    console.log(posts);
};

Main().catch(err => {
    console.error(err);
});