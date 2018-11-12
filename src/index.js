import React from 'react';
import ReactDOM from 'react-dom';
import './styles/index.css';
import './styles/materialize.css';
import './styles/pullToRefresh.css';
import 'font-awesome/css/font-awesome.min.css';
import Root from './Root';
import * as serviceWorker from './serviceWorker';

ReactDOM.render(<Root/>, document.getElementById('root'));

serviceWorker.register({});


