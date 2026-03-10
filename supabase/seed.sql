-- ============================================
-- Logic of The Cosmos - Seed Data
-- ============================================
-- schema.sql 실행 후에 이 파일을 실행하세요.

-- Problems
INSERT INTO problems (id, problem_number, title, source, year, tags, content, official_solution, created_at, updated_at) VALUES
('ipho-2023-1', 1000, 'Relativistic Particle in Magnetic Field', 'IPhO 2023', 2023,
  ARRAY['electromagnetism', 'special-relativity', 'charged-particles'],
  E'A charged particle with rest mass $m_0$ and charge $q$ enters a uniform magnetic field $\\vec{B} = B\\hat{z}$ with an initial velocity $\\vec{v_0} = v_0 \\hat{x}$, where $v_0 = 0.8c$.\n\n(a) Derive the equation of motion for the particle in the relativistic regime.\n\n(b) Find the radius of curvature of the particle''s trajectory.\n\n(c) Calculate the cyclotron frequency $\\omega_c$ and compare it with the non-relativistic result.\n\n**Hint:** The relativistic momentum is given by $\\vec{p} = \\gamma m_0 \\vec{v}$, where $\\gamma = \\frac{1}{\\sqrt{1 - v^2/c^2}}$.',
  E'**(a)** The relativistic equation of motion is:\n\n$$\\frac{d\\vec{p}}{dt} = q\\vec{v} \\times \\vec{B}$$\n\nwhere $\\vec{p} = \\gamma m_0 \\vec{v}$.\n\nSince the magnetic force is always perpendicular to the velocity, $|\\vec{v}|$ remains constant, so $\\gamma$ is also constant.\n\nTherefore: $\\gamma m_0 \\frac{d\\vec{v}}{dt} = q\\vec{v} \\times \\vec{B}$\n\n**(b)** For circular motion in the $xy$-plane:\n\n$$\\gamma m_0 \\frac{v_0^2}{R} = qv_0 B$$\n\n$$R = \\frac{\\gamma m_0 v_0}{qB}$$\n\nWith $v_0 = 0.8c$, we get $\\gamma = \\frac{1}{\\sqrt{1-0.64}} = \\frac{5}{3}$\n\n$$R = \\frac{5m_0 \\cdot 0.8c}{3qB} = \\frac{4m_0 c}{3qB}$$\n\n**(c)** The cyclotron frequency:\n\n$$\\omega_c = \\frac{v_0}{R} = \\frac{qB}{\\gamma m_0} = \\frac{3qB}{5m_0}$$\n\nThe non-relativistic cyclotron frequency would be $\\omega_0 = \\frac{qB}{m_0}$, so:\n\n$$\\omega_c = \\frac{\\omega_0}{\\gamma} = \\frac{3}{5}\\omega_0$$\n\nThe relativistic cyclotron frequency is reduced by a factor of $\\gamma$.',
  '2026-01-15', '2026-01-15'),

('kpho-2022-3', 1001, '열역학적 엔진의 효율', 'KPhO 2022', 2022,
  ARRAY['thermodynamics', 'carnot-cycle', 'entropy'],
  E'이상 기체 $n$ 몰이 다음과 같은 순환 과정을 거친다:\n\n1. 상태 A$(V_1, P_1)$에서 상태 B$(V_2, P_1)$로의 등압 팽창\n2. 상태 B에서 상태 C$(V_2, P_2)$로의 등적 과정\n3. 상태 C에서 상태 D$(V_1, P_2)$로의 등압 압축\n4. 상태 D에서 상태 A로의 등적 과정\n\n여기서 $V_2 = 2V_1$, $P_1 = 3P_2$이다.\n\n(a) 이 순환 과정의 $P$-$V$ 다이어그램을 그리시오.\n\n(b) 각 과정에서의 열량 $Q$를 구하시오. (단, 이상 기체의 정적 몰 비열은 $C_v = \\frac{3}{2}R$)\n\n(c) 이 열기관의 효율 $\\eta$를 구하시오.',
  E'**(a)** $P$-$V$ 다이어그램은 직사각형 형태로, 꼭짓점이 A$(V_1, P_1)$, B$(V_2, P_1)$, C$(V_2, P_2)$, D$(V_1, P_2)$이다.\n\n**(b)** 이상 기체의 정압 몰 비열: $C_p = C_v + R = \\frac{5}{2}R$\n\n효율: $\\eta = \\frac{4}{21} \\approx 19.0\\%$',
  '2026-02-01', '2026-02-01'),

