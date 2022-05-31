// Post entity (SQL Table) using TypeORM

import { ObjectType, Field, Int } from 'type-graphql';
import { BaseEntity, Column, CreateDateColumn, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Updoot } from './Updoot';
import { User } from './User';

// GraphQL object type and postgres/TypeORM entity
@ObjectType()
@Entity()
export class Post extends BaseEntity{
    // Field for GQL
    // PrimaryGeneratedColumn for postgres/TypeORM
    @Field(() => Int)
    @PrimaryGeneratedColumn()
    id!: number;

    // Field for GQL
    // Column for postgres/TypeORM
    @Field(() => String)
    @Column()
    title!: string;

    // Field for GQL
    // Column for postgres/TypeORM
    @Field(() => String)
    @Column()
    text!: string;

    // Field for GQL
    // Column for postgres/TypeORM
    @Field()
    @Column({ type: 'int', default: 0 })
    points!: number;

    // Field for GQL
    // Column for postgres/TypeORM
    @Field()
    @Column()
    creatorId: number;

    // Field for GQL
    // many to one relationship
    // sets up foreign key and stores it into creatorId column
    @Field()
    @ManyToOne(() => User, user => user.posts)
    creator: User;

    // one to many relationship
    // one post can have many updoots
    @OneToMany(() => Updoot, updoot => updoot.post)
    updoots: Updoot[];

    // Field for GQL
    // CreateDateColumn for postgres/TypeORM
    @Field(() => String)
    @CreateDateColumn()
    createdAt:Date;

    // Field for GQL
    // UpdateDateColumn for postgres/TypeORM
    @Field(() => String)
    @UpdateDateColumn()
    updatedAt:Date;
}