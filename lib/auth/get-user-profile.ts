import { createClient } from '@/lib/supabase/server';

export interface UserProfile {
  email: string;
  name: string | null;
  nickname: string | null;
  profileImage: string | null;
}

export async function getUserProfile(): Promise<UserProfile | null> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user?.email) {
    return null;
  }

  // employeesテーブルからユーザー情報を取得（メールアドレスで検索）
  const { data: employee } = await supabase
    .from('employees')
    .select('name, nickname, profile_image_url')
    .eq('email', user.email)
    .single();

  return {
    email: user.email,
    name: employee?.name || null,
    nickname: employee?.nickname || null,
    profileImage: employee?.profile_image_url || null,
  };
}
