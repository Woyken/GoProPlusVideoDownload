import React from 'react';
import { observer } from 'mobx-react';
import { logIn } from '../actions/goproVideoList';

const LoginPage = observer(
    (): JSX.Element => {
        return (
            <div>
                Not logged in!{' '}
                <button onClick={(): void => logIn()}>Login</button>
            </div>
        );
    },
);

export default LoginPage;
