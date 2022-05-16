// Mikro ORM config

import { __prod__ } from "./constants";
import { Post } from "./entities/Post";
import { MikroORM } from '@mikro-orm/core'
import path from "path";
import 'dotenv/config';
import { User } from "./entities/User";

export default {
    // migrations config
    migrations: {
      path: path.join(__dirname, "./migrations"),
      pattern: /^[\w-]+\d+\.[tj]s$/,
    },
    entities: [Post, User],                     // Tables in DB (enitites)
    dbName: "reddit2",                          // DB name
    type: "postgresql",                         // DB type
    debug: !__prod__,                           // debuf if NOT in prod
    password: process.env.POSTGRESQL_PASSWORD,  // DB user password
    port: 5433                                  // Port DB is running
} as Parameters<typeof MikroORM.init>[0];