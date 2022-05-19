// util function with user registration validation
// return array of error if any error, otherwise return null
export const validateRegister = (email: string, username: string, password: string) => {
    // if email doesn't include @
    if(!email.includes('@')){
        return [
            {
                field: 'email',
                message: 'Invalid email'
            }
        ]
    }

    // if email is not long enough
    if(username.length <= 2){
        return [
            {
                field: 'username',
                message: 'Username must be at least 3 characters long'
            }
        ];
    }

    // if username has an @
    if(username.includes('@')){
        return [
            {
                field: 'username',
                message: "Username cannot have a '@'"
            }
        ];
    }

    // if password is not long enough
    if(password.length <= 3){
        return [
            {
                field: 'password',
                message: 'Password must be at least 4 characters long'
            }
        ];
    }

    return null;
}