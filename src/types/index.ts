export type Difficulty = "easy" | "medium" | "hard" | "olympiad";

export type Subject = "physics" | "chemistry" | "biology" | "math" | "earth-science";

export interface Problem {
  id: string;
  title: string;
  source: string;
  year: number;
  subject: Subject;
  difficulty: Difficulty;
  tags: string[];
  content: string;
  officialSolution: string;
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

export interface TopicComment {
  id: string;
  topicId: string;
  author: string;
  content: string;
  createdAt: string;
  parentId: string | null;
  upvotes: number;
}

export const SUBJECT_LABELS: Record<Subject, string> = {
  physics: "물리학",
  chemistry: "화학",
  biology: "생물학",
  math: "수학",
  "earth-science": "지구과학",
};

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy: "기초",
  medium: "중급",
  hard: "고급",
  olympiad: "올림피아드",
};

export const DIFFICULTY_COLORS: Record<Difficulty, string> = {
  easy: "bg-neutral-200 text-neutral-700",
  medium: "bg-neutral-300 text-neutral-800",
  hard: "bg-neutral-700 text-neutral-100",
  olympiad: "bg-black text-white",
};

export const SUBJECT_COLORS: Record<Subject, string> = {
  physics: "bg-neutral-100 text-neutral-800 border border-neutral-300",
  chemistry: "bg-neutral-100 text-neutral-800 border border-neutral-300",
  biology: "bg-neutral-100 text-neutral-800 border border-neutral-300",
  math: "bg-neutral-100 text-neutral-800 border border-neutral-300",
  "earth-science": "bg-neutral-100 text-neutral-800 border border-neutral-300",
};
