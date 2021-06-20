import { userFollowDatabase } from '../../api/firebase';
import { User, UserModel } from 'models/User';

interface TempUser extends User {
  hashed_password?: string;
  user_id_lowercase?: string;
  username_lowercase?: string;
}

export const getUserFollowId = (userId: string, followUserId: string) => {
  return `${userId}-${followUserId}`;
};

interface getUserFromModelParams {
  currentUserId?: string;
}

export const getUserFromModel = async (
  userModel: UserModel,
  params: getUserFromModelParams,
): Promise<User> => {
  const { currentUserId } = params;

  const followingIdList = await userFollowDatabase.queryAllId((collection) =>
    collection.where('following_user_id', '==', userModel.user_id),
  );
  const followingCount = followingIdList.length;

  const followerIdList = await userFollowDatabase.queryAllId((collection) =>
    collection.where('followed_user_id', '==', userModel.user_id),
  );
  const followerCount = followerIdList.length;

  let followingFlag = false;
  if (currentUserId && currentUserId !== userModel.user_id) {
    const userFollowId = getUserFollowId(currentUserId, userModel.user_id);
    followingFlag = await userFollowDatabase.has(userFollowId);
  }

  const user: TempUser = {
    ...userModel,
    following_count: followingCount,
    follower_count: followerCount,
    following_flag: followingFlag,
  };

  delete user.hashed_password;
  delete user.user_id_lowercase;
  delete user.username_lowercase;

  return user;
};
