import 'reflect-metadata';
import 'dotenv/config';
import { createConnection } from 'typeorm';
import { COOKIE_NAME, __prod__ } from './constants';
import { Post } from './entities/Post';
import express from 'express';
import { ApolloServer } from 'apollo-server-express';
import { ApolloServerPluginLandingPageGraphQLPlayground } from "apollo-server-core";
import { buildSchema } from 'type-graphql';
import { HelloResolver } from './resolvers/hello';
import { PostResolver } from './resolvers/post';
import { UserResolver } from './resolvers/user';
import session from "express-session";
import connectReddis from 'connect-redis';
import Redis from 'ioredis';
import { MyContext } from './types';
import cors from 'cors';
import { User } from './entities/User';
import path from 'path';
// import { User } from './entities/User';

// async main funtion
const Main = async () => {
    // delete all users -> in case we need
    //await orm.em.nativeDelete(User, {});

    const conn = await createConnection({
        type: 'postgres',                                       // type of db
        database: 'reddit3',                                    // name of db
        username: 'postgres',                                   // username (db's admin)
        password: process.env.POSTGRESQL_PASSWORD,              // password (db's admin)
        port: 5433,                                             // port DB is running on
        logging: true,                                          // log errors
        synchronize: true,                                      // synchronize, no need to run migrations
        migrations: [path.join(__dirname, './migrations/*')],   // migrations directory
        entities: [User, Post],                                 // DB entities/tables
    });

    // conn.runMigrations();
    
    // create express server
    const app = express();

    // connect to redis
    const RedisStore = connectReddis(session);
    const redis = new Redis();

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
        context: ({ req, res }): MyContext => ({ req, res, redis })
    });

    // start apollo server
    await apolloServer.start();

    // create graphql endpoint on express server
    apolloServer.applyMiddleware({ app, cors: false });

    // listen on port 4000
    app.listen(4000, () => {
        console.log('LISTENING ON PORT 4000');
    })
};

Main().catch(err => {
    console.error(err);
});