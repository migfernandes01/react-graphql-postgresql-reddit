import 'reflect-metadata';
import { MikroORM } from '@mikro-orm/core';
import { __prod__ } from './constants';
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
import { MyContext } from './types';

// async main funtion
const Main = async () => {
    // initialize ORM and connect to DB
    const orm = await MikroORM.init(mikroConfig);
    // run migrations
    await orm.getMigrator().up();

    // create express server
    const app = express();

    // connect to redis
    const RedisStore = connectReddis(session);
    const redisClient = createClient({ legacyMode: true });
    redisClient.connect().catch(console.error);

    // session middleware
    app.use(
        session({
            name: 'qid',                                                // name of cookie
            store: new RedisStore({                                     // store session using redis
                client: redisClient as any,  
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

    const cors = { credentials: true, origin: 'https://studio.apollographql.com' }

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
        context: ({ req, res }): MyContext => ({ em: orm.em, req, res })
    });

    // start apollo server
    await apolloServer.start();

    // create graphql endpoint on express server
    apolloServer.applyMiddleware({ app, cors });

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