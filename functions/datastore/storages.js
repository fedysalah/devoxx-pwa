const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp(functions.config().firebase);
const db = admin.firestore();
const settings = {timestampsInSnapshots: true};
db.settings(settings);

const storage = admin.storage();
const bucket = storage.bucket();

module.exports = {db, bucket};


