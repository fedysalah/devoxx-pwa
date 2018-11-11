import Dexie from 'dexie';

const db = new Dexie("AirBeerNbeerDemo");

db.version(1).stores({
    favorites: "postId, authorId, unsynced",
    posts: "++postId, authorId, date, location, text, picture, unsynced",
    comments: "++commentId, postId, authorId, date, text, unsynced",
    votes: "postId, authorId, value, unsynced",
    notifications: "++id, postId, authorId, target, action, date, seen"
});

export const favorite = (postId, authorId) => {
    console.log('favoriting post  : ', postId, 'by ', authorId);
    return db.favorites.where('postId')
        .equals(postId)
        .count()
        .then(count => {
            if (count == 0) {
                return db.favorites.add({ postId, authorId, unsynced: 'true' })
                    .then(() => {
                        //requestSync('favorites_updated')
                        return db.favorites.toArray();
                    })
            } else {
                return db.favorites.where('postId')
                    .equals(postId)
                    .delete()
                    .then(() => db.favorites.toArray())
            }
        });
};

export const vote = (postId, authorId, value) => {
    console.log('voting post  : ', postId, 'by ', authorId, 'with', value);
    return db.votes.where('postId')
        .equals(postId)
        .count()
        .then(count => {
            if (count == 0) {
                return db.votes.add({ postId, authorId, value, unsynced: 'true' })
                    .then(() => {
                        //requestSync('votes_updated')
                        return db.votes.toArray();
                    })
            } else {
                return db.votes.where('postId')
                    .equals(postId)
                    .delete()
                    .then(() => db.votes.toArray())
            }
        });
};

export const comment = (comment) => {
    console.log('commenting post  : ', comment);
    return db.comments.add({ ...comment, unsynced: true })
        .then(() => {
            //requestSync('comments_updated')
            return db.comments.toArray();
        })
};

export const post = (post) => {
    console.log('addind a new post  : ', post);
    return db.posts.add({ ...post, unsynced: true })
        .then(() => {
            //requestSync('posts_updated')
            return db.posts.toArray();
        })
};

export const votes = (authorId) => {
    return db.votes.where('authorId')
        .equals(authorId)
        .toArray();
};

export const localPosts = (authorId) => {
    return db.posts.where('authorId')
        .equals(authorId)
        .toArray();
};

export const localComments = (authorId, postId) => {
    return db.comments
        .where({ 'authorId': authorId, 'postId': postId })
        .toArray();
};

export const favorites = (authorId) => {
    return db.favorites.where('authorId')
        .equals(authorId)
        .toArray()
};

export const notifications = (target) => {
    return db.notifications.where('target')
        .equals(target)
        .toArray()
};

export const unseenNotifications = (target) => {
    return db.notifications
        .where({ 'target': target, 'seen': 'false' })
        .toArray()
};

export const markAllNotifactionAsSeen = (target) => {
    return db.notifications.where({ 'target': target, 'seen': 'false' })
        .modify({ seen: 'true' })
};

const requestSync = (evt) => {
    return navigator.serviceWorker.ready.then(function (swRegistration) {
        console.log('register ', evt)
        if (window.SyncManager) {
            return swRegistration.sync.register(evt)
        } else {
            navigator.serviceWorker.controller.postMessage(evt);
            return Promise.resolve({});

        }
    });
};
