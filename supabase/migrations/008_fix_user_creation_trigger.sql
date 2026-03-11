-- ============================================
-- 회원가입 시 "Database error saving new user" 오류 수정
-- handle_new_user() 트리거 함수 및 handle_new_user_stats() 재생성
-- SECURITY DEFINER 확보 (profiles 테이블에 INSERT RLS 정책 없음)
-- ============================================

-- 1. handle_new_user(): auth.users INSERT 후 profiles 행 생성
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', '사용자'),
    COALESCE(NEW.email, '')
  );
  RETURN NEW;
EXCEPTION WHEN unique_violation THEN
  -- 이미 프로필이 존재하면 무시 (재가입 등)
  RETURN NEW;
WHEN OTHERS THEN
  RAISE LOG 'handle_new_user failed for user %: % %', NEW.id, SQLERRM, SQLSTATE;
  RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 트리거 재생성 (멱등)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. handle_new_user_stats(): profiles INSERT 후 user_stats 행 생성
CREATE OR REPLACE FUNCTION public.handle_new_user_stats()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_stats (user_id) VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE LOG 'handle_new_user_stats failed for profile %: % %', NEW.id, SQLERRM, SQLSTATE;
  RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 트리거 재생성 (멱등)
DROP TRIGGER IF EXISTS on_profile_created_stats ON profiles;
CREATE TRIGGER on_profile_created_stats
  AFTER INSERT ON profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_stats();
