import { Problem, Discussion } from "@/types";

export const problems: Problem[] = [
  {
    id: "ipho-2023-1",
    problemNumber: 1000,
    title: "Relativistic Particle in Magnetic Field",
    source: "IPhO 2023",
    year: 2023,
    tags: ["electromagnetism", "special-relativity", "charged-particles"],
    content: `A charged particle with rest mass $m_0$ and charge $q$ enters a uniform magnetic field $\\vec{B} = B\\hat{z}$ with an initial velocity $\\vec{v_0} = v_0 \\hat{x}$, where $v_0 = 0.8c$.

(a) Derive the equation of motion for the particle in the relativistic regime.

(b) Find the radius of curvature of the particle's trajectory.

(c) Calculate the cyclotron frequency $\\omega_c$ and compare it with the non-relativistic result.

**Hint:** The relativistic momentum is given by $\\vec{p} = \\gamma m_0 \\vec{v}$, where $\\gamma = \\frac{1}{\\sqrt{1 - v^2/c^2}}$.`,
    officialSolution: `**(a)** The relativistic equation of motion is:

$$\\frac{d\\vec{p}}{dt} = q\\vec{v} \\times \\vec{B}$$

where $\\vec{p} = \\gamma m_0 \\vec{v}$.

Since the magnetic force is always perpendicular to the velocity, $|\\vec{v}|$ remains constant, so $\\gamma$ is also constant.

Therefore: $\\gamma m_0 \\frac{d\\vec{v}}{dt} = q\\vec{v} \\times \\vec{B}$

**(b)** For circular motion in the $xy$-plane:

$$\\gamma m_0 \\frac{v_0^2}{R} = qv_0 B$$

$$R = \\frac{\\gamma m_0 v_0}{qB}$$

With $v_0 = 0.8c$, we get $\\gamma = \\frac{1}{\\sqrt{1-0.64}} = \\frac{5}{3}$

$$R = \\frac{5m_0 \\cdot 0.8c}{3qB} = \\frac{4m_0 c}{3qB}$$

**(c)** The cyclotron frequency:

$$\\omega_c = \\frac{v_0}{R} = \\frac{qB}{\\gamma m_0} = \\frac{3qB}{5m_0}$$

The non-relativistic cyclotron frequency would be $\\omega_0 = \\frac{qB}{m_0}$, so:

$$\\omega_c = \\frac{\\omega_0}{\\gamma} = \\frac{3}{5}\\omega_0$$

The relativistic cyclotron frequency is reduced by a factor of $\\gamma$.`,
    createdAt: "2024-01-15",
    updatedAt: "2024-01-15",
  },
  {
    id: "kpho-2022-3",
    problemNumber: 1001,
    title: "열역학적 엔진의 효율",
    source: "KPhO 2022",
    year: 2022,
    tags: ["thermodynamics", "carnot-cycle", "entropy"],
    content: `이상 기체 $n$ 몰이 다음과 같은 순환 과정을 거친다:

1. 상태 A$(V_1, P_1)$에서 상태 B$(V_2, P_1)$로의 등압 팽창
2. 상태 B에서 상태 C$(V_2, P_2)$로의 등적 과정
3. 상태 C에서 상태 D$(V_1, P_2)$로의 등압 압축
4. 상태 D에서 상태 A로의 등적 과정

여기서 $V_2 = 2V_1$, $P_1 = 3P_2$이다.

(a) 이 순환 과정의 $P$-$V$ 다이어그램을 그리시오.

(b) 각 과정에서의 열량 $Q$를 구하시오. (단, 이상 기체의 정적 몰 비열은 $C_v = \\frac{3}{2}R$)

(c) 이 열기관의 효율 $\\eta$를 구하시오.`,
    officialSolution: `**(a)** $P$-$V$ 다이어그램은 직사각형 형태로, 꼭짓점이 A$(V_1, P_1)$, B$(V_2, P_1)$, C$(V_2, P_2)$, D$(V_1, P_2)$이다.

**(b)** 이상 기체의 정압 몰 비열: $C_p = C_v + R = \\frac{5}{2}R$

**과정 1→2 (등압 팽창):**
$$Q_{12} = nC_p(T_2 - T_1) = nC_p \\cdot \\frac{P_1(V_2 - V_1)}{nR} = \\frac{5}{2}P_1 V_1$$

**과정 2→3 (등적 냉각):**
$$Q_{23} = nC_v(T_3 - T_2) = \\frac{3}{2}(P_2 - P_1)V_2 = \\frac{3}{2}(-2P_2)(2V_1) = -6P_2 V_1$$

**과정 3→4 (등압 압축):**
$$Q_{34} = nC_p(T_4 - T_3) = \\frac{5}{2}P_2(V_1 - V_2) = -\\frac{5}{2}P_2 V_1$$

**과정 4→1 (등적 가열):**
$$Q_{41} = nC_v(T_1 - T_4) = \\frac{3}{2}(P_1 - P_2)V_1 = \\frac{3}{2}(2P_2)V_1 = 3P_2 V_1$$

**(c)** 흡수한 열: $Q_{\\text{in}} = Q_{12} + Q_{41} = \\frac{5}{2}P_1 V_1 + 3P_2 V_1 = \\frac{5}{2}(3P_2)V_1 + 3P_2 V_1 = \\frac{21}{2}P_2 V_1$

한 순환에서 한 일: $W = (P_1 - P_2)(V_2 - V_1) = 2P_2 \\cdot V_1$

$$\\eta = \\frac{W}{Q_{\\text{in}}} = \\frac{2P_2 V_1}{\\frac{21}{2}P_2 V_1} = \\frac{4}{21} \\approx 19.0\\%$$`,
    createdAt: "2024-02-01",
    updatedAt: "2024-02-01",
  },
  {
    id: "icho-2023-2",
    problemNumber: 1002,
    title: "Coordination Chemistry of Transition Metals",
    source: "IChO 2023",
    year: 2023,
    tags: ["coordination-chemistry", "crystal-field-theory", "spectroscopy"],
    content: `A transition metal complex $[\\text{Co}(\\text{NH}_3)_6]^{3+}$ absorbs light at $\\lambda = 475 \\text{ nm}$.

(a) Calculate the crystal field splitting energy $\\Delta_o$ in $\\text{kJ/mol}$.

(b) Predict whether this complex is high-spin or low-spin. Justify your answer using crystal field theory.

(c) Draw the $d$-orbital splitting diagram and show the electron configuration.

(d) Explain why $[\\text{CoF}_6]^{3-}$ has a different color from $[\\text{Co}(\\text{NH}_3)_6]^{3+}$.

**Given:** $h = 6.626 \\times 10^{-34}$ J·s, $c = 3.0 \\times 10^8$ m/s, $N_A = 6.022 \\times 10^{23}$ mol$^{-1}$`,
    officialSolution: `**(a)** The crystal field splitting energy:

$$\\Delta_o = \\frac{hc}{\\lambda} = \\frac{6.626 \\times 10^{-34} \\times 3.0 \\times 10^8}{475 \\times 10^{-9}}$$

$$\\Delta_o = 4.185 \\times 10^{-19} \\text{ J}$$

$$\\Delta_o = 4.185 \\times 10^{-19} \\times 6.022 \\times 10^{23} = 252 \\text{ kJ/mol}$$

**(b)** $\\text{Co}^{3+}$ has the electron configuration $[\\text{Ar}]3d^6$.

$\\text{NH}_3$ is a strong-field ligand (high in the spectrochemical series), so $\\Delta_o$ is large. Since the pairing energy $P < \\Delta_o$, the complex is **low-spin**.

**(c)** In an octahedral field, the $d$-orbitals split into:
- $t_{2g}$: lower energy ($d_{xy}, d_{xz}, d_{yz}$)
- $e_g$: higher energy ($d_{z^2}, d_{x^2-y^2}$)

For low-spin $d^6$: $t_{2g}^6 e_g^0$ — all six electrons are paired in the $t_{2g}$ set.

**(d)** $\\text{F}^-$ is a weak-field ligand (low in the spectrochemical series), so $[\\text{CoF}_6]^{3-}$ has a smaller $\\Delta_o$. A smaller $\\Delta_o$ means the complex absorbs lower-energy (longer wavelength) light, resulting in a different transmitted color. $[\\text{CoF}_6]^{3-}$ is high-spin and appears blue, while $[\\text{Co}(\\text{NH}_3)_6]^{3+}$ appears orange/yellow.`,
    createdAt: "2024-01-20",
    updatedAt: "2024-01-20",
  },
  {
    id: "kmo-2023-1",
    problemNumber: 1003,
    title: "정수론: 소수의 성질",
    source: "KMO 2023",
    year: 2023,
    tags: ["number-theory", "primes", "modular-arithmetic"],
    content: `$p$가 5 이상의 소수일 때, 다음을 증명하시오.

$$1^{p-1} + 2^{p-1} + 3^{p-1} + \\cdots + (p-1)^{p-1} \\equiv -1 \\pmod{p}$$`,
    officialSolution: `**증명:**

페르마의 소정리에 의해, $\\gcd(a, p) = 1$이면 $a^{p-1} \\equiv 1 \\pmod{p}$이다.

$1 \\leq k \\leq p-1$인 각 정수 $k$에 대해 $\\gcd(k, p) = 1$이므로:

$$k^{p-1} \\equiv 1 \\pmod{p}$$

따라서:

$$\\sum_{k=1}^{p-1} k^{p-1} \\equiv \\sum_{k=1}^{p-1} 1 = p - 1 \\equiv -1 \\pmod{p}$$

$\\blacksquare$`,
    createdAt: "2024-03-10",
    updatedAt: "2024-03-10",
  },
  {
    id: "ibo-2022-1",
    problemNumber: 1004,
    title: "Gene Expression and Regulation",
    source: "IBO 2022",
    year: 2022,
    tags: ["molecular-biology", "gene-regulation", "lac-operon"],
    content: `The *lac* operon in *E. coli* is a classic model of gene regulation.

(a) Draw the structure of the *lac* operon, labeling all regulatory elements and structural genes.

(b) Explain the expression pattern of the *lac* operon under the following conditions:
   - Glucose present, Lactose absent
   - Glucose absent, Lactose present
   - Glucose absent, Lactose absent
   - Glucose present, Lactose present

(c) A mutation in the operator region makes it unable to bind the repressor protein. Predict the effect on *lac* operon expression under each of the four conditions above.

(d) Explain the role of cAMP and CAP in the regulation of this operon.`,
    officialSolution: `**(a)** The *lac* operon structure:
- **Promoter (P):** RNA polymerase binding site
- **Operator (O):** Repressor binding site, between promoter and structural genes
- **lacZ:** Encodes β-galactosidase
- **lacY:** Encodes permease
- **lacA:** Encodes transacetylase
- **lacI** (upstream): Encodes the repressor protein
- **CAP binding site:** Upstream of the promoter

**(b)** Expression patterns:

| Condition | Repressor | CAP-cAMP | Expression |
|-----------|-----------|----------|------------|
| +Glucose, -Lactose | Bound to O | Low cAMP, CAP inactive | **OFF** |
| -Glucose, +Lactose | Released (allolactose) | High cAMP, CAP active | **HIGH** |
| -Glucose, -Lactose | Bound to O | High cAMP, CAP active | **OFF** |
| +Glucose, +Lactose | Released | Low cAMP, CAP inactive | **LOW (basal)** |

**(c)** With a constitutive operator mutation (O^c):
The repressor cannot bind, so the operon is always partially active regardless of lactose. However, full expression still requires CAP-cAMP:
- +Glucose, -Lactose: **Low** (no CAP activation)
- -Glucose, +Lactose: **High** (CAP active)
- -Glucose, -Lactose: **High** (CAP active, no repression)
- +Glucose, +Lactose: **Low** (no CAP activation)

**(d)** When glucose is absent, adenylyl cyclase produces cAMP. cAMP binds to CAP (catabolite activator protein), forming the CAP-cAMP complex. This complex binds to the CAP binding site upstream of the *lac* promoter, bending the DNA and enhancing RNA polymerase binding, thereby increasing transcription ~50-fold. This ensures that the *lac* operon is maximally expressed only when glucose is absent (catabolite repression).`,
    createdAt: "2024-02-15",
    updatedAt: "2024-02-15",
  },
  {
    id: "snu-physics-2023",
    problemNumber: 1005,
    title: "양자역학: 무한 퍼텐셜 우물",
    source: "서울대 물리학과 기출",
    year: 2023,
    tags: ["quantum-mechanics", "schrodinger-equation", "energy-levels"],
    content: `폭이 $L$인 1차원 무한 퍼텐셜 우물에 질량 $m$인 입자가 갇혀 있다.

![무한 퍼텐셜 우물](/images/infinite-potential-well.svg "그림 1. 무한 퍼텐셜 우물과 에너지 준위")

$$V(x) = \\begin{cases} 0 & 0 < x < L \\\\ \\infty & \\text{otherwise} \\end{cases}$$

(a) 시간에 무관한 슈뢰딩거 방정식을 풀어 에너지 고유값 $E_n$과 정규화된 파동함수 $\\psi_n(x)$를 구하시오.

(b) 입자가 $n$번째 상태에 있을 때, $\\langle x \\rangle$와 $\\langle x^2 \\rangle$를 구하시오.

(c) 위치의 불확정도 $\\Delta x$를 $n$의 함수로 표현하시오.

(d) $n \\to \\infty$일 때 $\\Delta x$의 극한값을 구하고, 고전역학적 결과와 비교하시오.`,
    officialSolution: `**(a)** 우물 내부에서 슈뢰딩거 방정식:

$$-\\frac{\\hbar^2}{2m}\\frac{d^2\\psi}{dx^2} = E\\psi$$

경계조건 $\\psi(0) = \\psi(L) = 0$을 적용하면:

$$\\psi_n(x) = \\sqrt{\\frac{2}{L}}\\sin\\left(\\frac{n\\pi x}{L}\\right), \\quad n = 1, 2, 3, \\ldots$$

$$E_n = \\frac{n^2 \\pi^2 \\hbar^2}{2mL^2}$$

**(b)**

$$\\langle x \\rangle = \\frac{2}{L}\\int_0^L x \\sin^2\\left(\\frac{n\\pi x}{L}\\right)dx = \\frac{L}{2}$$

$$\\langle x^2 \\rangle = \\frac{2}{L}\\int_0^L x^2 \\sin^2\\left(\\frac{n\\pi x}{L}\\right)dx = L^2\\left(\\frac{1}{3} - \\frac{1}{2n^2\\pi^2}\\right)$$

**(c)**

$$\\Delta x = \\sqrt{\\langle x^2 \\rangle - \\langle x \\rangle^2} = L\\sqrt{\\frac{1}{12} - \\frac{1}{2n^2\\pi^2}}$$

**(d)** $n \\to \\infty$일 때:

$$\\Delta x \\to \\frac{L}{\\sqrt{12}} = \\frac{L}{2\\sqrt{3}}$$

이는 고전역학에서 $[0, L]$ 구간에 균일하게 분포된 입자의 위치 표준편차와 정확히 일치한다 (대응원리).`,
    createdAt: "2024-04-01",
    updatedAt: "2024-04-01",
  },
  {
    id: "kpho-2023-5",
    problemNumber: 1006,
    title: "레너드-존스 퍼텐셜과 분자 간 상호작용",
    source: "KPhO 2023",
    year: 2023,
    tags: ["molecular-physics", "potential-energy", "lennard-jones"],
    content: `두 중성 원자 사이의 상호작용은 레너드-존스 퍼텐셜로 기술된다:

$$U(r) = 4\\varepsilon \\left[ \\left(\\frac{\\sigma}{r}\\right)^{12} - \\left(\\frac{\\sigma}{r}\\right)^{6} \\right]$$

여기서 $r$은 두 원자 사이의 거리, $\\varepsilon$은 퍼텐셜 우물의 깊이, $\\sigma$는 $U(\\sigma) = 0$을 만족하는 거리이다.

![레너드-존스 퍼텐셜](/images/lennard-jones-potential.svg "그림 1. 레너드-존스 퍼텐셜 곡선")

(a) 평형 거리 $r_0$ (퍼텐셜이 최소인 거리)를 $\\sigma$로 표현하시오.

(b) 평형 위치 근방에서 유효 스프링 상수 $k$를 $\\varepsilon$과 $\\sigma$로 표현하시오.

(c) 아르곤 원자 ($\\varepsilon = 1.654 \\times 10^{-21}$ J, $\\sigma = 3.405 \\times 10^{-10}$ m)에 대해 $r_0$와 진동 주파수를 계산하시오.`,
    officialSolution: `**(a)** 평형 거리에서 $\\frac{dU}{dr} = 0$:

$$\\frac{dU}{dr} = 4\\varepsilon \\left[ -12\\frac{\\sigma^{12}}{r^{13}} + 6\\frac{\\sigma^{6}}{r^{7}} \\right] = 0$$

$$12\\frac{\\sigma^{12}}{r_0^{13}} = 6\\frac{\\sigma^{6}}{r_0^{7}}$$

$$r_0^6 = 2\\sigma^6 \\implies r_0 = 2^{1/6}\\sigma \\approx 1.122\\sigma$$

**(b)** 유효 스프링 상수:

$$k = \\frac{d^2U}{dr^2}\\bigg|_{r=r_0}$$

$$\\frac{d^2U}{dr^2} = 4\\varepsilon \\left[ 156\\frac{\\sigma^{12}}{r^{14}} - 42\\frac{\\sigma^{6}}{r^{8}} \\right]$$

$r = r_0 = 2^{1/6}\\sigma$를 대입하면:

$$k = 4\\varepsilon \\left[ \\frac{156}{4\\sigma^2} - \\frac{42}{2^{4/3}\\sigma^2} \\right] = \\frac{72\\varepsilon}{2^{1/3}\\sigma^2} = \\frac{36 \\cdot 2^{2/3} \\varepsilon}{\\sigma^2}$$

**(c)** 아르곤의 경우:

$$r_0 = 2^{1/6} \\times 3.405 \\times 10^{-10} = 3.822 \\times 10^{-10} \\text{ m}$$

$$k = \\frac{36 \\cdot 2^{2/3} \\times 1.654 \\times 10^{-21}}{(3.405 \\times 10^{-10})^2} \\approx 0.815 \\text{ N/m}$$

아르곤의 환산 질량 $\\mu = m_{\\text{Ar}}/2 = 3.32 \\times 10^{-26}$ kg이므로:

$$f = \\frac{1}{2\\pi}\\sqrt{\\frac{k}{\\mu}} = \\frac{1}{2\\pi}\\sqrt{\\frac{0.815}{3.32 \\times 10^{-26}}} \\approx 7.9 \\times 10^{11} \\text{ Hz}$$`,
    createdAt: "2024-05-01",
    updatedAt: "2024-05-01",
  },
];

