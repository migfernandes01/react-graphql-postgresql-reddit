import { MikroORM } from '@mikro-orm/core';
import { __prod__ } from './constants';
import { Post } from './entities/Post';
import mikroConfig from './mikro-orm.config';

// async main funtion
const Main = async () => {

    // initialize ORM and connect to DB
    const orm = await MikroORM.init(mikroConfig);
    // run migrations
    await orm.getMigrator().up();

    // run sql
    /* const post = orm.em.create(Post, { title: "My first post" });
    await orm.em.persistAndFlush(post); */
    const posts = await orm.em.find(Post, {});
    console.log(posts);
};

Main().catch(err => {
    console.error(err);
});