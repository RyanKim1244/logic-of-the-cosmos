export interface Problem {
  id: string;
  title: string;
  source: string;
  year: number;
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

export interface Contest {
  id: string;
  name: string;
  shortName: string;
  description: string;
  website?: string;
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
