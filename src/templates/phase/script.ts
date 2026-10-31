// Words for the ASE102 Unit III lesson: alloys and phase diagrams (16:9, about 20 min).
// text = caption (Greek letters and symbols allowed; $…$ is maths). say = what the voice reads,
// only when the automatic reading (`speak`) would not sound right. {{placeholders}} come from model.ts.

import { spokenDisplay, spokenNumber } from "../../video/spoken";
import { CU_NI_EX, EUTECTIC_SPLIT, HYPER, HYPO, PB_SN_EX, PB_SN_MICRO, PEARLITE, QUIZ, f2 } from "./model";

export type BeatId =
  | "intro"
  | "basics"
  | "solubility"
  | "phases"
  | "alloying"
  | "solid"
  | "unary"
  | "binary"
  | "cuni"
  | "threeq"
  | "lever"
  | "cooling"
  | "gibbs"
  | "eutectic"
  | "pbsn"
  | "micro"
  | "invariant"
  | "iron"
  | "steels"
  | "summary"
  | "quiz"
  | "recap";

export interface Line {
  text: string;
  say?: string;
}
export interface Beat {
  id: BeatId;
  chapter: string;
  lines: Line[];
}

export const BEATS: Beat[] = [
  {
    id: "intro",
    chapter: "Why alloys?",
    lines: [
      { text: "Pure aluminium is soft. You can bend a thin sheet with your hands." },
      { text: "But aircraft wings are made of aluminium too. So how are they so strong?" },
      { text: "The secret is mixing. Add a little copper, magnesium or zinc, and you get an alloy." },
      { text: "But mixing is not random. Heat it, cool it, and the atoms arrange themselves in different ways." },
      { text: "A phase diagram is the map that tells us exactly what we get." },
      { text: "In this lesson we go from zero all the way to the iron–carbon diagram. Step by step." },
      { text: "By the end, you will read any phase diagram and solve the exam questions with confidence." },
    ],
  },
  {
    id: "basics",
    chapter: "Basic words",
    lines: [
      { text: "First, a few words. A component is a pure element or compound that makes up the alloy." },
      { text: "In brass, the components are copper and zinc." },
      { text: "A system is the whole family of alloys made from the same components, like the iron–carbon system." },
      { text: "An alloy is a metal mixed with at least one other element." },
      { text: "The element present in the largest amount is the solvent. The smaller one is the solute." },
      { text: "If solute atoms fit into the solvent's crystal and the crystal stays the same, we get a solid solution." },
      { text: "Think of sugar in tea. It mixes in so well you can't see it. A solid solution is the same idea, in a solid." },
    ],
  },
  {
    id: "solubility",
    chapter: "Solubility limit",
    lines: [
      { text: "But you can't keep dissolving sugar in water forever." },
      { text: "Keep adding sugar, and at some point it stops dissolving. It just sits at the bottom." },
      { text: "That maximum amount is called the solubility limit." },
      { text: "At 20 °C, the limit is 65 wt% sugar. Any more than that stays solid." },
      { text: "Heat the water to 100 °C, and the limit rises to 80 wt%." },
      { text: "Metals behave the same way. Every solute has a solubility limit, and it changes with temperature." },
      { text: "Go past the limit, and a second phase forms." },
    ],
  },
  {
    id: "phases",
    chapter: "Phases",
    lines: [
      { text: "So what exactly is a phase?" },
      { text: "A phase is a part of a material that is the same all through: same structure, same composition, same properties." },
      { text: "The syrup is one phase. The undissolved sugar is another phase." },
      { text: "Water and ice are two phases too. Same chemistry, but one is solid and one is liquid." },
      { text: "Even two solid forms of one metal, like BCC iron and FCC iron, are different phases." },
      { text: "A single phase is called homogeneous. Two or more phases make a heterogeneous mixture." },
      { text: "Microstructure is what you see under a microscope: which phases, how much of each, and how they are arranged." },
      { text: "Equilibrium means the system has settled. Its free energy is as low as it can go, so nothing changes with time." },
      { text: "Some states change so slowly that they never reach equilibrium. These are called metastable." },
    ],
  },
  {
    id: "alloying",
    chapter: "Why we alloy",
    lines: [
      { text: "Why do engineers mix metals at all?" },
      { text: "To make them stronger and harder, like the aluminium alloys in aircraft." },
      { text: "To fight corrosion, like the chromium in stainless steel." },
      { text: "To change the melting point, like lead–tin solder that melts easily." },
      { text: "And to tune other properties: electrical, magnetic, or how easily the metal can be cast and shaped." },
      { text: "Sterling silver is a nice example: 92.5% silver and 7.5% copper. Much stronger than pure silver, and still shiny." },
    ],
  },
  {
    id: "solid",
    chapter: "Types of solid solution",
    lines: [
      { text: "Now, how do solute atoms sit inside the crystal? There are two ways." },
      { text: "Substitutional: the solute atom takes the place of a host atom in the lattice." },
      { text: "This works when both atoms are about the same size, like copper and nickel." },
      { text: "Interstitial: a small solute atom squeezes into the gaps between the host atoms." },
      { text: "Carbon in iron is the classic example. Carbon is tiny, so it fits in the gaps." },
      { text: "When can one metal dissolve a lot of another? The Hume-Rothery rules tell us." },
      { text: "Rule one, atomic size: the radii should differ by less than about 15%." },
      { text: "Rule two, crystal structure: both should have the same one." },
      { text: "Rule three, electronegativity: it should be similar, or they form a compound instead." },
      { text: "Rule four, valency: a metal dissolves a metal of higher valency more easily than one of lower valency." },
      {
        text: "Copper and nickel pass all four: radii 0.128 and 0.125 nm, both FCC, electronegativity 1.9 and 1.8.",
        say: "Copper and nickel pass all four. Radii zero point one two eight and zero point one two five nanometres, both FCC, electronegativity one point nine and one point eight.",
      },
      { text: "That's why copper and nickel mix in every proportion. Remember this. It comes back soon." },
    ],
  },
  {
    id: "unary",
    chapter: "Unary phase diagram",
    lines: [
      { text: "Now, our first phase diagram. A unary diagram is for just one component." },
      { text: "The composition is fixed, so the two things we can change are pressure and temperature." },
      { text: "Here is water. Three regions: ice, water and steam." },
      { text: "Each line is a boundary. On a line, the two phases on either side live together in balance." },
      { text: "Follow the dashed line at 1 atm. Ice melts at 0 °C…", say: "Follow the dashed line at one atmosphere. Ice melts at zero degrees…" },
      { text: "…and water boils at 100 °C.", say: "and water boils at one hundred degrees." },
      { text: "All three lines meet at one point: the triple point. Here ice, water and steam all exist together." },
      {
        text: "For water, it's at 0.01 °C and 0.006 atm. Change anything, and one phase disappears.",
        say: "For water, it's at zero point zero one degrees and zero point zero zero six atmospheres. Change anything, and one phase disappears.",
      },
    ],
  },
  {
    id: "binary",
    chapter: "Binary phase diagrams",
    lines: [
      { text: "Most alloys have two components. So we fix the pressure at 1 atm and plot temperature against composition.", say: "Most alloys have two components. So we fix the pressure at one atmosphere and plot temperature against composition." },
      { text: "This is a binary phase diagram. Temperature goes up the side." },
      { text: "Composition goes along the bottom, in weight percent. The left end is pure A, the right end is pure B." },
      { text: "Every point on this map is one alloy at one temperature. The region it falls in tells you the phases." },
    ],
  },
  {
    id: "cuni",
    chapter: "Isomorphous: Cu–Ni",
    lines: [
      { text: "The easiest one is copper–nickel." },
      { text: "Pure copper melts at 1085 °C. Pure nickel melts at 1455 °C." },
      { text: "Above the top line, everything is liquid. This line is called the liquidus." },
      { text: "Below the lower line, everything is solid. This line is called the solidus." },
      { text: "In between, solid and liquid exist together." },
      { text: "The solid is called α: a substitutional solid solution of copper and nickel, with an FCC structure." },
      { text: "There is only one solid phase, at every composition. Complete solubility, as a liquid and as a solid." },
      { text: "That's why it's called isomorphous. Iso means same, morph means form." },
    ],
  },
  {
    id: "threeq",
    chapter: "Reading a diagram",
    lines: [
      { text: "Every phase diagram question asks three things." },
      { text: "One: which phases are present? Two: what is the composition of each? Three: how much of each?" },
      { text: "Take an alloy of 35 wt% nickel at 1250 °C. Call it point B." },
      { text: "Question one. Point B lies in the α + L region. So both α and liquid are present." },
      { text: "If a point is in a one-phase region, the phase has the same composition as the alloy. Easy." },
      { text: "In a two-phase region, draw a tie line: a horizontal line across the region at that temperature." },
      { text: "Where it meets the liquidus, read down. The liquid has {{cL}} wt% nickel." },
      { text: "Where it meets the solidus, read down. The solid α has {{cAlpha}} wt% nickel." },
      { text: "Notice: the alloy is 35%, but neither phase is 35%. One has less nickel, the other has more." },
    ],
  },
  {
    id: "lever",
    chapter: "The lever rule",
    lines: [
      { text: "Question three: how much of each phase? For this we use the lever rule." },
      { text: "Think of the tie line as a seesaw, with the pivot at the alloy's composition." },
      { text: "Each phase sits at one end. To balance, the heavier phase must sit closer to the pivot." },
      { text: "So the fraction of a phase is the length of the opposite arm, divided by the whole tie line." },
      {
        text: "Liquid: $W_L = \\dfrac{C_\\alpha - C_0}{C_\\alpha - C_L}$",
        say: "Fraction of liquid: W L equals C alpha minus C zero, over C alpha minus C L.",
      },
      {
        text: "Solid: $W_\\alpha = \\dfrac{C_0 - C_L}{C_\\alpha - C_L}$",
        say: "Fraction of alpha: W alpha equals C zero minus C L, over the same total.",
      },
      { text: "Put in the numbers: ({{cAlpha}} − 35) ÷ ({{cAlpha}} − {{cL}}) = {{wL}}.", say: "Put in the numbers. {{cAlpha}} minus 35, over {{cAlpha}} minus {{cL}}. That is {{wLSay}}." },
      { text: "And for α: (35 − {{cL}}) ÷ {{span}} = {{wAlpha}}.", say: "And alpha is 35 minus {{cL}}, over {{span}}. That is {{wAlphaSay}}." },
      { text: "Check: {{wL}} + {{wAlpha}} = 1. The fractions always add up to one.", say: "Check: {{wLSay}} plus {{wAlphaSay}} is one. The fractions always add up to one." },
      { text: "Why does it work? Nickel can't disappear. Nickel in the liquid plus nickel in the solid equals nickel in the alloy." },
      {
        text: "$W_L C_L + W_\\alpha C_\\alpha = C_0$: solve this, and you get the lever rule.",
        say: "Write that balance, W L times C L, plus W alpha times C alpha, equals C zero. Solve it, and you get exactly the lever rule.",
      },
      { text: "Exam trick: opposite arm over the whole arm. Never the near arm." },
    ],
  },
  {
    id: "cooling",
    chapter: "Cooling Cu–Ni",
    lines: [
      { text: "Now let's slowly cool our 35 wt% nickel alloy and watch it freeze." },
      { text: "At 1300 °C, it is all liquid." },
      { text: "At about 1260 °C, it reaches the liquidus. The first tiny crystals of α appear, with 46 wt% nickel." },
      { text: "As it cools, more and more solid forms. The tie line shows both compositions changing." },
      { text: "The liquid's composition slides down the liquidus. The solid's composition slides down the solidus." },
      { text: "At about 1220 °C, it reaches the solidus. The last drop of liquid has only 24 wt% nickel." },
      { text: "Now it is all α, with 35 wt% nickel, the same as the alloy. Just as it should be." },
      { text: "If you cool too fast, the atoms don't have time to move. Each grain's centre stays richer in nickel. This is called coring." },
    ],
  },
  {
    id: "gibbs",
    chapter: "Gibbs phase rule",
    lines: [
      { text: "Next, the Gibbs phase rule. It tells you how many things you can change freely." },
      { text: "$P + F = C + N$", say: "P plus F equals C plus N." },
      { text: "P is the number of phases. C is the number of components." },
      { text: "N is the number of outside variables, like temperature and pressure. F is the degrees of freedom." },
      { text: "Our diagrams are at a fixed pressure of 1 atm. So N = 1, and $P + F = C + 1$.", say: "Our diagrams are at a fixed pressure of one atmosphere. So N is one, and P plus F equals C plus one." },
      { text: "In the liquid region of copper–nickel: C = 2, P = 1, so F = 2.", say: "In the liquid region of copper nickel, C is two and P is one, so F is two." },
      { text: "You can change both the temperature and the composition, and you stay in one phase." },
      { text: "In the α + L region: P = 2, so F = 1.", say: "In the alpha plus liquid region, P is two, so F is one." },
      { text: "Choose the temperature, and the compositions of both phases are fixed. That's the tie line!" },
      { text: "Where three phases meet, P = 3, so F = 0. Nothing can change. It's an invariant point.", say: "Where three phases meet, P is three, so F is zero. Nothing can change. It's an invariant point." },
      { text: "Water's triple point: C = 1, P = 3, N = 2. Again F = 0.", say: "At water's triple point, C is one, P is three, and N is two. Again, F is zero." },
    ],
  },
  {
    id: "eutectic",
    chapter: "Binary eutectic: Cu–Ag",
    lines: [
      { text: "Now a new type: the binary eutectic. Copper and silver." },
      { text: "These two don't mix completely as solids. So there are two solid phases." },
      { text: "α is mostly copper with a little silver. β is mostly silver with a little copper." },
      { text: "Here is the α region. It holds at most 8.0 wt% silver, at 779 °C.", say: "Here is the alpha region. It holds at most eight percent silver, at seven hundred seventy-nine degrees." },
      { text: "And the β region. It needs at least 91.2 wt% silver." },
      { text: "These curved lines are solvus lines: the solubility limit in the solid. It shrinks as the temperature falls." },
      { text: "Between them lies α + β." },
      { text: "Now the special point. At 71.9 wt% silver, the alloy stays liquid all the way down to 779 °C." },
      { text: "That's the lowest melting point of any copper–silver alloy: the eutectic point. Eutectic means easily melted." },
      { text: "Cooling through it, the liquid splits into two solids at once: L → α + β.", say: "Cooling through it, the liquid splits into two solids at once. Liquid gives alpha plus beta." },
      { text: "This flat line at 779 °C is called the eutectic isotherm." },
    ],
  },
  {
    id: "pbsn",
    chapter: "Lead–tin and solder",
    lines: [
      { text: "Lead–tin has the same shape, and it's a favourite in exams." },
      { text: "Lead melts at 327 °C. Tin melts at 232 °C." },
      { text: "But the eutectic is at 183 °C and 61.9 wt% tin. Lower than both!" },
      {
        text: "The reaction: L (61.9% Sn) → α (18.3% Sn) + β (97.8% Sn).",
        say: "The eutectic reaction: liquid with sixty-one point nine percent tin gives alpha with eighteen point three percent, plus beta with ninety-seven point eight percent.",
      },
      { text: "That's why classic solders were close to 60% tin. They melt at a low temperature, all at once." },
      { text: "Book example: 40 wt% tin at 150 °C. The point falls in α + β." },
      { text: "The tie line gives α with {{pbA}} wt% tin, and β with {{pbB}} wt% tin." },
      { text: "Lever rule: $W_\\alpha$ = (98 − 40) ÷ (98 − 11) = {{pbWa}}, and $W_\\beta$ = {{pbWb}}.", say: "Lever rule. W alpha is ninety-eight minus forty, over ninety-eight minus eleven. That's {{pbWaSay}}. And W beta is {{pbWbSay}}." },
    ],
  },
  {
    id: "micro",
    chapter: "Eutectic microstructures",
    lines: [
      { text: "Now let's see what these alloys look like inside after slow cooling. There are four cases." },
      { text: "Case one: very little tin, under about 2 wt%. It freezes into α and stays α. Simple grains." },
      { text: "Case two: between 2 and 18.3 wt% tin. It freezes into α. But as it cools, it crosses the solvus." },
      { text: "Now α holds too much tin. So small β particles come out inside the α grains." },
      { text: "Case three: exactly 61.9 wt% tin. At 183 °C, all the liquid turns into α and β at the same moment." },
      { text: "They grow as thin alternating layers, called lamellae. This is the eutectic structure." },
      { text: "Layers form because atoms only need to move a short distance, sideways, between neighbouring layers." },
      { text: "Case four: between 18.3 and 61.9, say 40 wt% tin. Some α freezes first. This is primary α." },
      { text: "At 183 °C, the leftover liquid has exactly the eutectic composition, so it turns into the layered eutectic." },
      {
        text: "Primary α = (61.9 − 40) ÷ (61.9 − 18.3) = {{primary}}.",
        say: "How much of each? Use a tie line from eighteen point three to sixty-one point nine. Primary alpha is sixty-one point nine minus forty, over sixty-one point nine minus eighteen point three. That's {{primarySay}}.",
      },
      { text: "And the eutectic is {{eutectic}}. About half and half." },
    ],
  },
  {
    id: "invariant",
    chapter: "Eutectoid and peritectic",
    lines: [
      { text: "There are three reactions you must know. Each happens at one fixed temperature." },
      { text: "Eutectic: one liquid turns into two solids. L → α + β.", say: "Eutectic: one liquid turns into two solids. Liquid gives alpha plus beta." },
      { text: "Eutectoid: the same idea, but one solid turns into two new solids. γ → α + β.", say: "Eutectoid: the same idea, but one solid turns into two new solids. Gamma gives alpha plus beta." },
      { text: "Peritectic: a solid and a liquid join into one new solid. α + L → β.", say: "Peritectic: a solid and a liquid join into one new solid. Alpha plus liquid gives beta." },
      { text: "Memory trick: 'tectic' has a liquid in it. 'Tectoid' is all solid." },
      { text: "Eu: one splits into two. Peri: two join into one." },
      { text: "Copper–zinc shows both. A eutectoid at 560 °C: δ → γ + ε.", say: "Copper zinc shows both. A eutectoid at five hundred sixty degrees: delta gives gamma plus epsilon." },
      { text: "And a peritectic at 598 °C: δ + L → ε.", say: "And a peritectic at five hundred ninety-eight degrees: delta plus liquid gives epsilon." },
      { text: "On any diagram, find a flat line. One phase above splitting into two below? Eutectic or eutectoid. Two joining into one? Peritectic." },
    ],
  },
  {
    id: "iron",
    chapter: "The iron–carbon diagram",
    lines: [
      { text: "Now the most important diagram in engineering: iron and iron carbide." },
      { text: "First, pure iron changes its crystal as it heats. At room temperature it is ferrite, α iron, with a BCC structure." },
      { text: "At 912 °C it becomes austenite, γ iron, with an FCC structure." },
      { text: "At 1394 °C it goes back to BCC, called δ ferrite. And at 1538 °C it melts." },
      { text: "Now add carbon. The diagram stops at 6.70 wt% carbon, where iron carbide forms: Fe₃C, called cementite.", say: "Now add carbon. The diagram stops at six point seven percent carbon, where iron carbide forms, called cementite." },
      { text: "Ferrite holds very little carbon: at most 0.022 wt%, at 727 °C. Its BCC gaps are too small." },
      { text: "Austenite holds much more: up to 2.14 wt%, at 1147 °C. Its FCC gaps are bigger." },
      { text: "Cementite is hard and brittle, and it always has 6.70 wt% carbon." },
      { text: "Now three invariant points. At 1493 °C, a peritectic: δ + L → γ.", say: "Now three invariant points. At fourteen ninety-three degrees, a peritectic: delta plus liquid gives gamma." },
      { text: "At 1147 °C and 4.30 wt% carbon, a eutectic: L → γ + Fe₃C.", say: "At eleven forty-seven degrees and four point three percent carbon, a eutectic: liquid gives austenite plus cementite." },
      { text: "At 727 °C and 0.76 wt% carbon, the eutectoid: γ → α + Fe₃C.", say: "And at seven twenty-seven degrees and zero point seven six percent carbon, the eutectoid: austenite gives ferrite plus cementite." },
      { text: "Below 2.14 wt% carbon, we call it steel. From 2.14 to 6.70 wt%, it's cast iron." },
    ],
  },
  {
    id: "steels",
    chapter: "Inside steel",
    lines: [
      { text: "The eutectoid is the heart of heat treatment. Let's cool three steels." },
      { text: "First, exactly 0.76 wt% carbon: a eutectoid steel. At 800 °C it is all austenite." },
      { text: "At 727 °C, all of it turns into thin alternating layers of ferrite and cementite. This is pearlite." },
      { text: "Under a microscope it shines like mother-of-pearl. That's where the name comes from." },
      { text: "Inside pearlite, by the lever rule: ferrite {{pearliteFerrite}}, cementite {{pearliteCementite}}." },
      { text: "Second, less carbon: 0.40 wt%. This is a hypoeutectoid steel. Hypo means below." },
      { text: "On cooling, ferrite forms first, along the austenite grain boundaries. This is proeutectoid ferrite." },
      { text: "At 727 °C, the austenite that's left has 0.76 wt% carbon, so it turns into pearlite." },
      {
        text: "Pearlite = (0.40 − 0.022) ÷ (0.76 − 0.022) = {{hypoP}}. Proeutectoid ferrite = {{hypoF}}.",
        say: "Pearlite is zero point four minus zero point zero two two, over zero point seven six minus zero point zero two two. That's {{hypoPSay}}. The rest, {{hypoFSay}}, is proeutectoid ferrite.",
      },
      { text: "Third, more carbon: 1.20 wt%. This is a hypereutectoid steel. Hyper means above." },
      { text: "Now cementite forms first, along the grain boundaries. This is proeutectoid cementite." },
      {
        text: "Pearlite = (6.70 − 1.20) ÷ (6.70 − 0.76) = {{hyperP}}. Proeutectoid cementite = {{hyperC}}.",
        say: "Pearlite is six point seven minus one point two, over six point seven minus zero point seven six. That's {{hyperPSay}}. Proeutectoid cementite is {{hyperCSay}}.",
      },
    ],
  },
  {
    id: "summary",
    chapter: "Three diagrams to know",
    lines: [
      { text: "Let's put the three syllabus diagrams side by side." },
      { text: "Copper–nickel: isomorphous. Complete solubility, one solid phase α. Melting points 1085 and 1455 °C." },
      { text: "Silver–copper: eutectic at 779 °C and 71.9 wt% silver. α up to 8.0%, β from 91.2%." },
      { text: "Tin–lead: eutectic at 183 °C and 61.9 wt% tin. α up to 18.3%, β from 97.8%. Used in solder." },
    ],
  },
  {
    id: "quiz",
    chapter: "Your turn",
    lines: [
      { text: "Your turn. A steel has 0.60 wt% carbon. Just below 727 °C, what fraction is pearlite? Pause and try." },
      { text: "(0.60 − 0.022) ÷ (0.76 − 0.022) = {{quizP}}. Did you get it?", say: "Zero point six minus zero point zero two two, over zero point seven six minus zero point zero two two. That's {{quizPSay}}. Did you get it?" },
      { text: "Quick one: at a eutectic point in a binary diagram, how many degrees of freedom?" },
      { text: "Zero. P = 3 and C = 2, so F = 2 + 1 − 3 = 0.", say: "Zero. P is three and C is two, so F is two plus one minus three, which is zero." },
    ],
  },
  {
    id: "recap",
    chapter: "Remember",
    lines: [
      { text: "Let's recap the whole unit." },
      { text: "Solubility limit: the most solute that can dissolve. Beyond it, a new phase forms." },
      { text: "Solid solutions are substitutional or interstitial. Hume-Rothery: size, structure, electronegativity, valency." },
      { text: "To read any diagram: the phases, their compositions from the tie line, and their amounts from the lever rule." },
      { text: "Gibbs phase rule at fixed pressure: $P + F = C + 1$.", say: "Gibbs phase rule at fixed pressure: P plus F equals C plus one." },
      { text: "Eutectic: liquid to two solids. Eutectoid: solid to two solids. Peritectic: liquid plus solid to one solid." },
      { text: "Iron–carbon: 727 °C and 0.76% gives pearlite. 1147 °C and 4.30% is the eutectic. Steel is below 2.14% carbon." },
      { text: "Watch this once more before your exam, and you're ready. All the best!" },
    ],
  },
];

