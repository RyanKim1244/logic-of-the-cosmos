export interface Problem {
  id: string;
  problemNumber: number;
  title: string;
  source: string;
  year: number;
  tags: string[];
  content: string;
  officialSolution: string;
  problemUrl?: string | null;
  solutionUrl?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Discussion {
  id: string;
  problemId: string;
  author: string;
  content: string;
  createdAt: string;
  parentId: string | null;
}

export interface Topic {
  id: string;
  title: string;
  content: string;
  author: string;
  tags: string[];
  createdAt: string;
  upvotes: number;
}

export interface Contest {
  id: string;
  name: string;
  shortName: string;
  description: string;
  website?: string;
  years: number[];
}

export interface ContestPreview {
  id: string;
  name: string;
  short_name: string;
  years: number[];
}

export interface TopicComment {
  id: string;
  topicId: string;
  author: string;
  content: string;
  createdAt: string;
  parentId: string | null;
  upvotes: number;
}

export interface StudyGroup {
  id: string;
  name: string;
  description: string;
  ownerId: string;
  ownerName?: string;
  memberCount?: number;
  createdAt: string;
}

export interface StudyGroupMember {
  groupId: string;
  userId: string;
  userName?: string;
  role: "owner" | "member";
  joinedAt: string;
}

export interface ProblemSet {
  id: string;
  title: string;
  description: string;
  ownerId: string;
  ownerName?: string;
  isPublic: boolean;
  timeLimitMinutes: number | null;
  problemCount?: number;
  createdAt: string;
}

export interface ProblemSetItem {
  id: string;
  setId: string;
  problemId: string;
  orderIndex: number;
  problem?: Problem;
}

export interface ExamSession {
  id: string;
  userId: string;
  problemSetId: string;
  startedAt: string;
  finishedAt: string | null;
  timeLimitMinutes: number;
  answers: Record<string, string>;
  score: number | null;
}
