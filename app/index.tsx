import React, { Fragment } from 'react';
import { render } from 'react-dom';
import { AppContainer as ReactHotAppContainer } from 'react-hot-loader';
import './app.global.css';
import Root from './containers/Root';
import 'mobx-react/batchingForReactDom';

const AppContainer = process.env.PLAIN_HMR ? Fragment : ReactHotAppContainer;

document.addEventListener('DOMContentLoaded', () => {
    render(
        <AppContainer>
            <Root />
        </AppContainer>,
        document.getElementById('root'),
    );
});
