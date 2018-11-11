import React, { Component } from 'react';
import './styles/App.css';
import { BrowserRouter, Route, Switch, Redirect } from "react-router-dom";
import { Home } from './pages/Home';
import { Favourites } from './pages/Favourites';
import { Notifications } from './pages/Notifications';
import { NoMatch } from './pages/NoMatch';
import { Author } from './pages/Author';
import { PostDetail } from './pages/PostDetail';
import { NewPost } from './pages/NewPost';
import { Comment } from './pages/Comment';
import { UserContext } from './context/user';
import { Login } from './pages/Login';
import { SignUp } from './pages/SignUp';
import { Profile } from './pages/Profile';
import { signup, login } from './services/authors';

const PrivateRoute = ({ component: Component, ...rest }) => (
  <UserContext.Consumer>
    {({ user }) => (
      <Route
        {...rest}
        render={props =>
          user ? (
            <Component {...props} />
          ) : (
              <Redirect
                to={{
                  pathname: "/login",
                  state: { from: props.location }
                }}
              />
            )
        }
      />
    )}
  </UserContext.Consumer>
);

const updateOnlineIndicator = (offlineMessage, onlineMessage) => {

  const elem = navigator.onLine ? onlineMessage : offlineMessage;
  if (elem) {
    elem.classList.add('show');
    setTimeout(() => {
      elem.classList.remove('show');
    }, 4000)
  }
}


class App extends Component {

  state = {
    user: undefined,
  }

  componentDidMount() {
    // TODO load user from storage and check if its credentials are still the same
    const user = localStorage.getItem("user");
    if (user) {
      this.setState({
        user: JSON.parse(user),
      })
    }
    window.addEventListener('online',  () => {
      const onlineMessage = document.getElementById('online-message');
      const offlineMessage = document.getElementById('offline-message');
      updateOnlineIndicator(offlineMessage, onlineMessage);
      // TODO reload posts ?
    });
    window.addEventListener('offline',  () => {
      const onlineMessage = document.getElementById('online-message');
      const offlineMessage = document.getElementById('offline-message');
      updateOnlineIndicator(offlineMessage, onlineMessage)
    });
  }

  loginUser = async (email, password) => {
    const user = await login(email, password);
    // fix setSetae in unmounted component
    if (window.PushManager) {
      //this.registerForNotifications(user);
    }
    this.setState({
      user
    }, () => {
      this.state.user && localStorage.setItem('user', JSON.stringify(this.state.user))
    })
    return user;
  }

  signupUser = async (email, password) => {
    const user = await signup(email, password);
    if (window.PushManager) {
      //this.registerForNotifications(user);
    }
    console.log('user added', user);
    this.setState({
      user
    }, () => {
      this.state.user && localStorage.setItem('user', JSON.stringify(this.state.user))
    })
  }

  logoutUser = () => {
    // TODO clean storage and db (to avoid to sync elements from a previous user)
    this.setState({
      user: undefined
    }, () => {
      localStorage.removeItem('user')
    })
  }

  registerForNotifications = async (user) => {
    const registration = await navigator.serviceWorker.ready;
    console.log("Registering Push for user with id ", user.id);
    registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: this.urlBase64ToUint8Array("BFwbGBPX9ggNKmMPMtn8a_eYfMaU28iGv8-fy8PwxoMPwZZQQKaq96RMTCBkdUvVDjgJPZ6wtBeZ2p2i09ZMihY")
    }).then((subscription) => {
      console.log("Subscribing to push...");
      return fetch(`/api/subscribe`, {
        method: 'POST',
        body: JSON.stringify({ id: user.id, subscription }),
        headers: { 'content-type': 'application/json' }
      }).then(() => {
        console.log("Push Sent...");
      });
    }).catch(error => {
      console.error('Error during pushManager subscription:', error);
    });
  }

  urlBase64ToUint8Array = (base64String) => {
    const padding = "=".repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/\-/g, "+").replace(/_/g, "/");
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  render() {
    return (
      <UserContext.Provider value={{ user: this.state.user, login: this.loginUser, logout: this.logoutUser, signup: this.signupUser }}>
        <BrowserRouter basename='/'>
          <div>
            <Switch>
              <Route exact path="/" component={Home} />
              <Route exact path="/signup" component={SignUp} />
              <Route exact path="/login" component={Login} />
              <PrivateRoute exact path="/profile" component={Profile} />
              <PrivateRoute exact path="/new" component={NewPost} />
              <PrivateRoute exact path="/notifications" component={Notifications} />
              <Route exact path="/favourites" component={Favourites} />
              <PrivateRoute exact path="/comment/:postId" component={({ match }) => <Comment postId={match.params.postId} />} />
              <Route exact path="/authors/:authorId" render={({ match }) => <Author authorId={match.params.authorId} />} />
              <Route exact path="/posts/:postId" render={({ match }) => <PostDetail postId={match.params.postId} />} />
              <Route component={NoMatch} />
            </Switch>
          </div>
        </BrowserRouter>
      </UserContext.Provider>
    );
  }
}

export default App;
