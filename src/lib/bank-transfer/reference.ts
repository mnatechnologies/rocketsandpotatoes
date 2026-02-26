import { createClient } from '@supabase/supabase-js';

const CHARS = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';

function generateCode(): string {
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += CHARS.charAt(Math.floor(Math.random() * CHARS.length));
  }
  return `ANB-${code}`;
}

export async function generateUniqueReference(): Promise<string> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  for (let attempt = 0; attempt < 10; attempt++) {
    const code = generateCode();
    const { data } = await supabase
      .from('bank_transfer_orders')
      .select('id')
      .eq('reference_code', code)
      .single();

    if (!data) return code;
  }

  throw new Error('Failed to generate unique reference code after 10 attempts');
}
