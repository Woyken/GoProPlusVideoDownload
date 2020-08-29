import React, { useState } from 'react';
import { observer } from 'mobx-react';
import { logIn } from '../actions/goproVideoList';
import { Input } from '@material-ui/core';
import { loginWithToken } from '../actions/login';

const LoginPage = observer(
    (): JSX.Element => {
        const [manualToken, setManualToken] = useState<string>('');
        return (
            <>
                <div>
                    Not logged in!
                    <button onClick={(): void => logIn()}>
                        Login with GoPro account
                    </button>
                </div>
                <div>
                    Or
                    <br />
                    Enter token manually:
                    <Input
                        value={manualToken}
                        onChange={(e): void => setManualToken(e.target.value)}
                    ></Input>
                    <button onClick={(): void => loginWithToken(manualToken)}>
                        Login with token
                    </button>
                </div>
            </>
        );
    },
);

export default LoginPage;
