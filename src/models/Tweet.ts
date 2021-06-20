/**
 * @typedef Tweet
 * @property {string} type.required - tweet | retweet | reply
 * @property {string} tweet_id.required
 * @property {string} tweeted_at.required
 * @property {string} writer_id.required
 * @property {string} writer_name.required
 * @property {string} writer_profile_img_src
 * @property {string} content.required
 * @property {Array.<string>} image_src_list
 * @property {string} reply_permission - follower | undefined (default: all users)
 * @property {number} reply_count.required
 * @property {number} retweet_count.required
 * @property {number} like_count.required
 * @property {boolean} retweet_flag.required - <currentUser>가 이 tweet을 retweet했는지
 * @property {boolean} like_flag.required - <currentUser>가 이 tweet을 like했는지
 * @property {string} retweet_writer_id - retweet일 경우, retweet한 사람의 id
 * @property {string} retweeted_at - retweet일 경우, 언제 retweet한건지
 * @property {string} reply_id - reply일 경우, 원래 tweet의 id
 */

export interface Tweet {
  type: 'tweet' | 'retweet' | 'reply';
  tweet_id: string;
  tweeted_at: string;
  writer_id: string;
  writer_name: string;
  writer_profile_img_src?: string;

  content: string;
  image_src_list?: string[];
  reply_permission?: 'follower';

  reply_count: number;
  retweet_count: number;
  like_count: number;

  retweet_flag: boolean;
  like_flag: boolean;

  retweet_writer_id?: string;
  retweeted_at?: string;

  reply_id?: string;
}

export interface TweetModel {
  type: 'tweet' | 'reply';
  tweet_id: string;
  tweeted_at: string;
  writer_id: string;

  content: string;
  image_src_list?: string[];
  reply_permission?: 'follower';

  reply_id?: string;
}

export interface RetweetModel {
  retweet_user_id: string;
  retweet_tweet_id: string;
  retweeted_at: string;
}

/**
 * @typedef TweetList
 * @property {number} totalCount.required
 * @property {Array.<Tweet>} tweets.required
 */

export interface TweetList {
  totalCount: number;
  data: Tweet[];
}
