import React, { Component } from 'react';
import { Header } from '../components/Header';
import { PostsList } from '../components/PostsList';
import '../styles/Home.css';
import { UserContext } from '../context/user';
import { allPostsWithAuthors } from '../services/posts';
import { authorById } from '../services/authors';
import { favorites, votes, localPosts } from '../stores/indexedDb';

export class Home extends Component {

    state = {
        posts: [],
        unsyncedPosts: [],
        fetching: true,
        newPostsAvailable: false,
    }

    static contextType = UserContext;

    async componentDidMount() {
        navigator.serviceWorker.addEventListener('message', async (event) => {
            const eventPayload = JSON.parse(event.data);
            if (eventPayload.message === 'reloadPosts') {
                console.log('reloadPosts')
                const posts = await allPostsWithAuthors();
                await this.updatePostsWithFavoritesAndVotes(posts);
                this.setState({ unsyncedPosts: [] })
            }
            else if (eventPayload.message === 'newPostsAvailable') {
                console.log('newPostsAvailable');
                this.setState({
                    newPostsAvailable: true
                })
            }
        });
        const posts = await allPostsWithAuthors();
        if (this.context.user) {
            await this.updatePostsWithFavoritesAndVotes(posts);
            const unsyncedPosts = await localPosts(this.context.user.id);
            if (unsyncedPosts.length > 0) {
                const me = await authorById(this.context.user.id)
                this.setState({ unsyncedPosts: unsyncedPosts.map(post => ({ ...post, author: me })), fetching: false })
            }
        } else {
            this.setState({ posts, fetching: false })
        }
    }

    updatePostsWithFavoritesAndVotes = async (posts) => {
        if (this.context.user) {
            const postVotes = await votes(this.context.user.id);
            const favoritesPosts = await favorites(this.context.user.id);
            const postWithVotesAndFavs = posts.map(post => {
                const vote = postVotes.find(vote => vote.postId === post.postId) || {};
                return {
                    ...post,
                    votedUp: vote.value > 0,
                    votedDown: vote.value < 0,
                    favorited: favoritesPosts.findIndex(fav => fav.postId === post.postId) > -1,
                    onFavorite: this.onFavorite,
                    onVote: this.onVote
                }
            });
            this.setState({ posts: postWithVotesAndFavs, newPostsAvailable: false, fetching: false });
        }
    }

    onFavorite = async () => {
        const { posts } = this.state;
        await this.updatePostsWithFavorites(posts);
    }

    updatePostsWithFavorites = async (posts) => {
        if (this.context.user) {
            const favoritesPosts = await favorites(this.context.user.id);
            const postWithFavs = posts.map(post => ({
                ...post, favorited: favoritesPosts.findIndex(fav => fav.postId === post.postId) > -1
            }));
            this.setState({ posts: postWithFavs });
        }
    }

    onVote = async () => {
        const { posts } = this.state;
        await this.updatePostsWithVotes(posts);
    }

    updatePostsWithVotes = async (posts) => {
        if (this.context.user) {
            const postVotes = await votes(this.context.user.id);
            const postWithVotes = posts.map(post => {
                const vote = postVotes.find(vote => vote.postId === post.postId) || {};
                return {
                    ...post, votedUp: vote.value > 0, votedDown: vote.value < 0
                }
            });
            this.setState({ posts: postWithVotes });
        }
    }

    loadNewPosts = () => {
        allPostsWithAuthors()
        .then(posts => {
            if (this.context.user) {
                this.updatePostsWithFavoritesAndVotes(posts);
            } else {
                this.setState({ posts, newPostsAvailable: false })
            }
        })
    }

    render() {
        const { posts, unsyncedPosts } = this.state;
        const allPosts = [...unsyncedPosts, ...posts];
        allPosts.sort((p1, p2) => p2.date - p1.date);
        return (
            <div className="home">
                <Header />
                <div className="content-container">
                    {this.state.newPostsAvailable && (
                        <button className="btn-floating new-posts-available" onClick={this.loadNewPosts}>New Posts</button>
                    )}
                    {this.state.fetching && (
                        <div className="loader"></div>
                    )}
                    <PostsList posts={allPosts} fetching={this.state.fetching} />
                </div>
            </div>
        );
    }
}