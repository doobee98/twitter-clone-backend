export default interface User {
  user_id: string;
  hashed_password?: string;
  username: string;
  following_num: number;
  follower_num: number;
  created_at: string;
  last_logined_at: string;
}
