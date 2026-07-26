import { IFeatureFlagRepository } from '../../domain/repositories/IFeatureFlagRepository';
import { FeatureFlag, UserRole, PlanId } from '../../domain/types/auth';

const FLAGS_KEY = 'as_feature_flags';

const DEFAULT_FLAGS: FeatureFlag[] = [
  {
    id: 'ff_1',
    key: 'enable_ai_ocr',
    name: 'Leitura de Comprovantes com IA',
    description: 'Permite extrair dados de notas fiscais e comprovantes automaticamente.',
    enabled: true,
    allowedRoles: ['admin', 'moderator', 'authenticated'],
    allowedPlans: ['professional', 'enterprise']
  },
  {
    id: 'ff_2',
    key: 'enable_custom_branding',
    name: 'Logotipo e Cores Personalizadas em PDFs',
    description: 'Permite alterar a identidade visual dos PDFs de orçamentos e recibos.',
    enabled: true,
    allowedRoles: ['admin', 'moderator', 'authenticated'],
    allowedPlans: ['basic', 'professional', 'enterprise']
  },
  {
    id: 'ff_3',
    key: 'enable_audit_logs',
    name: 'Logs de Auditoria e Segurança',
    description: 'Registra todas as ações e alterações realizadas pelos operadores.',
    enabled: true,
    allowedRoles: ['admin'],
    allowedPlans: ['professional', 'enterprise']
  },
  {
    id: 'ff_4',
    key: 'enable_multi_user',
    name: 'Múltiplos Operadores com RBAC',
    description: 'Permite criar contas com permissões customizadas por módulo.',
    enabled: true,
    allowedRoles: ['admin', 'moderator'],
    allowedPlans: ['basic', 'professional', 'enterprise']
  }
];

export class LocalFeatureFlagRepository implements IFeatureFlagRepository {
  private getFlagsList(): FeatureFlag[] {
    const raw = localStorage.getItem(FLAGS_KEY);
    if (raw) {
      try { return JSON.parse(raw); } catch { /* ignore */ }
    }
    localStorage.setItem(FLAGS_KEY, JSON.stringify(DEFAULT_FLAGS));
    return DEFAULT_FLAGS;
  }

  private saveFlagsList(flags: FeatureFlag[]): void {
    localStorage.setItem(FLAGS_KEY, JSON.stringify(flags));
  }

  async getFlags(): Promise<FeatureFlag[]> {
    return this.getFlagsList();
  }

  async getFlagByKey(key: string): Promise<FeatureFlag | null> {
    const flags = this.getFlagsList();
    return flags.find(f => f.key === key) || null;
  }

  async isFeatureEnabled(key: string, role?: UserRole, planId?: PlanId): Promise<boolean> {
    const flag = await this.getFlagByKey(key);
    if (!flag || !flag.enabled) return false;

    if (role && flag.allowedRoles.length > 0 && !flag.allowedRoles.includes(role)) {
      return false;
    }

    if (planId && flag.allowedPlans.length > 0 && !flag.allowedPlans.includes(planId)) {
      return false;
    }

    return true;
  }

  async toggleFlag(key: string, enabled: boolean): Promise<FeatureFlag> {
    const flags = this.getFlagsList();
    let updated: FeatureFlag | null = null;
    flags.forEach(f => {
      if (f.key === key) {
        f.enabled = enabled;
        updated = f;
      }
    });
    this.saveFlagsList(flags);
    if (!updated) throw new Error('Feature flag não encontrada');
    return updated;
  }
}
