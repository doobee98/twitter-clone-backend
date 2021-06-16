export const getUserFollowId = (userId: string, followUserId: string) => {
  return `${userId}-${followUserId}`;
};
