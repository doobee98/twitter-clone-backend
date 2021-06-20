/* ============================
 * Auth 내에서 사용되는 typedef
 * ============================
 * */

/**
 * 로그인 파라미터
 * @typedef LoginEntry
 * @property {string} id.required
 * @property {string} password.required
 */

/**
 * 회원가입 폼
 * @typedef signupEntry
 * @property {string} id.required
 * @property {string} password.required
 * @property {string} username.required
 */

/* ============================
 * Tweets 내에서 사용되는 typedef
 * ============================
 * */

/**
 * 새로운 트윗 작성 파라미터
 * @typedef tweetCreateEntry
 * @property {string} content.required
 * @property {Array.<string>} image_src_list
 * @property {string} reply_permission - follower | undefined (default: all users)
 */

/**
 * 작성한 특정 트윗 수정 파라미터
 * @typedef tweetEditEntry
 * @property {string} content
 * @property {Array.<string>} image_src_list
 * @property {string} reply_permission - follower | undefined (default: all users)
 */

/**
 * 트윗 피드 리스트 파라미터
 * @typedef tweetFeedEntry
 * @property {number} offset.required - 시작점, 0이 아니라 1부터 시작합니다. 100이면 100번째 데이터부터 시작
 * @property {number} count.required - 시작점부터 가져오는 개수, 5이면 100부터 104까지 가져옴
 */
