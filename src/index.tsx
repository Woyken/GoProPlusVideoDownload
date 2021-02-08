import React, { Fragment } from 'react';
import { render } from 'react-dom';
import './app/app.global.css';
import Root from './app/containers/Root';
import 'mobx-react/batchingForReactDom';

document.addEventListener('DOMContentLoaded', () => {
    render(<Root />, document.getElementById('root'));
});