export const discussions: Discussion[] = [
  {
    id: "disc-1",
    problemId: "ipho-2023-1",
    author: "PhysicsStudent42",
    content: "Part (c)에서 $\\omega_c = \\frac{qB}{\\gamma m_0}$이 되는 물리적 직관이 궁금합니다. 왜 상대론적 질량이 커지면 주파수가 줄어드는 건가요?",
    createdAt: "2024-01-20",
    parentId: null,
  },
  {
    id: "disc-2",
    problemId: "ipho-2023-1",
    author: "RelativityExpert",
    content: "좋은 질문입니다! 직관적으로, 상대론적 입자는 '더 무거운' 것처럼 행동하므로 같은 힘에 대해 가속이 덜 됩니다. 따라서 원을 한 바퀴 도는 데 더 오래 걸리고, 주파수가 감소합니다. 이것이 싱크로트론에서 주파수를 조절해야 하는 이유입니다.",
    createdAt: "2024-01-21",
    parentId: "disc-1",
  },
  {
    id: "disc-3",
    problemId: "kpho-2022-3",
    author: "ThermodynamicsFan",
    content: "효율이 카르노 효율보다 낮은 것은 당연하지만, 구체적으로 이 사이클의 비가역성이 어디서 발생하는지 분석해볼 수 있을까요?",
    createdAt: "2024-02-05",
    parentId: null,
  },
  {
    id: "disc-4",
    problemId: "kmo-2023-1",
    author: "NumberTheorist",
    content: "페르마의 소정리를 직접 적용하면 바로 풀리는 문제네요. 그런데 $p = 2, 3$일 때도 성립하는지 확인해보는 것도 좋은 연습이 될 것 같습니다.",
    createdAt: "2024-03-15",
    parentId: null,
  },
];
