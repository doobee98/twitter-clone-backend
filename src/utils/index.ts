import crypto from 'crypto';

export const createHash = async (str: string): Promise<string> => {
  // TODO: salt 등으로 고도화 필요함
  return crypto.createHash('sha512').update(str).digest('base64');
};
