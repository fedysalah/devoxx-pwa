const { bucket} = require('./storages');
const uuid = require('uuid/v4');

const uploadImage = async (image) => {
    if (!image.startsWith('data:image/')) return Promise.reject('bad mime type');
    const mimeType = image.substring(5, image.indexOf(';'));
    const extension = mimeType.replace('image/', '');
    const base64EncodedImageString = image.replace(/^data:image\/\w+;base64,/, '');
    const imageBuffer = new Buffer(base64EncodedImageString, 'base64');
    const fileName = `${uuid()}.${extension}`;
    return new Promise((resolve, reject) => {
        var file = bucket.file('post-images/' + fileName);
        file.save(imageBuffer, {
            metadata: {
                contentType: mimeType
            },
            public: true,
            validation: 'md5'
        }, ((error) => {
            if (error) {
                reject(error)
            } else {
                resolve(`https://firebasestorage.googleapis.com/v0/b/airbeerandbeer.appspot.com/o/post-images%2F${fileName}?alt=media`)
            }
        }));
    })
}

module.exports = {
    uploadImage
}