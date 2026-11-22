let token = null;
let user = null;

export const getAuthToken = () => token;
export const getSessionUser = () => user;

export function setAuthSession(nextToken, nextUser) {
  token = nextToken;
  user = nextUser;
}

export function updateSessionUser(changes) {
  if (user) user = { ...user, ...changes };
}
