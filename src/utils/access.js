import { ROLE_ADMIN } from "../constants/roles.js";

const canAccessUser = (requestingUser, targetUserId) => {
  return (
    String(requestingUser.id) === String(targetUserId) ||
    requestingUser.roles.includes(ROLE_ADMIN)
  );
};

export default canAccessUser;
