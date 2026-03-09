import { Contest } from "@/types";

export const contests: Contest[] = [
  {
    id: "ipho",
    name: "International Physics Olympiad",
    shortName: "IPhO",
    description: "국제 물리 올림피아드. 매년 전 세계 80여 개국에서 참가하는 물리학 최고 권위의 대회.",
    website: "https://www.ipho-new.org",
    years: [2023, 2022, 2021, 2020, 2019],
  },
  {
    id: "kpho",
    name: "Korean Physics Olympiad",
    shortName: "KPhO",
    description: "한국 물리 올림피아드. 대한민국 대표 물리학 경시대회로, IPhO 대표 선발의 기초가 되는 대회.",
    years: [2023, 2022, 2021, 2020, 2019],
  },
  {
    id: "icho",
    name: "International Chemistry Olympiad",
    shortName: "IChO",
    description: "국제 화학 올림피아드. 이론과 실험 두 파트로 구성되며, 화학 분야 최고 수준의 국제 대회.",
    website: "https://www.icho.us",
    years: [2023, 2022, 2021, 2020, 2019],
  },
  {
    id: "kmo",
    name: "Korean Mathematical Olympiad",
    shortName: "KMO",
    description: "한국 수학 올림피아드. 대한민국 수학 영재들이 참가하는 권위 있는 수학 경시대회.",
    years: [2023, 2022, 2021, 2020, 2019],
  },
  {
    id: "ibo",
    name: "International Biology Olympiad",
    shortName: "IBO",
    description: "국제 생물학 올림피아드. 생물학 전 분야를 아우르는 이론 및 실험 문제를 다루는 국제 대회.",
    website: "https://www.ibo-info.org",
    years: [2022, 2021, 2020, 2019],
  },
  {
    id: "snu-physics",
    name: "서울대학교 물리학과 기출",
    shortName: "서울대 물리학과",
    description: "서울대학교 물리학과 대학원 입학시험 및 학부 기출문제 모음.",
    years: [2023, 2022, 2021],
  },
];
