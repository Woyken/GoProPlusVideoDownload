import React from 'react';
import VideoList from '../components/videoList';
import LoginPage from '../components/loginPage';
import { observer } from 'mobx-react';
import { loginDataStore } from '../store/loginDataStore';

const Root = observer(
    (): JSX.Element => {
        if (!loginDataStore.authToken) {
            return <LoginPage />;
        }
        return <VideoList />;
    },
);

export default Root;
