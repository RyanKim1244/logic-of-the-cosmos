import { Topic, TopicComment } from "@/types";

export const topics: Topic[] = [
  {
    id: "topic-1",
    title: "양자역학의 측정 문제에 대한 현대적 해석들",
    content:
      "코펜하겐 해석, 다세계 해석, 파일럿 파동 이론 등 양자역학의 측정 문제를 해결하려는 다양한 시도들에 대해 토론해봅시다. 여러분은 어떤 해석을 선호하시나요?",
    author: "QuantumPhilosopher",
    tags: ["양자역학", "물리학", "철학"],
    createdAt: "2024-03-20",
    upvotes: 12,
  },
  {
    id: "topic-2",
    title: "IPhO 2024 준비 스터디 모집",
    content:
      "올해 IPhO를 준비하는 분들과 함께 스터디를 하고 싶습니다. 매주 2-3문제씩 풀고 풀이를 공유하는 방식으로 진행하면 좋겠습니다. 관심 있으신 분은 댓글 남겨주세요!",
    author: "OlympiadDreamer",
    tags: ["IPhO", "스터디", "올림피아드"],
    createdAt: "2024-03-18",
    upvotes: 8,
  },
  {
    id: "topic-3",
    title: "유기화학 반응 메커니즘 정리 노트 공유",
    content:
      "IChO 준비하면서 정리한 유기화학 반응 메커니즘 노트를 공유합니다. SN1, SN2, E1, E2부터 Diels-Alder, Claisen 재배열까지 정리했습니다. 피드백 환영합니다.",
    author: "ChemNerd99",
    tags: ["화학", "유기화학", "IChO"],
    createdAt: "2024-03-15",
    upvotes: 15,
  },
  {
    id: "topic-4",
    title: "미분기하학을 일반상대론에 어떻게 적용하나요?",
    content:
      "리만 기하학과 텐서 해석학의 기초를 공부하고 있는데, 이것이 아인슈타인 장 방정식으로 어떻게 연결되는지 큰 그림이 잘 안 그려집니다. 경험 있으신 분들의 조언을 구합니다.",
    author: "GravityStudent",
    tags: ["수학", "물리학", "일반상대론"],
    createdAt: "2024-03-12",
    upvotes: 6,
  },
  {
    id: "topic-5",
    title: "CRISPR-Cas9 이후 유전자 편집 기술의 미래",
    content:
      "Prime editing, Base editing 등 CRISPR 이후의 유전자 편집 기술들이 빠르게 발전하고 있습니다. 이 기술들의 장단점과 앞으로의 전망에 대해 이야기해봅시다.",
    author: "BioFuturist",
    tags: ["생물학", "유전공학", "CRISPR"],
    createdAt: "2024-03-10",
    upvotes: 10,
  },
];

export const topicComments: TopicComment[] = [
  {
    id: "tc-1",
    topicId: "topic-1",
    author: "WaveFunctionCollapse",
    content:
      "저는 다세계 해석을 선호합니다. 수학적으로 가장 깔끔하고, 관측자의 특별한 역할을 가정하지 않아도 되니까요. 다만 검증 불가능성이 철학적 약점이긴 합니다.",
    createdAt: "2024-03-21",
    parentId: null,
    upvotes: 5,
  },
  {
    id: "tc-2",
    topicId: "topic-1",
    author: "QuantumPhilosopher",
    content:
      "동의합니다. 하지만 Occam's razor를 적용하면 무한히 많은 세계를 가정하는 것이 정말 '단순한' 해석인지 의문이 들기도 합니다.",
    createdAt: "2024-03-21",
    parentId: "tc-1",
    upvotes: 3,
  },
  {
    id: "tc-3",
    topicId: "topic-2",
    author: "PhysicsKid",
    content: "저도 참여하고 싶습니다! 현재 KPhO 은상 수준인데, IPhO까지 도전해보고 싶어요.",
    createdAt: "2024-03-19",
    parentId: null,
    upvotes: 2,
  },
  {
    id: "tc-4",
    topicId: "topic-3",
    author: "ReactionMaster",
    content:
      "정리 잘 하셨네요! 한 가지 추가하면, Woodward-Hoffmann 규칙도 IChO에서 자주 출제되니 포함시키면 좋을 것 같습니다.",
    createdAt: "2024-03-16",
    parentId: null,
    upvotes: 4,
  },
  {
    id: "tc-5",
    topicId: "topic-4",
    author: "TensorCalcPro",
    content:
      "Sean Carroll의 'Spacetime and Geometry' 교재를 추천합니다. 미분기하 → 측지선 방정식 → 아인슈타인 텐서로 자연스럽게 연결해줍니다.",
    createdAt: "2024-03-13",
    parentId: null,
    upvotes: 7,
  },
];
