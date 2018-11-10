
const express = require('express');
const bodyParser = require('body-parser');
const webpush = require("web-push");
const moment = require('moment');
moment.locale('fr');
const expressValidator = require('express-validator');
const compression = require('compression');
const fetch = require('node-fetch');

const {
    addAuthor,
    logAuthor,
    authorById,
    allAuthors,
    updateAuthor,
    updateAuthorSubscription
} = require('./datastore/authors');

const {
    addPost,
    updatePost,
    postById,
    allPosts
} = require('./datastore/posts');

const {
    addComment,
    allComments
} = require('./datastore/comments');

const app = express();
const publicVapidKey = "BFwbGBPX9ggNKmMPMtn8a_eYfMaU28iGv8-fy8PwxoMPwZZQQKaq96RMTCBkdUvVDjgJPZ6wtBeZ2p2i09ZMihY";
const privateVapidKey = "-UfSss_RgRG9keikyYIjZYx1UTbUIdAf9yWPwqt_jTM";
webpush.setVapidDetails(
    "mailto:test@test.com",
    publicVapidKey,
    privateVapidKey
);

app.use(compression());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(expressValidator());


app.post('/api/subscribe', async (req, res) => {
    const { subscription, id } = req.body;
    console.log(`/api/subscribe/`, subscription)
    await updateAuthorSubscription(id, subscription);
    res.json({});
});

app.post('/api/signup', async (req, res) => {
    const body = req.body;
    const addedUser = await addAuthor(body.email, body.password);
    res.json(addedUser);
});

app.post('/api/login', async (req, res) => {
    const body = req.body;
    const loggedUser = await logAuthor(body.email, body.password);
    if (loggedUser) {
        res.json(loggedUser);
    } else {
        res.statusCode = 401;
        res.send('None shall pass')
    }
});

