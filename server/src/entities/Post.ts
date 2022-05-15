// Post entity (SQL Table) using mikro-orm
import { Entity, PrimaryKey, Property } from '@mikro-orm/core';
import { ObjectType, Field, Int } from 'type-graphql';

// GraphQL object type and postgres entity
@ObjectType()
@Entity()
export class Post {
    // Field for GQL
    // Primary key for postgres
    @Field(() => Int)
    @PrimaryKey()
    id!: number;

    // Field for GQL
    // Property for postgres
    @Field(() => String)
    @Property({ type:'date' })
    createdAt = new Date();

    // Field for GQL
    // Property for postgres
    @Field(() => String)
    @Property({ type:'date', onUpdate: () => new Date() })
    updatedAt = new Date();

    // Field for GQL
    // Property for postgres
    @Field()
    @Property({ type: 'text' })
    title!: string;
}