// Updoot entity (SQL Table) using TypeORM

import { ObjectType, Field } from 'type-graphql';
import { BaseEntity, Column, Entity, ManyToOne, PrimaryColumn } from 'typeorm';
import { Post } from './Post';
import { User } from './User';

// RELATIONSHIP:
// m to n
// many to many:
// user <-> posts
// several users can upvote the same post
// users can upvote many posts
// user -> join table <- posts
// user -> updoot <- posts


// GraphQL object type and postgres/TypeORM entity
@ObjectType()
@Entity()
export class Updoot extends BaseEntity{
    // Field for GQL
    // Column for postgres/TypeORM
    @Field()
    @Column({ type: "int" })
    value: number

    // Field for GQL
    // PrimaryColumn for postgres/TypeORM
    @Field()
    @PrimaryColumn()
    userId: number;

    // Field for GQL
    // many to one relationship
    // sets up foreign key and stores it into userId column
    @Field(() => User)
    @ManyToOne(() => User, user => user.updoots)
    user: User;

    // Field for GQL
    // PrimaryColumn for postgres/TypeORM
    @Field()
    @PrimaryColumn()
    postId: number;

    // Field for GQL
    // many to one relationship
    // sets up foreign key and stores it into userId column
    // delete post data in Updoot entity when Post gets deleted on Post entity
    @Field(() => Post)
    @ManyToOne(() => Post, post => post.updoots, { onDelete: 'CASCADE' })
    post: Post;
}