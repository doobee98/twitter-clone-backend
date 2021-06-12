export const getTweetLikeId = (userId: string, tweetId: string) => {
  return `${userId}-${tweetId}`;
};
