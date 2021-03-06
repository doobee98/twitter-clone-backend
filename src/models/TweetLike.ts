/**
 * @typedef TweetLike
 * @property {string} user_id.required
 * @property {string} tweet_id.required
 * @property {string} like_at.required
 */

export interface TweetLike {
  user_id: string;
  tweet_id: string;
  like_at: string;
}

export interface TweetLikeModel {
  user_id: string;
  tweet_id: string;
  like_at: string;
}
