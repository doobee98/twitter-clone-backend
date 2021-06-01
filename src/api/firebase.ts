import config from '../config';
import firebase from 'firebase/app';
// import 'firebase/auth';
import 'firebase/firestore';
import FireStore from '../models/FireStore';
import User from '../models/User';

firebase.initializeApp({ ...config.firebase });

// const authService = firebase.auth();
const firestoreService = firebase.firestore();

export const userDatabase = new FireStore<User>(
  firestoreService.collection('user'),
);
