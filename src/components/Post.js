import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { NavLink } from 'react-router-dom';
import '../styles/Post.css'
import { classSet } from '../utils/utils';
import { UserContext } from '../context/user';
import { favorite, vote } from '../stores/indexedDb';
import moment from 'moment';
moment.locale('fr');


export class FakePost extends Component {
    render() {
        return (
            <div className="post fake">
                 <div className="post-metadata"></div>
                 <div className="post-text"></div>
                 <div className="post-picture-container">
                    <div className="fake-picture"></div>
                 </div>
            </div>
        )
    }
}

export class Post extends Component {

    static propTypes = {
        linkToPost: PropTypes.bool.isRequired,
        post: PropTypes.object.isRequired,
    }

    static contextType = UserContext;

    static defaultProps = {
        linkToPost: false,
        post: undefined,
        onFavorite: undefined
    }

    favUnfav = async () => {
        const { post } = this.props;
        if (!post.unsynced) {
            const { user } = this.context
            await favorite(post.postId, user.id)
            post.onFavorite();
        }
    }

    voteUpDown = async (value) => {
        const { post } = this.props;
        if (!post.unsynced) {
            const { user } = this.context
            await vote(post.postId, user.id, value)
            post.onVote();
        }
    }

    share = () => {
        if (navigator.share) {
            const { post } = this.props;
            navigator.share({
                title: 'Look this post',
                text: post.text,
                url: `${window.location.origin}/posts/${post.postId}`,
            })
        }
    }

    displayPicture = () => {
        document.getElementById(`img-${this.props.post.postId}`).removeAttribute('data-src');
    }

    render() {
        const { post } = this.props;
        let text = (
            post && <p>{post.text} </p>
        );
        if (post && this.props.linkToPost && !post.unsynced) {
            text = (
                <NavLink to={`/posts/${post.postId}`}>
                    {text}
                </NavLink>
            )
        }
        if (!post) {
            return null;
        }
        const { user } = this.context
        return (<div className={classSet({ "post": true, "disabled": post.unsynced })}>
            <div className="post-metadata">
                <img src={post.author.profilePicture} className="post-author-avatar" />
                <div className="post-infos">
                    <NavLink to={`/authors/${post.author.authorId}`} className="post-author-name">{post.author.fullName}</NavLink>
                    <span className="post-location">{!post.unsynced ? post.location : 'Your Location'}</span>
                </div>
                <span className="post-date">{moment(post.date*1000).format('ll')}</span>
            </div>
            <div className="post-text">
                {text}
            </div>
            <div className="post-picture-container">
                <img id={`img-${post.postId}`} src={post.picture} data-src={post.picture} className="post-picture" onLoad={this.displayPicture} />
            </div>
            <div className="post-actions-container">
                <div className="post-votes">
                    {post.upVotes && <span>+{post.upVotes}</span>}
                    <i className={classSet({
                        "fa fa-thumbs-o-up material-icons small": true,
                        "color-blue": post.votedUp,
                        "disabled": user === undefined || post.unsynced
                    })} onClick={() => this.voteUpDown(1)}></i>
                    {post.downVotes && <span>-{post.downVotes}</span>}
                    <i className={classSet({
                        "fa fa-thumbs-o-down material-icons small": true,
                        "color-blue": post.votedDown,
                        "disabled": user === undefined || post.unsynced
                    })} onClick={() => this.voteUpDown(-1)}></i>
                </div>
                <div className="post-actions">
                    <i className={classSet({
                        "fa fa-share-alt material-icons small": true,
                        "disabled": user === undefined || post.unsynced,
                        "hide": !navigator.share
                    })} onClick={this.share}></i>
                        <NavLink to={`/comment/${post.postId}`}className={classSet({
                            "disabled": user === undefined || post.unsynced
                        })}><i className="fa fa-comment-o material-icons small"></i></NavLink>
                    {(post.onFavorite || post.unsynced )&& <i className={classSet({
                        "fa material-icons small": true,
                        "fa-heart-o": !post.favorited,
                        "color-red": post.favorited,
                        "fa-heart": post.favorited,
                        "disabled": user === undefined || post.unsynced
                    })} onClick={this.favUnfav}></i>}
                </div>
            </div>
        </div>
        )
    }
}