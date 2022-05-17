// InputField reusable component
import { FormControl, FormLabel, Input, FormErrorMessage } from '@chakra-ui/react';
import { useField } from 'formik';
import React, { InputHTMLAttributes } from 'react'

// props for this component are the same as for an HTML element in React
// and make name prop required
type InputFieldProps = InputHTMLAttributes<HTMLInputElement> & {
    name: string,
    label: string,
    placeholder: string,
    type?: string,
};

// error:
// '' -> false
// 'error message' -> true

export const InputField: React.FC<InputFieldProps> = (props) => {
    // Formik hook -> to get properties for a field (name, onChange, value, onBlur...)
    // get error, if there's any
    const [field, {error}] = useField(props);
    return (
        <FormControl isInvalid={!!error}>
            <FormLabel htmlFor={field.name}>{props.label}</FormLabel>
            <Input {...field} type={props.type} id={field.name} placeholder={props.placeholder} />
            {error ? <FormErrorMessage>{error}</FormErrorMessage> : null}
        </FormControl>
    );
};