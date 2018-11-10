import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { BackHeader } from '../components/Header';
import { Post } from '../components/Post';
import { withRouter } from 'react-router-dom';
import '../styles/Author.css';
import { loadProfile } from '../services/profile';
import { Swiper } from '../components/Swiper';

class _Author extends Component {

    static propTypes = {
        authorId: PropTypes.string.isRequired
    }

    state = {
        porfile: undefined
    }

    async componentDidMount() {
        const profile = await loadProfile(this.props.authorId);
        this.setState({profile})
    }

    goBack = () => {
        if (this.props.history.length > 1) {
            this.props.history.goBack();
        } else {
            this.props.history.replace("/")
        }
    }


    render() {
        const { profile } = this.state
        if (!profile) {
            return null;
        }
        return (
            <div className="author-detail">
                <BackHeader title={"Author detail"}/>
                <Swiper toLeft={this.goBack}>
                    {profile.author && <div className="author-infos-container">
                        <div className="author-metadata">
                            <img src={profile.author.profilePicture} className="author-avatar" />
                            <div className="author-infos">
                                <span className="author-name">{profile.author.fullName}</span>
                            </div>
                        </div>
                        <div className="author-bio">
                            <p>{profile.author.bio}</p>
                        </div>
                    </div>}
                    <h3 className="posts-separator-title">All posts</h3>
                    {profile.posts && <ul>{profile.posts.map((post, i) => <li key={`post-${i}`}><Post post={post} linkToPost={true} /></li>)}</ul>}
                </Swiper>
            </div>
        );
    }
}

export const Author = withRouter(_Author)