const sayFraction = (x: number) => spokenDisplay(f2(x));

export function scriptValues(): Record<string, string> {
  const span = CU_NI_EX.cAlpha - CU_NI_EX.cL;
  return {
    cL: String(CU_NI_EX.cL),
    cAlpha: String(CU_NI_EX.cAlpha),
    span: String(span),
    wL: f2(CU_NI_EX.wL),
    wAlpha: f2(CU_NI_EX.wAlpha),
    wLSay: sayFraction(CU_NI_EX.wL),
    wAlphaSay: sayFraction(CU_NI_EX.wAlpha),
    pbA: String(Math.round(PB_SN_EX.cA)),
    pbB: String(Math.round(PB_SN_EX.cB)),
    pbWa: f2(PB_SN_EX.wA),
    pbWb: f2(PB_SN_EX.wB),
    pbWaSay: sayFraction(PB_SN_EX.wA),
    pbWbSay: sayFraction(PB_SN_EX.wB),
    primary: f2(PB_SN_MICRO.primary),
    primarySay: sayFraction(PB_SN_MICRO.primary),
    eutectic: f2(PB_SN_MICRO.eutectic),
    eutecticAlpha: f2(EUTECTIC_SPLIT.wA),
    pearliteFerrite: f2(PEARLITE.wA),
    pearliteCementite: f2(PEARLITE.wB),
    hypoP: f2(HYPO.pearlite),
    hypoF: f2(HYPO.proeutectoid),
    hypoPSay: sayFraction(HYPO.pearlite),
    hypoFSay: sayFraction(HYPO.proeutectoid),
    hyperP: f2(HYPER.pearlite),
    hyperC: f2(HYPER.proeutectoid),
    hyperPSay: sayFraction(HYPER.pearlite),
    hyperCSay: sayFraction(HYPER.proeutectoid),
    quizP: f2(QUIZ.pearlite),
    quizPSay: sayFraction(QUIZ.pearlite),
  };
}

