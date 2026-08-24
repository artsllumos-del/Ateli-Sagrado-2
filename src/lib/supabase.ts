import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Configuration keys for custom client storage
const CONFIG_KEY = 'atelie_supabase_config_v1';

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  connected?: boolean;
  lastTested?: string;
}

// Read from env or localStorage
export function getSupabaseCredentials(): SupabaseConfig {
  try {
    const stored = localStorage.getItem(CONFIG_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.url && parsed.anonKey) {
        return parsed;
      }
    }
  } catch (e) {
    // Ignore error
  }

  const metaEnv = (import.meta as any)?.env || {};
  const envUrl = (metaEnv.VITE_SUPABASE_URL as string) || '';
  const envKey = (metaEnv.VITE_SUPABASE_ANON_KEY as string) || '';

  return {
    url: envUrl.trim(),
    anonKey: envKey.trim(),
  };
}

export function saveSupabaseCredentials(url: string, anonKey: string): void {
  try {
    localStorage.setItem(CONFIG_KEY, JSON.stringify({
      url: url.trim(),
      anonKey: anonKey.trim(),
      lastTested: new Date().toISOString()
    }));
    // Re-instantiate client
    cachedClient = null;
  } catch (e) {
    console.warn('Failed to store Supabase configuration in localStorage', e);
  }
}

export function isSupabaseConfigured(): boolean {
  const creds = getSupabaseCredentials();
  return Boolean(creds.url && creds.anonKey && creds.url.startsWith('http'));
}

let cachedClient: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (cachedClient) return cachedClient;

  const creds = getSupabaseCredentials();
  if (!creds.url || !creds.anonKey) {
    return null;
  }

  try {
    cachedClient = createClient(creds.url, creds.anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
      db: {
        schema: 'public',
      }
    });
    return cachedClient;
  } catch (error) {
    console.warn('Could not initialize Supabase Client:', error);
    return null;
  }
}

export const supabase = getSupabaseClient();

/**
 * Test connectivity with Supabase by performing a lightweight ping
 */
export async function testSupabaseConnection(url?: string, anonKey?: string): Promise<{ success: boolean; message: string }> {
  try {
    const targetUrl = url || getSupabaseCredentials().url;
    const targetKey = anonKey || getSupabaseCredentials().anonKey;

    if (!targetUrl || !targetKey) {
      return { success: false, message: 'URL e Anon Key do Supabase são obrigatórios.' };
    }

    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
      return { success: false, message: 'A URL do Supabase deve começar com https://' };
    }

    const testClient = createClient(targetUrl, targetKey);
    
    // Quick test query against public schema (e.g. auth check or health ping)
    const { error } = await testClient.from('tenants').select('id').limit(1);

    if (error) {
      // If table doesn't exist yet, it is still a valid connection to Supabase!
      if (error.code === '42P01' || error.message.includes('relation "public.tenants" does not exist')) {
        return {
          success: true,
          message: 'Conexão com o Supabase estabelecida com sucesso! (Tabelas ainda não foram criadas - execute o script SQL).'
        };
      }
      return { success: false, message: `Erro ao consultar Supabase: ${error.message} (Código: ${error.code})` };
    }

    return { success: true, message: 'Conectado ao Supabase com sucesso!' };
  } catch (err: any) {
    return { success: false, message: err.message || 'Falha ao conectar com o servidor Supabase.' };
  }
}