('icho-2023-2', 1002, 'Coordination Chemistry of Transition Metals', 'IChO 2023', 2023,
  ARRAY['coordination-chemistry', 'crystal-field-theory', 'spectroscopy'],
  E'A transition metal complex $[\\text{Co}(\\text{NH}_3)_6]^{3+}$ absorbs light at $\\lambda = 475 \\text{ nm}$.\n\n(a) Calculate the crystal field splitting energy $\\Delta_o$ in $\\text{kJ/mol}$.\n\n(b) Predict whether this complex is high-spin or low-spin.\n\n(c) Draw the $d$-orbital splitting diagram and show the electron configuration.\n\n(d) Explain why $[\\text{CoF}_6]^{3-}$ has a different color from $[\\text{Co}(\\text{NH}_3)_6]^{3+}$.\n\n**Given:** $h = 6.626 \\times 10^{-34}$ J·s, $c = 3.0 \\times 10^8$ m/s, $N_A = 6.022 \\times 10^{23}$ mol$^{-1}$',
  E'**(a)** $\\Delta_o = 252 \\text{ kJ/mol}$\n\n**(b)** Low-spin.\n\n**(c)** $t_{2g}^6 e_g^0$\n\n**(d)** $\\text{F}^-$ is a weak-field ligand, smaller $\\Delta_o$, different absorbed wavelength.',
  '2026-01-20', '2026-01-20'),

('kmo-2023-1', 1003, '정수론: 소수의 성질', 'KMO 2023', 2023,
  ARRAY['number-theory', 'primes', 'modular-arithmetic'],
  E'$p$가 5 이상의 소수일 때, 다음을 증명하시오.\n\n$$1^{p-1} + 2^{p-1} + 3^{p-1} + \\cdots + (p-1)^{p-1} \\equiv -1 \\pmod{p}$$',
  E'페르마의 소정리에 의해 각 항 $k^{p-1} \\equiv 1 \\pmod{p}$이므로 합은 $p-1 \\equiv -1 \\pmod{p}$.',
  '2026-03-10', '2026-03-10'),

('ibo-2022-1', 1004, 'Gene Expression and Regulation', 'IBO 2022', 2022,
  ARRAY['molecular-biology', 'gene-regulation', 'lac-operon'],
  E'The *lac* operon in *E. coli* is a classic model of gene regulation.\n\n(a) Draw the structure of the *lac* operon.\n\n(b) Explain the expression pattern under four conditions.\n\n(c) Predict the effect of a constitutive operator mutation.\n\n(d) Explain the role of cAMP and CAP.',
  E'**(a)** Promoter, Operator, lacZ, lacY, lacA, lacI, CAP binding site.\n\n**(b)** See truth table for four conditions.\n\n**(c)** O^c mutation: always partially active.\n\n**(d)** cAMP-CAP enhances transcription ~50-fold when glucose absent.',
  '2026-02-15', '2026-02-15'),

