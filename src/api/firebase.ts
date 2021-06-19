import config from '../config';
import firebase from 'firebase/app';
// import 'firebase/auth';
import 'firebase/firestore';
import FireStore from '../models/FireStore';
import { UserModel } from '../models/User';
import { RetweetModel, TweetModel } from '../models/Tweet';
import { TweetLikeModel } from '../models/TweetLike';
import { UserFollowModel } from '../models/UserFollow';

firebase.initializeApp({ ...config.firebase });

// const authService = firebase.auth();
const firestoreService = firebase.firestore();

export const userDatabase = new FireStore<UserModel>(
  firestoreService.collection('user'),
);

export const tweetDatabase = new FireStore<TweetModel>(
  firestoreService.collection('tweet'),
);

export const retweetDatabase = new FireStore<RetweetModel>(
  firestoreService.collection('retweet'),
);

export const tweetLikeDatabase = new FireStore<TweetLikeModel>(
  firestoreService.collection('tweet-like'),
);

export const userFollowDatabase = new FireStore<UserFollowModel>(
  firestoreService.collection('user-follow'),
);
