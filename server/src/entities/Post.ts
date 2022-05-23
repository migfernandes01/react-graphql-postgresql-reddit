// Post entity (SQL Table) using TypeORM

import { ObjectType, Field, Int } from 'type-graphql';
import { BaseEntity, Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

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
    // CreateDateColumn for postgres/TypeORM
    @Field(() => String)
    @CreateDateColumn()
    createdAt:Date;

    // Field for GQL
    // UpdateDateColumn for postgres/TypeORM
    @Field(() => String)
    @UpdateDateColumn()
    updatedAt:Date;

    // Field for GQL
    // Column for postgres/TypeORM
    @Field(() => String)
    @Column()
    title!: string;
}