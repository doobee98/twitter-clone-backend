/**
 * @typedef User
 * @property {string} user_id
 * @property {string} username
 * @property {number} following_num
 * @property {number} follower_num
 * @property {string} created_at
 * @property {string} last_logined_at
 */

export default interface User {
  user_id: string;
  hashed_password?: string;
  username: string;
  following_num: number;
  follower_num: number;
  created_at: string;
  last_logined_at: string;
}
