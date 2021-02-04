import React, { Fragment } from 'react';
import { render } from 'react-dom';
import './app.global.css';
import Root from './containers/Root';
import 'mobx-react/batchingForReactDom';

document.addEventListener('DOMContentLoaded', () => {
    render(<Root />, document.getElementById('root'));
});
