import 'reflect-metadata';
import { MikroORM } from '@mikro-orm/core';
import { __prod__ } from './constants';
import { Post } from './entities/Post';
import mikroConfig from './mikro-orm.config';
import express from 'express';
import { ApolloServer } from 'apollo-server-express';
import { buildSchema } from 'type-graphql';
import { HelloResolver } from './resolvers/hello';
import { PostResolver } from './resolvers/post';

// async main funtion
const Main = async () => {
    // initialize ORM and connect to DB
    const orm = await MikroORM.init(mikroConfig);
    // run migrations
    await orm.getMigrator().up();

    // create express server
    const app = express();

    // create apollo server passing a schema
    const apolloServer = new ApolloServer({
        schema: await buildSchema({
            resolvers: [HelloResolver, PostResolver],
            validate: false
        }),
        // object accessible by resolvers (we pass orm.em to manage the DB in the resolvers)
        context: () => ({ em: orm.em })
    });

    // start apollo server
    await apolloServer.start();

    // create graphql endpoint on express server
    apolloServer.applyMiddleware({ app });

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