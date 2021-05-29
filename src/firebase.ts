import config from './config';
import firebase from 'firebase/app';
import 'firebase/auth';
import 'firebase/firestore';

firebase.initializeApp({ ...config.firebase });

export const authService = firebase.auth();
export const databaseService = firebase.firestore();
