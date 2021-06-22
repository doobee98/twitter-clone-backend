import crypto from 'crypto';

export const createHash = async (str: string): Promise<string> => {
  // TODO: salt 등으로 고도화 필요함
  return crypto.createHash('sha512').update(str).digest('base64');
};

export const arrayEquals = <T>(arr1: T[], arr2: T[]) => {
  return arr1.length === arr2.length && arr1.every((v, idx) => v === arr2[idx]);
};

export const sanitizeUndefined = (obj: { [key: string]: any }) => {
  let objCopied = { ...obj };
  Object.keys(obj).forEach((key) => {
    if (obj[key] === undefined) {
      delete objCopied[key];
    }
  });
  return objCopied;
};

export const getCurrentDate = () => new Date().toISOString();
