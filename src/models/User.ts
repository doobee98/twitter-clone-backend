/**
 * @typedef User
 * @property {string} user_id.required
 * @property {string} username.required
 * @property {number} following_count.required
 * @property {number} follower_count.required
 * @property {string} joined_at.required
 * @property {string} profile_img_src
 * @property {string} bio - 자기소개
 * @property {string} website
 * @property {string} location
 * @property {boolean} following_flag
 */

export interface User {
  user_id: string;
  username: string;
  following_count: number;
  follower_count: number;
  joined_at: string;

  profile_img_src?: string;
  bio?: string;
  website?: string;
  location?: string;

  following_flag?: boolean;
}

export interface UserModel {
  user_id: string;
  username: string;
  joined_at: string;

  profile_img_src?: string;
  bio?: string;
  website?: string;
  location?: string;

  hashed_password?: string;
}
