import React from 'react';
import { hot } from 'react-hot-loader/root';
import VideoList from '../components/videoList';
import { observer } from 'mobx-react';
import loginDataStore from '../store/loginDataStore';
import { logIn } from '../actions/goproVideoList';

const Root = observer(
    (): JSX.Element => {
        if (!loginDataStore.authToken) {
            return (
                <div>
                    Not logged in!{' '}
                    <button onClick={(): void => logIn()}>Login</button>
                </div>
            );
        }
        return <VideoList />;
    },
);

export default hot(Root);
