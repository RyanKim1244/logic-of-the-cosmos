-- ============================================
-- 회원가입 트리거 안정성 개선
-- handle_new_user_stats() 실패가 회원가입을 차단하지 않도록 수정
-- handle_new_user() 에러 로깅 강화
-- ============================================

-- 1. handle_new_user_stats(): 실패해도 회원가입 차단하지 않음 (비핵심)
-- user_stats는 나중에 재생성 가능하므로 에러를 삼킴
CREATE OR REPLACE FUNCTION public.handle_new_user_stats()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_stats (user_id) VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- 로그만 남기고 회원가입은 계속 진행
  RAISE LOG 'handle_new_user_stats failed for profile %: % % (non-blocking)', NEW.id, SQLERRM, SQLSTATE;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. handle_new_user(): 프로필 생성 실패 시에도 가능하면 복구
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

DROP TRIGGER IF EXISTS on_profile_created_stats ON profiles;
CREATE TRIGGER on_profile_created_stats
  AFTER INSERT ON profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_stats();