app.post('/api/syncposts', async (req, res) => {
    const postsToAdd = req.body.posts;
    console.log('postsToAdd', postsToAdd.length);
    await Promise.all(postsToAdd.map(async post => {
        let location = 'Unknown Address';
        try {
            const locationResponse = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${post.location.latitude},${post.location.longitude}&key=AIzaSyCYcxCXRuOQT1eX_yjAMD4IqXSZYVLslDQ`)
            const locationJs = await locationResponse.json();
            console.log(locationJs);
            location = locationJs.results
                && locationJs.results.length > 0 && locationJs.results[0].formatted_address || location;
        } catch (error) {
            console.log(error)
        }
        return addPost({ ...post, location });
    }))
    const posts = await allPosts();
    return res.json(posts)
});

app.post('/api/synccomments', async (req, res) => {
    const commentsToAdd = req.body.comments;
    console.log('commentsToAdd', commentsToAdd.length);
    await Promise.all(commentsToAdd.map(async comment => {
        const postId = comment.postId;
        const authorId = comment.authorId;
        const author = await authorById(authorId);
        const post = await postById(postId);
        const postAuthor = await authorById(post.authorId);
        if (postAuthor.subscription) {
            const payload = JSON.stringify({
                title: 'Your post has been commented',
                body: `${author.fullName} has commented your post`,
                icon: '/images/favicon.png',
                postId,
                authorId,
                action: 'comment',
                date: moment().unix(),
            });
            await addComment(comment);
            return webpush.sendNotification(JSON.parse(postAuthor.subscription), payload)
                .catch(err => console.error('err', err))
        }
        return Promise.resolve({});
    }))
    const comments = await allComments();
    return res.json(comments)
});

app.post('/api/syncfavorites', async (req, res) => {
    const favorites = req.body.favorites;
    console.log('syncfavorites', favorites.length);
    await Promise.all(favorites.map(async favorite => {
        const postId = favorite.postId;
        const authorId = favorite.authorId;
        const author = await authorById(authorId);
        const post = await postById(postId);
        const postAuthor = await authorById(post.authorId);
        if (postAuthor.subscription) {
            const payload = JSON.stringify({
                title: 'Your post has been favorited',
                body: `${author.fullName} has favorited your post`,
                icon: '/images/favicon.png',
                postId,
                authorId,
                action: 'favorite',
                date: moment().unix(),
            });
            return webpush.sendNotification(JSON.parse(postAuthor.subscription), payload)
                .catch(err => console.error('err', err))
                .then(() => res.json({}))
        }
        return Promise.resolve({});
    }))
    return res.json({})
});

app.post('/api/syncvotes', async (req, res) => {
    const votes = req.body.votes;
    console.log('syncvotes', votes.length);
    await Promise.all(votes.map(async vote => {
        const postId = vote.postId;
        const authorId = vote.authorId;
        const value = vote.value;
        const author = await authorById(authorId);
        const post = await postById(postId);
        const postAuthor = await authorById(post.authorId);
        let downVotes = post.downVotes;
        let upVotes = post.upVotes;
        if (value > 0) {
            upVotes = upVotes + 1
        } else {
            downVotes = downVotes + 1
        }
        await updatePost(postId, upVotes, downVotes)
        if (postAuthor.subscription) {
            const payload = JSON.stringify({
                title: `Your post has been ${value > 0 ? 'voted up' : 'voted down'}`,
                body: `${author.fullName} has ${value > 0 ? 'voted up' : 'voted down'} your post`,
                icon: '/images/favicon.png',
                postId,
                authorId,
                action: value > 0 ? 'voteUp' : 'voteDown',
                date: moment().unix(),
            });
            return webpush.sendNotification(JSON.parse(postAuthor.subscription), payload)
                .catch(err => console.error('err', err))
        } else {
            return Promise.resolve({});
        }
    }))
    const posts = await allPosts();
    return res.json(posts)
});

app.get('/api/authors', async (req, res) => {
    const authors = await allAuthors();
    res.json(authors);
});

app.get('/api/posts', async (req, res) => {
    const posts = await allPosts();
    res.json(posts);
});

app.get('/api/comments', async (req, res) => {
    const comments = await allComments();
    res.json(comments);
});


app.post('/api/notify', async (req, res) => {
    const postId = req.body.postId;
    const authorId = req.body.authorId;
    const author = await authorById(authorId);

    const payload = JSON.stringify({
        title: 'Your post has been favorited',
        body: `${author.fullName} has favorited your post`,
        icon: '/images/favicon.png',
        postId,
        authorId,
        action: 'favorite',
        date: moment().unix(),
    });

    return webpush.sendNotification(JSON.parse(author.subscription), payload)
        .catch(err => console.error('err', err))
        .then(() => res.json({}))
});

app.post('/api/profile', async (req, res) => {
    const {authorId, fullName, bio, picture} = req.body;
    const updated = await updateAuthor(authorId, fullName, bio, picture)
    res.json(updated);
})

app.get('/api/mocks', async (req, res) => {
    const author1 = await addAuthor('test@test', 'pass')
    await updateAuthor(author1.id, 'Jean mich', 'Bonjour je m\'aplle Jean michel et j\'aime le métal', 'https://randomuser.me/api/portraits/men/3.jpg')

    const post1 = await addPost({
        authorId: author1.id,
        date: moment("2018 10 19", "YYYY MM DD").unix(),
        location: 'Awesome Bar',
        text: 'Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Vestibulum tortor quam, feugiat vitae, ultricies eget, tempor sit amet, ante. Donec eu libero sit amet quam egestas semper. Aenean ultricies mi vitae est. Mauris placerat eleifend leo',
        picture: 'https://www.gannett-cdn.com/-mm-/89934f7b13e7717eb560f3babda84f20895abcd0/c=83-0-724-482/local/-/media/2018/07/17/DetroitFreeP/DetroitFreePress/636674313628993565-GettyImages-684133728.jpg?width=534&height=401&fit=crop'
    })
    const post2 = await addPost({
        authorId: author1.id,
        date: moment("2018 10 20", "YYYY MM DD").unix(),
        location: 'Awesome Bar',
        text: 'Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Vestibulum tortor quam, feugiat vitae, ultricies eget, tempor sit amet, ante. Donec eu libero sit amet quam egestas semper. Aenean ultricies mi vitae est. Mauris placerat eleifend leo',
        picture: 'https://www.gannett-cdn.com/-mm-/89934f7b13e7717eb560f3babda84f20895abcd0/c=83-0-724-482/local/-/media/2018/07/17/DetroitFreeP/DetroitFreePress/636674313628993565-GettyImages-684133728.jpg?width=534&height=401&fit=crop'
    })

    await addComment({
        postId: post1.postId,
        authorId: author1.id,
        date: moment("2018 10 19", "YYYY MM DD").unix(),
        text: 'Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Vestibulum tortor quam, feugiat vitae, ultricies eget, tempor sit amet, ante. Donec eu libero sit amet quam egestas semper. Aenean ultricies mi vitae est. Mauris placerat eleifend leo',
    })
    await addComment({
        postId: post1.postId,
        authorId: author1.id,
        date: moment("2018 11 02", "YYYY MM DD").unix(),
        text: 'Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Vestibulum tortor quam, feugiat vitae, ultricies eget, tempor sit amet, ante. Donec eu libero sit amet quam egestas semper. Aenean ultricies mi vitae est. Mauris placerat eleifend leo',
    })
    res.json({ sate: 'ok' });
});

module.exports = app;