export function fill(text: string, values: Record<string, string>): string {
  return text.replace(/\{\{(\w+)\}\}/g, (_, k: string) => {
    if (!(k in values)) throw new Error(`Missing value for {{${k}}}`);
    return values[k];
  });
}

// ---------- reading captions aloud ----------

const WORDS: [RegExp, string][] = [
  [/Cu–Ni/g, "copper nickel"],
  [/Cu–Ag/g, "copper silver"],
  [/Pb–Sn/g, "lead tin"],
  [/Fe₃C/g, "cementite"],
  [/(\d) ?°C/g, "$1 degrees"],
  [/ ?wt%/g, " percent"],
  [/%/g, " percent"],
  [/\bnm\b/g, "nanometres"],
  [/\b1 atm\b/g, "one atmosphere"],
  [/α/g, "alpha"],
  [/β/g, "beta"],
  [/γ/g, "gamma"],
  [/δ/g, "delta"],
  [/ε/g, "epsilon"],
  [/ L\b/g, " liquid"],
  [/ → /g, " gives "],
  [/ \+ /g, " plus "],
  [/(\w)–(\w)/g, "$1 $2"],
  [/…/g, ","],
];

/** A year-style reading for 4-digit temperatures: 1085 → "ten eighty-five", 1455 → "fourteen fifty-five", 1300 → "thirteen hundred". */
export function sayThousands(n: number): string {
  const hi = Math.floor(n / 100);
  const lo = n % 100;
  if (lo === 0) return `${spokenNumber(hi)} hundred`;
  return `${spokenNumber(hi)} ${lo < 10 ? `oh ${spokenNumber(lo)}` : spokenNumber(lo)}`;
}