('snu-physics-2023', 1005, '양자역학: 무한 퍼텐셜 우물', '서울대 물리학과 기출', 2023,
  ARRAY['quantum-mechanics', 'schrodinger-equation', 'energy-levels'],
  E'폭이 $L$인 1차원 무한 퍼텐셜 우물에 질량 $m$인 입자가 갇혀 있다.\n\n![무한 퍼텐셜 우물](/images/infinite-potential-well.svg "그림 1. 무한 퍼텐셜 우물과 에너지 준위")\n\n(a) 에너지 고유값 $E_n$과 파동함수 $\\psi_n(x)$를 구하시오.\n\n(b) $\\langle x \\rangle$와 $\\langle x^2 \\rangle$를 구하시오.\n\n(c) $\\Delta x$를 $n$의 함수로 표현하시오.\n\n(d) $n \\to \\infty$일 때 극한값을 구하시오.',
  E'**(a)** $\\psi_n(x) = \\sqrt{\\frac{2}{L}}\\sin\\left(\\frac{n\\pi x}{L}\\right)$, $E_n = \\frac{n^2 \\pi^2 \\hbar^2}{2mL^2}$\n\n**(d)** $\\Delta x \\to \\frac{L}{2\\sqrt{3}}$ (대응원리)',
  '2026-04-01', '2026-04-01'),

('kpho-2023-5', 1006, '레너드-존스 퍼텐셜과 분자 간 상호작용', 'KPhO 2023', 2023,
  ARRAY['molecular-physics', 'potential-energy', 'lennard-jones'],
  E'두 중성 원자 사이의 상호작용은 레너드-존스 퍼텐셜로 기술된다:\n\n$$U(r) = 4\\varepsilon \\left[ \\left(\\frac{\\sigma}{r}\\right)^{12} - \\left(\\frac{\\sigma}{r}\\right)^{6} \\right]$$\n\n(a) 평형 거리 $r_0$를 구하시오.\n\n(b) 유효 스프링 상수 $k$를 구하시오.\n\n(c) 아르곤 원자에 대해 계산하시오.',
  E'**(a)** $r_0 = 2^{1/6}\\sigma$\n\n**(b)** $k = \\frac{36 \\cdot 2^{2/3} \\varepsilon}{\\sigma^2}$\n\n**(c)** $r_0 = 3.822 \\times 10^{-10}$ m, $f \\approx 7.9 \\times 10^{11}$ Hz',
  '2026-05-01', '2026-05-01');

-- Discussions
INSERT INTO discussions (id, problem_id, author_name, content, parent_id, created_at) VALUES
('disc-1', 'ipho-2023-1', 'PhysicsStudent42',
  'Part (c)에서 $\omega_c = \frac{qB}{\gamma m_0}$이 되는 물리적 직관이 궁금합니다.',
  NULL, '2026-01-20'),
('disc-2', 'ipho-2023-1', 'RelativityExpert',
  '좋은 질문입니다! 상대론적 입자는 ''더 무거운'' 것처럼 행동하므로 같은 힘에 대해 가속이 덜 됩니다.',
  'disc-1', '2026-01-21'),
('disc-3', 'kpho-2022-3', 'ThermodynamicsFan',
  '효율이 카르노 효율보다 낮은 것은 당연하지만, 구체적으로 이 사이클의 비가역성이 어디서 발생하는지 분석해볼 수 있을까요?',
  NULL, '2026-02-05'),
('disc-4', 'kmo-2023-1', 'NumberTheorist',
  '페르마의 소정리를 직접 적용하면 바로 풀리는 문제네요.',
  NULL, '2026-03-15');

-- Contests
INSERT INTO contests (id, name, short_name, description, website, years) VALUES
('ipho', 'International Physics Olympiad', 'IPhO',
  '국제 물리 올림피아드. 매년 전 세계 80여 개국에서 참가하는 물리학 최고 권위의 대회.',
  'https://www.ipho-new.org', ARRAY[2023, 2022, 2021, 2020, 2019]),
('kpho', 'Korean Physics Olympiad', 'KPhO',
  '한국 물리 올림피아드. 대한민국 대표 물리학 경시대회로, IPhO 대표 선발의 기초가 되는 대회.',
  NULL, ARRAY[2023, 2022, 2021, 2020, 2019]),
('icho', 'International Chemistry Olympiad', 'IChO',
  '국제 화학 올림피아드. 이론과 실험 두 파트로 구성되며, 화학 분야 최고 수준의 국제 대회.',
  'https://www.icho.us', ARRAY[2023, 2022, 2021, 2020, 2019]),
