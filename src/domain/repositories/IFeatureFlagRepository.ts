import { FeatureFlag, UserRole, PlanId } from '../types/auth';

export interface IFeatureFlagRepository {
  getFlags(): Promise<FeatureFlag[]>;
  getFlagByKey(key: string): Promise<FeatureFlag | null>;
  isFeatureEnabled(key: string, role?: UserRole, planId?: PlanId): Promise<boolean>;
  toggleFlag(key: string, enabled: boolean): Promise<FeatureFlag>;
}
