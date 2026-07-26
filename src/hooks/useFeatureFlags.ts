import { useAuthContext } from '../context/AuthContext';

export const useFeatureFlags = () => {
  const { isFeatureEnabled } = useAuthContext();

  return {
    isFeatureEnabled: (key: string) => isFeatureEnabled(key)
  };
};
