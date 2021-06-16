/**
 * @typedef UserFollow
 * @property {string} following_user_id.required
 * @property {string} followed_user_id.required
 * @property {string} following_at.required
 */

export interface UserFollow {
  following_user_id: string;
  followed_user_id: string;
  following_at: string;
}

export interface UserFollowModel {
  following_user_id: string;
  followed_user_id: string;
  following_at: string;
}
