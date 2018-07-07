// import Router from 'react-router-dom';
import { HashRouter as Router, Route, Switch } from 'react-router-dom';
import React from 'react';
import Home from './Home';


const Routes = (
  <div>
    <Router>
      <Switch>
        <Route exact path="/" component={Home}/>
      </Switch>
    </Router>
  </div>
)

export default Routes;