/// <reference types="vite/client" />
import { createClient, SupabaseClient, User as SupabaseUser } from '@supabase/supabase-js';

// Client-side public credentials
const metaEnv = (import.meta as any).env || {};

const supabaseUrl: string = 
  metaEnv.VITE_SUPABASE_URL || 
  'https://placeholder-vendra-project.supabase.co';

const supabaseAnonKey: string = 
  metaEnv.VITE_SUPABASE_ANON_KEY || 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.placeholder-anon-key';

export const isSupabaseConfigured: boolean = 
  Boolean(metaEnv.VITE_SUPABASE_URL && metaEnv.VITE_SUPABASE_ANON_KEY);

if (!isSupabaseConfigured) {
  console.info(
    '[VENDRA Supabase] Running in standalone/preview mode. To enable direct Supabase live synchronization, configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.'
  );
}

// Initialize the Supabase client
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

export type { SupabaseUser };

/**
 * Sign in using Google via Supabase OAuth
 */
export async function signInWithGoogle(): Promise<{ error: Error | null; url?: string | null }> {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin
      }
    });

    if (error) throw error;
    return { error: null, url: data?.url };
  } catch (err: any) {
    console.error('[Supabase Auth] Google sign-in failed:', err);
    return { error: err, url: null };
  }
}

/**
 * Sign out from Supabase Auth
 */
export async function signOutSupabase(): Promise<void> {
  try {
    await supabase.auth.signOut();
  } catch (err) {
    console.warn('[Supabase Auth] Sign out error:', err);
  }
}

/**
 * Upload an avatar or receipt proof to Supabase Storage with automatic failover
 */
export async function uploadToSupabaseStorage(
  bucket: string,
  filePath: string,
  file: File | Blob
): Promise<{ url: string | null; error: Error | null }> {
  // If Supabase is not configured or in fallback mode, convert to local data URL
  if (!isSupabaseConfigured) {
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      return { url: dataUrl, error: null };
    } catch (readErr: any) {
      return { url: null, error: readErr };
    }
  }

  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, { upsert: true });

    if (error) throw error;

    const { data: publicData } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);

    return { url: publicData.publicUrl, error: null };
  } catch (err: any) {
    console.warn('[Supabase Storage] Cloud upload failed, using automatic resilient local fallback:', err?.message || err);
    // Automatic fallback to Data URL so user interaction never breaks
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      return { url: dataUrl, error: null };
    } catch {
      return { url: null, error: err };
    }
  }
}

export default supabase;
