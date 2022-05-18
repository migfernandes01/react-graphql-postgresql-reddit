import { FieldError } from "../generated/graphql";

// utility function to map array of errors to an object
// with a field and message key-value pair
export const toErrorMap = (errors: FieldError[]) => {
    const errorMap: Record<string, string> = {};
    errors.forEach(({field, message}) => {
        errorMap[field] = message
    });

    return errorMap;
}