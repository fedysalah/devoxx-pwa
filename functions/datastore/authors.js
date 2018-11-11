const {db} = require('./storages');

const addAuthor = async (email, password) => {
    const newAuthor = await db.collection('authors').add({
        fullName: 'Guest',
        bio: 'An AirBeerNBeer guest ',
        profilePicture: 'https://static.licdn.com/scds/common/u/images/themes/katy/ghosts/person/ghost_person_200x200_v1.png',
        email,
        password,
        subscription:''
    });
    return { id: newAuthor.id, fullName: '', bio: '' }
}

const updateAuthor = async (authorId, fullName, bio, profilePicture) => {
    const authorRef = db.collection('authors').doc(authorId);
    await authorRef.update({
        fullName,
        bio,
        profilePicture,
    });
    return { authorId, fullName, bio, profilePicture }
}

const updateAuthorSubscription = async (authorId, subscription) => {
    console.log('updating subscription for user ', authorId)
    const authorRef = db.collection('authors').doc(authorId);
    await authorRef.update({
        subscription: JSON.stringify(subscription),
    });
    return { authorId, subscription }
}

const logAuthor = async (email, password) => {
    const snapshot = await db.collection('authors').get();
    console.log('email, password', email, password)
    const authors = [];
    snapshot.forEach((doc) => {
        const data = doc.data();
        authors.push({
            authorId: doc.id,
            ...data
        })
        console.log(doc.id);
    })
    const author = authors.find(_author => _author.email == email && _author.password == password);
    return author && { id: author.authorId, fullName: author.fullName, bio: author.bio }
}

const authorById = async (authorId) => {
    const snapshot = await db.collection('authors').get();
    const authors = [];
    snapshot.forEach((doc) => {
        const data = doc.data();
        authors.push({
            authorId: doc.id,
            ...data
        })
       
    })
    return authors.find(_author => _author.authorId == authorId);
}

const allAuthors = async () => {
    const snapshot = await db.collection('authors').get();
    const authors = [];
    snapshot.forEach((doc) => {
        const data = doc.data();
        authors.push({
            authorId: doc.id,
            ...data
        })
    })
    return authors.map(_author => ({
        authorId: _author.authorId,
        fullName: _author.fullName,
        bio: _author.bio,
        profilePicture: _author.profilePicture
    }))
}

module.exports = {
    addAuthor,
    logAuthor,
    authorById,
    allAuthors,
    updateAuthor,
    updateAuthorSubscription
}