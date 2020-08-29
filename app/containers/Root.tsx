import React from 'react';
import { hot } from 'react-hot-loader/root';
import VideoList from '../components/videoList';
import { observer } from 'mobx-react';
import loginDataStore from '../store/loginDataStore';
import LoginPage from '../components/loginPage';

const Root = observer(
    (): JSX.Element => {
        if (!loginDataStore.authToken) {
            return <LoginPage />;
        }
        return <VideoList />;
    },
);

export default hot(Root);
