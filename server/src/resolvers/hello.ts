import { Resolver, Query } from 'type-graphql';

// Resolver class with either mutations or queries
@Resolver()
export class HelloResolver {
    @Query(() => String)
    hello() {
        return "hello world"
    }
}