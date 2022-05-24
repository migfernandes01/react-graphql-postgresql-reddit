import React from 'react'
import { NavBar } from './NavBar';
import { Wrapper } from './Wrapper';

interface LayoutProps {
    variant?: "small" | "regular";
}

export const Layout: React.FC<LayoutProps> = (props) => {
    return (
        <>
            <NavBar/>
            <Wrapper variant={props.variant}>
                {props.children}
            </Wrapper>
        </>
    );
}