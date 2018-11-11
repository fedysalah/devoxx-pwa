const {db} = require('./storages');

const addComment = async (comment) => {
    const newComment = await db.collection('comments').add({
        postId: comment.postId,
        authorId: comment.authorId,
        date: comment.date,
        text: comment.text,
    });
    return {
        commentId: newComment.id,
        postId: newComment.postId,
        authorId: newComment.authorId,
        date: newComment.date,
        text: newComment.text,
    }
}

const allComments = async () => {
    const snapshot = await db.collection('comments').get();
    const comments = [];
    snapshot.forEach((doc) => {
        const data = doc.data();
        comments.push({
            commentId: doc.id,
            ...data
        })
        console.log(doc.id, '=>', doc.data());
    })
    return comments
}

module.exports = {
    addComment,
    allComments,
}