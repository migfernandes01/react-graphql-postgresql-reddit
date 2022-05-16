// User entity (SQL Table) using mikro-orm
import { Entity, PrimaryKey, Property } from '@mikro-orm/core';
import { ObjectType, Field, Int } from 'type-graphql';

// GraphQL object type and postgres entity
@ObjectType()
@Entity()
export class User {
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
    // Property for postgres (unique field)
    @Field()
    @Property({ type: 'text', unique: true })
    username!: string;

    // Field for GQL is not here, because we don't want to expose this field to GQL
    // Property for postgres
    @Property({ type: 'text' })
    password!: string;
}