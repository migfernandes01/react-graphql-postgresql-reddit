// User entity (SQL Table) using TypeORM

import { ObjectType, Field, Int } from 'type-graphql';
import { BaseEntity, Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Post } from './Post';

// GraphQL object type and postgres entity
@ObjectType()
@Entity()
export class User extends BaseEntity{
    // Field for GQL
    // PrimaryGeneratedColumn postgres/TypeORM
    @Field(() => Int)
    @PrimaryGeneratedColumn()
    id!: number;

    // Field for GQL
    // Column for postgres/TypeORM (unique field)
    @Field()
    @Column({ unique: true })
    username!: string;

    // Field for GQL
    // Column for postgres/TypeORM (unique field)
    @Field()
    @Column({ unique: true })
    email!: string;

    // Field for GQL is not here, because we don't want to expose this field to GQL
    // Column for postgres/TypeORM
    @Column()
    password!: string;

    // one to many relationship
    // one user can have many posts
    @OneToMany(() => Post, post => post.creator)
    posts: Post[];

    // Field for GQL
    // CreateDateColumn for postgres/TypeOrm
    @Field(() => String)
    @CreateDateColumn()
    createdAt:Date;

    // Field for GQL
    // UpdateDateColumn for postgres/TypeORM
    @Field(() => String)
    @UpdateDateColumn()
    updatedAt:Date;
}