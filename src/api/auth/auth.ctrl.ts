import { RequestHandler } from 'express';
import { authService } from '../../firebase';

export const currentUser: RequestHandler = async (req, res, next) => {
  res.send(authService.currentUser);
};

export const login: RequestHandler = async (req, res, next) => {
  const { email, password } = req.body;

  authService
    .signInWithEmailAndPassword(email as string, password as string)
    .then((userCredential) => {
      res.send(userCredential);
    })
    .catch((error) => {
      next(error);
    });
};

export const logout: RequestHandler = async (req, res, next) => {
  authService
    .signOut()
    .then(() => {
      res.send('success');
    })
    .catch((error) => {
      next(error);
    });
};

export const signup: RequestHandler = async (req, res, next) => {
  const { email, password } = req.body;

  authService
    .createUserWithEmailAndPassword(email as string, password as string)
    .then((userCredential) => {
      res.send(userCredential);
    })
    .catch((error) => {
      next(error);
    });
};