/** Turns a caption into words for the voice: symbols and numbers become words. */
export function speak(text: string): string {
  let s = text.replace(/\$[^$]*\$:?\s*/g, "");
  for (const [re, w] of WORDS) s = s.replace(re, w);
  s = s.replace(/\d+(\.\d+)?/g, (m) => {
    if (m.includes(".")) return spokenDisplay(m);
    const n = Number(m);
    return n >= 1000 && n < 10000 ? sayThousands(n) : spokenNumber(n);
  });
  return s.replace(/\s+/g, " ").trim();
}

export const spokenText = (l: Line, values: Record<string, string>) => speak(fill(l.say ?? l.text, values));
export const lineKey = (beat: BeatId, index: number) => `${beat}-${index}`;

// ---------- timing: every line starts when the one before it has been spoken ----------

export interface VoiceClip {
  src: string;
  seconds: number;
}
export type Voice = Record<string, VoiceClip>;
export interface PlannedLine {
  key: string;
  at: number;
  seconds: number;
  clip?: VoiceClip;
}
export interface PlannedBeat {
  id: BeatId;
  from: number;
  seconds: number;
  lines: PlannedLine[];
}

const LEAD_S = 0.7;
const GAP_S = 0.45;
const TAIL_S = 1.2;
/** Extra time to look before the next line: diagrams being drawn, and the pause-and-try questions. */
export const PAUSE_AFTER: Record<string, number> = {
  "unary-2": 1.2,
  "cuni-4": 0.8,
  "threeq-5": 0.8,
  "lever-6": 0.6,
  "cooling-1": 1.0,
  "cooling-3": 2.0,
  "eutectic-6": 0.8,
  "micro-5": 1.0,
  "iron-4": 0.8,
  "steels-2": 1.0,
  "quiz-0": 5,
  "quiz-2": 4,
};

export const estimateSeconds = (say: string) => 0.4 + say.trim().split(/\s+/).length / 2.6;

export function planPhase(voice: Voice = {}): { beats: PlannedBeat[]; seconds: number } {
  const values = scriptValues();
  let from = 0;
  const beats = BEATS.map((b) => {
    let t = LEAD_S;
    const lines = b.lines.map((line, i) => {
      const key = lineKey(b.id, i);
      const clip = voice[key];
      const seconds = clip ? clip.seconds : estimateSeconds(spokenText(line, values));
      const planned = { key, at: t, seconds, clip };
      t += seconds + GAP_S + (PAUSE_AFTER[key] ?? 0);
      return planned;
    });
    const seconds = t - GAP_S + TAIL_S;
    const planned = { id: b.id, from, seconds, lines };
    from += seconds;
    return planned;
  });
  return { beats, seconds: from };
}
