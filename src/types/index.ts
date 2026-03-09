export type Difficulty = "easy" | "medium" | "hard" | "olympiad";

export type Subject = "physics" | "chemistry" | "biology" | "math" | "earth-science";

export interface Problem {
  id: string;
  title: string;
  source: string; // e.g., "IPhO 2023", "KPhO 2022", "서울대 기출 2024"
  year: number;
  subject: Subject;
  difficulty: Difficulty;
  tags: string[];
  content: string; // LaTeX-enabled markdown
  officialSolution: string; // LaTeX-enabled markdown
  createdAt: string;
  updatedAt: string;
}

export interface Discussion {
  id: string;
  problemId: string;
  author: string;
  content: string;
  createdAt: string;
  parentId: string | null; // for threaded replies
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
  easy: "bg-green-100 text-green-800",
  medium: "bg-yellow-100 text-yellow-800",
  hard: "bg-orange-100 text-orange-800",
  olympiad: "bg-red-100 text-red-800",
};

export const SUBJECT_COLORS: Record<Subject, string> = {
  physics: "bg-blue-100 text-blue-800",
  chemistry: "bg-purple-100 text-purple-800",
  biology: "bg-emerald-100 text-emerald-800",
  math: "bg-indigo-100 text-indigo-800",
  "earth-science": "bg-amber-100 text-amber-800",
};
