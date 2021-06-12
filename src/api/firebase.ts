import config from '../config';
import firebase from 'firebase/app';
// import 'firebase/auth';
import 'firebase/firestore';
import FireStore from '../models/FireStore';
import User from '../models/User';
import Tweet from '../models/Tweet';
import TweetLike from '../models/TweetLike';

firebase.initializeApp({ ...config.firebase });

// const authService = firebase.auth();
const firestoreService = firebase.firestore();

export const userDatabase = new FireStore<User>(
  firestoreService.collection('user'),
);

export const tweetDatabase = new FireStore<Tweet>(
  firestoreService.collection('tweet'),
);

export const tweetLikeDatabase = new FireStore<TweetLike>(
  firestoreService.collection('tweet-like'),
);