('kmo', 'Korean Mathematical Olympiad', 'KMO',
  '한국 수학 올림피아드. 대한민국 수학 영재들이 참가하는 권위 있는 수학 경시대회.',
  NULL, ARRAY[2023, 2022, 2021, 2020, 2019]),
('ibo', 'International Biology Olympiad', 'IBO',
  '국제 생물학 올림피아드. 생물학 전 분야를 아우르는 이론 및 실험 문제를 다루는 국제 대회.',
  'https://www.ibo-info.org', ARRAY[2022, 2021, 2020, 2019]),
('snu-physics', '서울대학교 물리학과 기출', '서울대 물리학과',
  '서울대학교 물리학과 대학원 입학시험 및 학부 기출문제 모음.',
  NULL, ARRAY[2023, 2022, 2021]);

-- Topics
INSERT INTO topics (id, title, content, author_name, tags, upvotes, created_at) VALUES
('topic-1', '양자역학의 측정 문제에 대한 현대적 해석들',
  '코펜하겐 해석, 다세계 해석, 파일럿 파동 이론 등 양자역학의 측정 문제를 해결하려는 다양한 시도들에 대해 토론해봅시다.',
  'QuantumPhilosopher', ARRAY['양자역학', '물리학', '철학'], 12, '2026-03-20'),
('topic-2', 'IPhO 2026 준비 스터디 모집',
  '올해 IPhO를 준비하는 분들과 함께 스터디를 하고 싶습니다.',
  'OlympiadDreamer', ARRAY['IPhO', '스터디', '올림피아드'], 8, '2026-03-18'),
('topic-3', '유기화학 반응 메커니즘 정리 노트 공유',
  'IChO 준비하면서 정리한 유기화학 반응 메커니즘 노트를 공유합니다.',
  'ChemNerd99', ARRAY['화학', '유기화학', 'IChO'], 15, '2026-03-15'),
('topic-4', '미분기하학을 일반상대론에 어떻게 적용하나요?',
  '리만 기하학과 텐서 해석학의 기초를 공부하고 있는데, 아인슈타인 장 방정식으로 어떻게 연결되는지 궁금합니다.',
  'GravityStudent', ARRAY['수학', '물리학', '일반상대론'], 6, '2026-03-12'),
('topic-5', 'CRISPR-Cas9 이후 유전자 편집 기술의 미래',
  'Prime editing, Base editing 등 CRISPR 이후의 유전자 편집 기술들에 대해 이야기해봅시다.',
  'BioFuturist', ARRAY['생물학', '유전공학', 'CRISPR'], 10, '2026-03-10');

-- Topic Comments
INSERT INTO topic_comments (id, topic_id, author_name, content, parent_id, upvotes, created_at) VALUES
('tc-1', 'topic-1', 'WaveFunctionCollapse',
  '저는 다세계 해석을 선호합니다. 수학적으로 가장 깔끔하고, 관측자의 특별한 역할을 가정하지 않아도 되니까요.',
  NULL, 5, '2026-03-21'),
('tc-2', 'topic-1', 'QuantumPhilosopher',
  '동의합니다. 하지만 Occam''s razor를 적용하면 무한히 많은 세계를 가정하는 것이 정말 단순한 해석인지 의문이 들기도 합니다.',
  'tc-1', 3, '2026-03-21'),
('tc-3', 'topic-2', 'PhysicsKid',
  '저도 참여하고 싶습니다! 현재 KPhO 은상 수준인데, IPhO까지 도전해보고 싶어요.',
  NULL, 2, '2026-03-19'),
('tc-4', 'topic-3', 'ReactionMaster',
  '정리 잘 하셨네요! Woodward-Hoffmann 규칙도 IChO에서 자주 출제되니 포함시키면 좋을 것 같습니다.',
  NULL, 4, '2026-03-16'),
('tc-5', 'topic-4', 'TensorCalcPro',
  'Sean Carroll의 ''Spacetime and Geometry'' 교재를 추천합니다.',
  NULL, 7, '2026-03-13');
