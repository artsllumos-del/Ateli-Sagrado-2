import { useAuthContext } from '../context/AuthContext';

export const useAuth = () => {
  const {
    user,
    session,
    activeSessions,
    loading,
    login,
    loginWithGoogle,
    register,
    logout,
    recoverPassword,
    resetPassword,
    changePassword,
    confirmEmail,
    resendVerificationEmail,
    updateProfile,
    revokeSession,
    revokeAllOtherSessions,
    refreshData
  } = useAuthContext();

  return {
    user,
    session,
    activeSessions,
    isAuthenticated: Boolean(user && session),
    isAdmin: user?.role === 'admin',
    isModerator: user?.role === 'moderator' || user?.role === 'admin',
    loading,
    login,
    loginWithGoogle,
    register,
    logout,
    recoverPassword,
    resetPassword,
    changePassword,
    confirmEmail,
    resendVerificationEmail,
    updateProfile,
    revokeSession,
    revokeAllOtherSessions,
    refreshData
  };
};
