/**
 * @typedef Tweet
 * @property {string} type.required - tweet | retweet | reply
 * @property {string} tweet_id.required
 * @property {string} tweeted_at.required
 * @property {string} writer_id.required
 * @property {string} content.required
 * @property {Array.<string>} image_src_list
 * @property {number} reply_count.required
 * @property {number} retweet_count.required
 * @property {number} like_count.required
 */

export default interface Tweet {
  type: 'tweet' | 'retweet' | 'reply';
  tweet_id: string;
  tweeted_at: string;
  writer_id: string;

  content: string;
  image_src_list?: string[];

  reply_count: number;
  retweet_count: number;
  like_count: number;
}
