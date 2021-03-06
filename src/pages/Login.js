import React, { Component } from 'react';
import { BackHeader } from '../components/Header';
import { withRouter, Redirect } from 'react-router-dom';
import '../styles/Login.css';
import { UserContext } from '../context/user';
import { classSet } from '../utils/utils';

class _Login extends Component {

    state = {
        email: '',
        password: '',
        redirectToReferrer: false,
    }

    handleInputChange = (event) => {
        const target = event.target;
        const value = target.type === 'checkbox' ? target.checked : target.value;
        const name = target.id;

        this.setState({
            [name]: value
        });
    }

    goBack = (e) => {
        if (e && e.preventDefault) {
            e.preventDefault();
        }
        if (this.props.history.length > 1) {
            this.props.history.goBack();
        } else {
            this.props.history.replace("/")
        }
    }

    logUser = async (e, loginMethod) => {
        const { email, password } = this.state;
        if (email && password) {
            const user = await loginMethod(email, password);
            this.setState({
                redirectToReferrer: user !== undefined,
                password: '',
            })

        }
    }

    goSignUp = (e) => {
        if (e && e.preventDefault) {
            e.preventDefault();
        }
        this.props.history.push('/signup');
    }

    render() {
        const { redirectToReferrer } = this.state;
        const { from } = this.props.location.state || { from: { pathname: "/" } };
        if (redirectToReferrer) {
            return (
                <Redirect to={from} />
            )
        }
        return (
            <UserContext.Consumer>
                {({ user, login }) => {
                    if (user === undefined) {
                        return (
                            <div className="login-container">
                                <BackHeader title="Login" iconClassName="fa fa-times close" />
                                <div className="login-content">
                                    <div className="col s12">
                                        <div className="row">
                                            <div className="input-field col s12">
                                                <input id="email" type="email" className="validate" value={this.state.email} onChange={this.handleInputChange} required />
                                                <label htmlFor="email" className={classSet({ 'active': this.state.email !== '' })}>Email</label>
                                                <span className="helper-text" data-error="Bad email"></span>
                                            </div>
                                        </div>
                                        <div className="row">
                                            <div className="input-field col s12">
                                                <input id="password" type="password" className="validate" value={this.state.password} onChange={this.handleInputChange} required />
                                                <label htmlFor="password" className={classSet({ 'active': this.state.password !== '' })}>Password</label>
                                            </div>
                                        </div>
                                        <button className="btn btn-rounded" type="button" onClick={(e) => this.logUser(e, login)}>Login</button>
                                        <div className="devider">
                                            <span>You don't have an account yet?</span>
                                        </div>
                                        <button className="btn btn-rounded" type="button" onClick={this.goSignUp}>Sign Up</button>
                                    </div>
                                </div>
                            </div>
                        )
                    } else {
                        return (
                            <Redirect to={from} />
                        )
                    }
                }
                }
            </UserContext.Consumer>
        );
    }
}

export const Login = withRouter(_Login)