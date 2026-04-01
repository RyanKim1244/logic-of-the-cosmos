import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "이용약관",
};

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <nav className="mb-8">
        <Link href="/" className="text-neutral-400 hover:text-black text-xs uppercase tracking-wider transition-colors">
          &larr; 홈
        </Link>
      </nav>

      <h1 className="text-3xl font-light text-black mb-2">이용약관</h1>
      <p className="text-xs text-neutral-400 mb-10">최종 수정일: 2026년 4월 1일</p>

      <div className="space-y-8 text-sm text-neutral-600 leading-relaxed">
        <section>
          <h2 className="text-base font-medium text-black mb-3">제1조 (목적)</h2>
          <p>
            이 약관은 Logic of The Cosmos(이하 &quot;서비스&quot;)가 제공하는 과학 올림피아드 학습 플랫폼 서비스의 이용과 관련하여, 서비스와 이용자 간의 권리·의무 및 책임사항, 기타 필요한 사항을 규정하는 것을 목적으로 합니다.
          </p>
        </section>

        <section>
          <h2 className="text-base font-medium text-black mb-3">제2조 (정의)</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>&quot;서비스&quot;란 Logic of The Cosmos가 제공하는 웹사이트 및 관련 기능 일체를 의미합니다.</li>
            <li>&quot;이용자&quot;란 서비스에 접속하여 이 약관에 따라 서비스를 이용하는 회원 및 비회원을 말합니다.</li>
            <li>&quot;회원&quot;이란 서비스에 가입하여 계정을 보유한 이용자를 말합니다.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-medium text-black mb-3">제3조 (서비스의 제공)</h2>
          <p>서비스는 다음과 같은 기능을 제공합니다:</p>
          <ul className="list-disc pl-5 space-y-2 mt-2">
            <li>과학 올림피아드 문제 열람 및 학습</li>
            <li>AI 기반 문제 학습 도우미</li>
            <li>커뮤니티 토론 및 풀이 공유</li>
            <li>문제 세트 및 스터디 그룹 기능</li>
            <li>개인 학습 기록 관리</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-medium text-black mb-3">제4조 (회원가입 및 계정)</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>회원가입은 이용자가 약관에 동의한 후 가입 양식을 작성하여 신청하고, 서비스가 이를 승인함으로써 체결됩니다.</li>
            <li>회원은 자신의 계정 정보를 정확하게 유지할 의무가 있으며, 타인에게 계정을 공유하거나 양도할 수 없습니다.</li>
            <li>회원은 언제든지 서비스 탈퇴를 요청할 수 있으며, 서비스는 관련 법령에 따라 처리합니다.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-medium text-black mb-3">제5조 (이용자의 의무)</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>이용자는 서비스를 학습 목적으로만 이용하여야 합니다.</li>
            <li>타인의 저작권을 침해하는 콘텐츠를 게시하여서는 안 됩니다.</li>
            <li>다른 이용자에 대한 비방, 혐오 발언, 스팸 등 부적절한 행위를 하여서는 안 됩니다.</li>
            <li>서비스의 정상적인 운영을 방해하는 행위를 하여서는 안 됩니다.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-medium text-black mb-3">제6조 (저작권 및 지적재산권)</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>서비스가 자체 제작한 콘텐츠(LoTC 고유 문제 등)의 저작권은 서비스에 귀속됩니다.</li>
            <li>외부 기출문제는 각 출처 기관의 저작권 정책을 따르며, 서비스는 공식 링크를 통해 원본을 안내합니다.</li>
            <li>이용자가 작성한 풀이, 토론 게시물의 저작권은 해당 이용자에게 있으며, 서비스 내에서의 공유에 동의한 것으로 간주합니다.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-medium text-black mb-3">제7조 (면책사항)</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>서비스는 AI 학습 도우미의 답변 정확성을 보장하지 않습니다.</li>
            <li>천재지변, 시스템 장애 등 불가항력으로 인한 서비스 중단에 대해 책임을 지지 않습니다.</li>
            <li>이용자 간 분쟁에 대해 서비스는 개입 의무를 지지 않습니다.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-medium text-black mb-3">제8조 (약관의 변경)</h2>
          <p>
            서비스는 필요한 경우 약관을 변경할 수 있으며, 변경된 약관은 서비스 내 공지를 통해 효력이 발생합니다.
            변경된 약관에 동의하지 않는 회원은 탈퇴할 수 있습니다.
          </p>
        </section>
      </div>
    </div>
  );
}
