import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "개인정보처리방침",
};

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <nav className="mb-8">
        <Link href="/" className="text-neutral-400 hover:text-black text-xs uppercase tracking-wider transition-colors">
          &larr; 홈
        </Link>
      </nav>

      <h1 className="text-3xl font-light text-black mb-2">개인정보처리방침</h1>
      <p className="text-xs text-neutral-400 mb-10">최종 수정일: 2026년 4월 1일</p>

      <div className="space-y-8 text-sm text-neutral-600 leading-relaxed">
        <section>
          <h2 className="text-base font-medium text-black mb-3">1. 수집하는 개인정보 항목</h2>
          <p>서비스는 회원가입 및 서비스 이용을 위해 다음과 같은 개인정보를 수집합니다:</p>
          <ul className="list-disc pl-5 space-y-2 mt-2">
            <li><strong>필수 항목:</strong> 이메일 주소, 이름(닉네임), 비밀번호</li>
            <li><strong>자동 수집:</strong> 접속 로그, 접속 IP, 브라우저 정보, 서비스 이용 기록</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-medium text-black mb-3">2. 개인정보의 수집 및 이용 목적</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>회원 식별 및 가입 의사 확인</li>
            <li>서비스 제공 및 개인화 (학습 기록, 북마크 등)</li>
            <li>커뮤니티 활동 시 작성자 표시</li>
            <li>서비스 개선 및 통계 분석</li>
            <li>부정 이용 방지 및 서비스 안정성 확보</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-medium text-black mb-3">3. 개인정보의 보유 및 이용 기간</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>회원 탈퇴 시까지 보유하며, 탈퇴 요청 시 지체 없이 파기합니다.</li>
            <li>단, 관련 법령에 따라 보존이 필요한 경우 해당 기간 동안 보관합니다.</li>
            <li>접속 기록: 통신비밀보호법에 따라 3개월 보관</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-medium text-black mb-3">4. 개인정보의 제3자 제공</h2>
          <p>
            서비스는 이용자의 개인정보를 원칙적으로 외부에 제공하지 않습니다. 다만 다음의 경우에는 예외로 합니다:
          </p>
          <ul className="list-disc pl-5 space-y-2 mt-2">
            <li>이용자가 사전에 동의한 경우</li>
            <li>법령의 규정에 의하거나 수사 목적으로 법령에 정해진 절차와 방법에 따라 수사기관의 요구가 있는 경우</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-medium text-black mb-3">5. 개인정보의 처리 위탁</h2>
          <p>서비스는 원활한 서비스 제공을 위해 다음과 같이 개인정보 처리를 위탁합니다:</p>
          <div className="border border-neutral-200 rounded-lg overflow-hidden mt-3">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-neutral-50">
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-neutral-500 uppercase">수탁 업체</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-neutral-500 uppercase">위탁 업무</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                <tr>
                  <td className="px-4 py-2.5">Supabase Inc.</td>
                  <td className="px-4 py-2.5">데이터베이스 호스팅, 인증 서비스</td>
                </tr>
                <tr>
                  <td className="px-4 py-2.5">Google LLC</td>
                  <td className="px-4 py-2.5">AI 학습 도우미 (Gemini API)</td>
                </tr>
                <tr>
                  <td className="px-4 py-2.5">Vercel Inc.</td>
                  <td className="px-4 py-2.5">웹 호스팅 및 배포</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="text-base font-medium text-black mb-3">6. 이용자의 권리</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>이용자는 언제든지 자신의 개인정보를 조회하거나 수정할 수 있습니다.</li>
            <li>회원 탈퇴를 통해 개인정보의 삭제를 요청할 수 있습니다.</li>
            <li>개인정보 관련 문의는 서비스 관리자에게 연락해 주시기 바랍니다.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-medium text-black mb-3">7. 개인정보의 안전성 확보 조치</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>비밀번호는 암호화하여 저장하며, 서비스 관리자도 확인할 수 없습니다.</li>
            <li>SSL/TLS 암호화 통신을 통해 데이터를 보호합니다.</li>
            <li>접근 권한을 최소화하고, 관리자 계정은 별도로 관리합니다.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-medium text-black mb-3">8. 쿠키의 사용</h2>
          <p>
            서비스는 로그인 유지 및 서비스 이용 편의를 위해 쿠키를 사용합니다.
            이용자는 브라우저 설정을 통해 쿠키를 거부할 수 있으나, 이 경우 일부 서비스 이용이 제한될 수 있습니다.
          </p>
        </section>

        <section>
          <h2 className="text-base font-medium text-black mb-3">9. 개인정보처리방침의 변경</h2>
          <p>
            이 개인정보처리방침은 관련 법령 및 서비스 정책에 따라 변경될 수 있으며,
            변경 시 서비스 내 공지를 통해 안내합니다.
          </p>
        </section>
      </div>
    </div>
  );
}
