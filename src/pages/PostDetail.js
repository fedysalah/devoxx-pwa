import React, { Component } from 'react';
import { BackHeader } from '../components/Header';
import { Post } from '../components/Post';
import '../styles/PostDetail.css'
import { UserContext } from '../context/user';
import { PostComment } from '../components/PostComment';
import { postDetails } from '../services/posts';
import { authorById } from '../services/authors';
import { favorites, votes, localComments } from '../stores/indexedDb';
import { Swiper } from '../components/Swiper';
import { withRouter } from "react-router-dom";

class _PostDetail extends Component {
    state = {
        postDetail: undefined,
        unsyncedComments: []
    }

    static contextType = UserContext;

    async componentDidMount() {
        navigator.serviceWorker.addEventListener('message', async (event) => {
            const eventPayload = JSON.parse(event.data);
            if (eventPayload.message === 'reloadComments') {
                console.log('reloadComments')
                const postDetail = await postDetails(this.props.postId);
                await this.updatePostWithFavoritesAndVotes(postDetail, []);
            }
            if (eventPayload.message === 'reloadPosts') {
                console.log('reloadPosts')
                const postDetail = await postDetails(this.props.postId);
                await this.updatePostWithFavoritesAndVotes(postDetail, this.state.unsyncedComments);
            }
        });
        const postDetail = await postDetails(this.props.postId);
        if (this.context.user) {
            const _unsyncedComments = await localComments(this.context.user.id, this.props.postId);
            let unsyncedComments = []; 
            if (_unsyncedComments.length > 0) {
                const me = await authorById(this.context.user.id)
                unsyncedComments = _unsyncedComments.map(comment => ({ ...comment, author: me }))
            }
            await this.updatePostWithFavoritesAndVotes(postDetail, unsyncedComments);
        } else {
            this.setState({
                postDetail: {
                    ...postDetail,
                    post: {
                        ...postDetail.post,
                        votedUp: false,
                        votedDown: false,
                    }
                }
            });
        }
    }

    updatePostWithFavoritesAndVotes = async (postDetail, unsyncedComments) => {
        if (this.context.user) {
            const postVotes = await votes(this.context.user.id);
            const favoritesPosts = await favorites(this.context.user.id);
            const vote = postVotes.find(vote => vote.postId === postDetail.post.postId) || {};
            this.setState({
                unsyncedComments,
                postDetail: {
                    ...postDetail,
                    post: {
                        ...postDetail.post,
                        favorited: favoritesPosts.findIndex(fav => fav.postId === postDetail.post.postId) > -1,
                        votedUp: vote.value > 0,
                        votedDown: vote.value < 0,
                        onFavorite: this.onFavorite,
                        onVote: this.onVote
                    }
                }
            });
        }
    }

    onVote = async () => {
        const { postDetail } = this.state;
        await this.updatePostWithVotes(postDetail);
    }

    onFavorite = async () => {
        const { postDetail } = this.state;
        await this.updatePostWithFavorites(postDetail);
    }

    updatePostWithVotes = async (postDetail) => {
        if (this.context.user) {
            const postVotes = await votes(this.context.user.id);
            const vote = postVotes.find(vote => vote.postId === postDetail.post.postId) || {};
            this.setState({
                postDetail: {
                    ...postDetail,
                    post: {
                        ...postDetail.post,
                        votedUp: vote.value > 0, votedDown: vote.value < 0
                    }
                }
            });
        }
    }

    updatePostWithFavorites = async (postDetail) => {
        if (this.context.user) {
            const favoritesPosts = await favorites(this.context.user.id);
            this.setState({
                postDetail: {
                    ...postDetail,
                    post: {
                        ...postDetail.post,
                        favorited: favoritesPosts.findIndex(fav => fav.postId === postDetail.post.postId) > -1,
                    }
                }
            });
        }
    }

    goBack = () => {
        if (this.props.history.length > 1) {
            this.props.history.goBack();
        } else {
            this.props.history.replace("/")
        }
    }

    render() {
        const { postDetail, unsyncedComments } = this.state
        if (!postDetail) {
            return null;
        }
        const allComments = [...unsyncedComments, ...postDetail.comments]
        allComments.sort((c1, c2) => c2.date - c1.date)
        return (
            <div className="post-detail">
                <BackHeader title={"Post detail"} />
                <Swiper toLeft={this.goBack}>
                    {postDetail.post && <Post post={postDetail.post} />}
                    <ul className="post-comments">
                        {allComments.map((comment, i) => <li key={`post-${i}`}><PostComment comment={comment} /></li>)}
                    </ul>
                </Swiper>
            </div>
        );
    }
}

export const PostDetail = withRouter(_PostDetail)