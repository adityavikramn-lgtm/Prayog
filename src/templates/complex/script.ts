// Words for the "Analytic functions from zero" lesson. text = caption ($…$ = maths), say = what the voice
// reads (needed whenever the caption has symbols), board = maths that appears on the board at that line.

import { speak } from "../phase/script";
import { MCQS } from "./model";

export type Kind = "hook" | "plane" | "map" | "approach" | "board" | "contour" | "mcq" | "recap";

export interface Line {
  text: string;
  say?: string;
  /** TeX added to the board when this line starts (board scenes). */
  board?: string;
  /** Colour of that board line (defaults to chalk). */
  tone?: "u" | "v" | "key" | "warn" | "ok";
}

export interface Beat {
  id: string;
  chapter: string;
  kind: Kind;
  /** Which function a picture uses (approach / contour). */
  fn?: string;
  /** For MCQ beats: index into MCQS. */
  mcq?: number;
  lines: Line[];
}

const L = (text: string, say?: string, board?: string, tone?: Line["tone"]): Line => ({ text, say, board, tone });

const TEACH: Beat[] = [
  {
    id: "hook",
    chapter: "Why this matters",
    kind: "hook",
    lines: [
      L("This is what a function of a complex number looks like. It bends the whole plane."),
      L("Some functions bend it smoothly, keeping every tiny angle the same. These are called analytic functions."),
      L("Engineers use them for fluid flow, electric fields and heat. And they are the heart of this unit."),
      L("We start from zero: what a complex number is. No background needed."),
      L("By the end you will solve every type of question: analytic or not, Cauchy–Riemann, harmonic functions and conjugates.", "By the end you will solve every type of question: analytic or not, Cauchy Riemann, harmonic functions and conjugates."),
      L("And then twenty MCQs and five full exam answers to lock it in."),
    ],
  },
  {
    id: "numbers",
    chapter: "Complex numbers in 2 minutes",
    kind: "plane",
    lines: [
      L("Start with $i$. It is a number whose square is minus one: $i^2 = -1$.", "Start with i. It is a number whose square is minus one."),
      L("A complex number is $z = x + iy$. $x$ is the real part, $y$ is the imaginary part.", "A complex number is z equals x plus i y. x is the real part, and y is the imaginary part."),
      L("Think of $z$ as a point on a plane: $x$ across, $y$ up. For $z = 3 + 4i$, go 3 right and 4 up.", "Think of z as a point on a plane: x across, y up. For 3 plus 4 i, go 3 right and 4 up."),
      L("Its distance from the origin is the modulus: $|z| = \\sqrt{x^2 + y^2} = 5$.", "Its distance from the origin is the modulus, the square root of x squared plus y squared. Here it is 5."),
      L("Its angle from the x-axis is the argument, $\\theta$.", "Its angle from the x axis is called the argument, theta."),
      L("So $z = r(\\cos\\theta + i\\sin\\theta) = re^{i\\theta}$. This is the polar form.", "So z is r times cos theta plus i sin theta, which is r e to the i theta. This is the polar form."),
      L("The conjugate $\\bar z = x - iy$ is the mirror image in the x-axis.", "The conjugate, z bar, is x minus i y: the mirror image in the x axis."),
      L("One useful fact: $z\\bar z = x^2 + y^2 = |z|^2$.", "One useful fact: z times z bar is x squared plus y squared, which is mod z squared."),
    ],
  },
  {
    id: "functions",
    chapter: "Functions of z",
    kind: "map",
    fn: "z2",
    lines: [
      L("A function of a complex variable takes a point $z$ and gives a point $w = f(z)$.", "A function of a complex variable takes a point z and gives another point, w equals f of z."),
      L("Every such function splits into a real part and an imaginary part: $f = u(x,y) + i\\,v(x,y)$.", "Every such function splits into a real part u and an imaginary part v, both depending on x and y."),
      L("Example: $z^2 = (x+iy)^2 = x^2 - y^2 + 2ixy$. So $u = x^2 - y^2$ and $v = 2xy$.", "Example: z squared is x squared minus y squared, plus 2 i x y. So u is x squared minus y squared, and v is 2 x y."),
      L("Watch what $z^2$ does: straight grid lines on the left become curves on the right.", "Watch what z squared does: the straight grid lines on the left become curves on the right."),
      L("Yet where curves cross, they still cross at right angles. Remember that; it is a sign of an analytic function."),
      L("Two more you will meet: $e^z = e^x(\\cos y + i\\sin y)$, so $u = e^x\\cos y$, $v = e^x\\sin y$.", "Two more you will meet. e to the z is e to the x, times cos y plus i sin y. So u is e to the x cos y, and v is e to the x sin y."),
      L("And $\\bar z$, with $u = x$ and $v = -y$. That one will turn out to be badly behaved.", "And z bar, with u equals x and v equals minus y. That one will turn out to be badly behaved."),
    ],
  },
  {
    id: "limits",
    chapter: "Limit and continuity",
    kind: "board",
    lines: [
      L("In real calculus, $x$ can approach a point from only two sides: left or right.", "In real calculus, x can approach a point from only two sides: left or right."),
      L("In the complex plane, $z$ can approach $z_0$ from every direction, and along any curve.", "In the complex plane, z can approach z nought from every direction, and along any curve.", "z \\to z_0 \\ \\text{from every direction}", "key"),
      L("The limit exists only if $f(z)$ heads to the same value along every path.", "The limit exists only if f of z heads to the same value along every path.", "\\lim_{z\\to z_0} f(z) = L \\ \\text{(same on every path)}"),
      L("If two paths give different values, the limit does not exist. That is the quickest way to disprove a limit."),
      L("A function is continuous at $z_0$ if the limit equals the value there: $\\lim f(z) = f(z_0)$.", "A function is continuous at z nought if the limit equals the value there.", "\\lim_{z\\to z_0} f(z) = f(z_0)", "ok"),
      L("And $f = u + iv$ is continuous exactly when $u$ and $v$ are both continuous.", "And f is continuous exactly when u and v are both continuous."),
    ],
  },
  {
    id: "derivative",
    chapter: "The derivative",
    kind: "approach",
    fn: "z2",
    lines: [
      L("The derivative is defined just like in school:", undefined, "f'(z_0) = \\lim_{\\Delta z \\to 0} \\dfrac{f(z_0 + \\Delta z) - f(z_0)}{\\Delta z}", "key"),
      L("But now $\\Delta z$ can shrink from any direction. The arrow shows the direction we come from.", "But now delta z can shrink from any direction. The arrow shows the direction we come from."),
      L("For $f = z^2$ at $z_0 = 1 + 0.5i$, the ratio always comes out the same: $2z_0 = 2 + i$.", "For z squared at 1 plus half i, the ratio always comes out the same: 2 z nought, which is 2 plus i."),
      L("Algebra agrees: $\\dfrac{(z+\\Delta z)^2 - z^2}{\\Delta z} = 2z + \\Delta z \\to 2z$.", "The algebra agrees: the ratio simplifies to 2 z plus delta z, which goes to 2 z.", "\\dfrac{(z+\\Delta z)^2 - z^2}{\\Delta z} = 2z + \\Delta z \\to 2z"),
      L("All your usual rules still work: sum, product, quotient and chain rule. So $(z^n)' = nz^{n-1}$.", "All your usual rules still work: sum, product, quotient and chain rule. So the derivative of z to the n is n z to the n minus 1.", "(z^n)' = n z^{n-1}", "ok"),
      L("If $f$ is differentiable at a point, it is also continuous there. The opposite is not true."),
    ],
  },
  {
    id: "zbar",
    chapter: "A function that fails",
    kind: "approach",
    fn: "conj",
    lines: [
      L("Now try $f(z) = \\bar z$. It looks harmless.", "Now try f of z equals z bar. It looks harmless."),
      L("The ratio is $\\dfrac{\\Delta \\bar z}{\\Delta z} = \\dfrac{\\Delta x - i\\Delta y}{\\Delta x + i\\Delta y}$.", "The ratio is delta x minus i delta y, over delta x plus i delta y.", "\\dfrac{\\overline{\\Delta z}}{\\Delta z} = \\dfrac{\\Delta x - i\\Delta y}{\\Delta x + i\\Delta y}"),
      L("Come in horizontally ($\\Delta y = 0$): the ratio is $1$.", "Come in horizontally, with delta y zero: the ratio is 1.", "\\text{horizontal: } 1", "u"),
      L("Come in vertically ($\\Delta x = 0$): the ratio is $-1$.", "Come in vertically, with delta x zero: the ratio is minus 1.", "\\text{vertical: } -1", "v"),
      L("Along $y = mx$ it is $\\dfrac{1 - im}{1 + im}$: a different value for every direction. Watch the pointer turn.", "Along the line y equals m x, it is 1 minus i m, over 1 plus i m. A different value for every direction. Watch the pointer turn.", "y = mx: \\ \\dfrac{1 - im}{1 + im}"),
      L("So the limit does not exist. $\\bar z$ is not differentiable anywhere, even though it is continuous everywhere.", "So the limit does not exist. z bar is not differentiable anywhere, even though it is continuous everywhere.", "\\bar z: \\text{ continuous, nowhere differentiable}", "warn"),
      L("A similar check shows $|z|^2$ is differentiable only at $z = 0$, and nowhere else.", "A similar check shows that mod z squared is differentiable only at z equals zero, and nowhere else.", "|z|^2: \\text{ differentiable only at } 0", "warn"),
    ],
  },
  {
    id: "analytic",
    chapter: "What 'analytic' means",
    kind: "board",
    lines: [
      L("Now the key word. A function is analytic at a point if it is differentiable at that point AND at every point near it.", "Now the key word. A function is analytic at a point if it is differentiable at that point, and at every point near it."),
      L("So analytic means differentiable in a whole neighbourhood, a small disc around the point.", undefined, "\\text{analytic at } z_0 \\iff f' \\text{ exists in a disc around } z_0", "key"),
      L("Analytic in a region means analytic at every point of it."),
      L("Analytic in the whole plane? That is called an entire function, like $z^n$, $e^z$, $\\sin z$.", "Analytic in the whole plane? That is called an entire function, like z to the n, e to the z, and sine z.", "\\text{entire: } z^n,\\ e^z,\\ \\sin z,\\ \\cos z", "ok"),
      L("A point where $f$ stops being analytic is a singular point. $\\dfrac1z$ is analytic everywhere except its singular point $z = 0$.", "A point where f stops being analytic is called a singular point. One over z is analytic everywhere except its singular point, z equals zero.", "\\dfrac1z: \\text{ singular at } z = 0", "warn"),
      L("Careful: $|z|^2$ is differentiable at $0$ but not near it. So it is differentiable at $0$, yet analytic nowhere.", "Careful: mod z squared is differentiable at zero, but not near it. So it is differentiable at zero, yet analytic nowhere.", "|z|^2: \\text{ differentiable at } 0,\\ \\text{analytic nowhere}", "warn"),
      L("Exams love this difference. Differentiable at a point is not the same as analytic at a point."),
    ],
  },
  {
    id: "cr",
    chapter: "The Cauchy–Riemann equations",
    kind: "board",
    lines: [
      L("Checking limits every time is slow. Here is the shortcut: the Cauchy–Riemann equations.", "Checking limits every time is slow. Here is the shortcut: the Cauchy Riemann equations."),
      L("If $f'(z)$ exists, the limit must be the same horizontally and vertically.", "If f dash of z exists, the limit must be the same horizontally and vertically."),
      L("Horizontally, $\\Delta z = \\Delta x$:", "Horizontally, delta z is delta x. We get u x plus i v x.", "\\text{horizontal: } f' = u_x + i\\,v_x", "u"),
      L("Vertically, $\\Delta z = i\\Delta y$:", "Vertically, delta z is i delta y. Dividing by i, we get v y minus i u y.", "\\text{vertical: } f' = \\dfrac{u_y + i v_y}{i} = v_y - i\\,u_y", "v"),
      L("Both must be equal. Match the real parts and the imaginary parts:", "Both must be equal. Match the real parts and the imaginary parts."),
      L("$u_x = v_y$ and $u_y = -v_x$. These are the Cauchy–Riemann equations.", "u x equals v y, and u y equals minus v x. These are the Cauchy Riemann equations.", "u_x = v_y, \\qquad u_y = -v_x", "key"),
      L("Memory trick: same letters on the left are equal, cross letters get a minus.", "Memory trick: the first pair is equal, and the cross pair gets a minus sign."),
      L("And the derivative comes free: $f'(z) = u_x + i\\,v_x$.", "And the derivative comes for free: f dash of z equals u x plus i v x.", "f'(z) = u_x + i\\,v_x = v_y - i\\,u_y", "ok"),
    ],
  },
  {
    id: "necsuff",
    chapter: "Necessary and sufficient",
    kind: "board",
    lines: [
      L("Necessary: if $f$ is differentiable at a point, then CR must hold there. So if CR fails, $f$ is not differentiable.", "This is the necessary condition: if f is differentiable at a point, Cauchy Riemann must hold there. So if Cauchy Riemann fails, f is not differentiable.", "\\text{differentiable} \\Rightarrow \\text{CR}", "key"),
      L("But CR alone is not enough. There are functions that satisfy CR at a point and still are not differentiable there."),
      L("Sufficient: if $u_x, u_y, v_x, v_y$ are continuous AND satisfy CR, then $f$ is differentiable.", "The sufficient condition: if u x, u y, v x and v y are continuous, and satisfy Cauchy Riemann, then f is differentiable.", "\\text{CR} + \\text{continuous partials} \\Rightarrow \\text{differentiable}", "ok"),
      L("In exam answers, always write both parts: the partials are continuous, and CR holds."),
      L("Check $z^2$: $u_x = 2x = v_y$ and $u_y = -2y = -v_x$. CR holds everywhere, so $z^2$ is entire.", "Check z squared: u x is 2 x, which equals v y. And u y is minus 2 y, which equals minus v x. Cauchy Riemann holds everywhere, so z squared is entire.", "z^2:\\ u_x = 2x = v_y,\\ \\ u_y = -2y = -v_x \\ \\checkmark", "ok"),
      L("Check $e^z$: $u_x = e^x\\cos y = v_y$ and $u_y = -e^x\\sin y = -v_x$. Entire too, and $(e^z)' = e^z$.", "Check e to the z: u x is e to the x cos y, which equals v y. And u y is minus e to the x sin y, which equals minus v x. Entire too, and its derivative is e to the z.", "e^z:\\ u_x = e^x\\cos y = v_y,\\ \\ u_y = -e^x\\sin y = -v_x \\ \\checkmark", "ok"),
      L("Check $\\bar z$: $u_x = 1$ but $v_y = -1$. CR fails everywhere, as we saw.", "Check z bar: u x is 1, but v y is minus 1. Cauchy Riemann fails everywhere, as we saw.", "\\bar z:\\ u_x = 1 \\ne v_y = -1 \\ \\times", "warn"),
    ],
  },
  {
    id: "where",
    chapter: "Exam type: where is it analytic?",
    kind: "board",
    lines: [
      L("The most common question: where is this function analytic? Here is the method."),
      L("Step 1: write $u$ and $v$. Step 2: find the four partials. Step 3: solve the CR equations.", "Step 1: write u and v. Step 2: find the four partial derivatives. Step 3: solve the Cauchy Riemann equations.", "\\text{1. } u, v \\quad \\text{2. } u_x, u_y, v_x, v_y \\quad \\text{3. solve CR}", "key"),
      L("Example: $f = (x - iy)^2$. Then $u = x^2 - y^2$, $v = -2xy$.", "Example: f equals x minus i y, the whole squared. Then u is x squared minus y squared, and v is minus 2 x y.", "f = (x - iy)^2:\\ \\ u = x^2 - y^2,\\ v = -2xy"),
      L("$u_x = 2x$ and $v_y = -2x$. Equal only if $x = 0$.", "u x is 2 x and v y is minus 2 x. They are equal only if x is zero.", "u_x = 2x,\\ v_y = -2x \\Rightarrow x = 0", "u"),
      L("$u_y = -2y$ and $-v_x = 2y$. Equal only if $y = 0$.", "u y is minus 2 y, and minus v x is 2 y. Equal only if y is zero.", "u_y = -2y,\\ -v_x = 2y \\Rightarrow y = 0", "v"),
      L("So it is differentiable only at $z = 0$. One point is not a disc, so it is analytic nowhere.", "So it is differentiable only at z equals zero. A single point is not a disc, so it is analytic nowhere.", "\\text{differentiable only at } 0 \\Rightarrow \\text{analytic nowhere}", "warn"),
      L("Rule of thumb: CR holding on a whole open region means analytic there. Only at points or on a line means analytic nowhere.", "Rule of thumb: if Cauchy Riemann holds on a whole open region, the function is analytic there. If it holds only at points or on a line, it is analytic nowhere.", "\\text{CR on an open region} \\Rightarrow \\text{analytic};\\ \\text{points or a line} \\Rightarrow \\text{nowhere}", "key"),
    ],
  },
  {
    id: "constants",
    chapter: "Exam type: find the constants",
    kind: "board",
    lines: [
      L("Another favourite: find $a, b, c, d$ so that $f = x^2 + axy + by^2 + i(cx^2 + dxy + y^2)$ is analytic.", "Another favourite: find a, b, c and d so that this function is analytic.", "f = x^2 + axy + by^2 + i\\,(cx^2 + dxy + y^2)"),
      L("Write the partials: $u_x = 2x + ay$, $u_y = ax + 2by$, $v_x = 2cx + dy$, $v_y = dx + 2y$.", "Write the partial derivatives: u x is 2 x plus a y, u y is a x plus 2 b y, v x is 2 c x plus d y, and v y is d x plus 2 y.", "u_x = 2x + ay,\\ u_y = ax + 2by,\\ v_x = 2cx + dy,\\ v_y = dx + 2y"),
      L("$u_x = v_y$ for all $x, y$: match the $x$ terms and the $y$ terms, so $d = 2$ and $a = 2$.", "u x equals v y for all x and y. Match the x terms and the y terms: d is 2 and a is 2.", "2x + ay = dx + 2y \\Rightarrow d = 2,\\ a = 2", "u"),
      L("$u_y = -v_x$: $ax + 2by = -2cx - dy$, so $a = -2c$ and $2b = -d$.", "u y equals minus v x. That gives a equals minus 2 c, and 2 b equals minus d.", "ax + 2by = -2cx - dy \\Rightarrow a = -2c,\\ 2b = -d", "v"),
      L("So $a = 2$, $b = -1$, $c = -1$, $d = 2$. And in fact $f = (1 - i)z^2$.", "So a is 2, b is minus 1, c is minus 1, and d is 2. In fact, the function is 1 minus i, times z squared.", "a = 2,\\ b = -1,\\ c = -1,\\ d = 2 \\quad (f = (1-i)z^2)", "ok"),
      L("The trick: CR must hold for every $x$ and $y$, so compare coefficients term by term.", "The trick: Cauchy Riemann must hold for every x and y, so compare the coefficients term by term."),
    ],
  },
  {
    id: "polar",
    chapter: "Cauchy–Riemann in polar form",
    kind: "board",
    lines: [
      L("Some functions are easier in polar form, $z = re^{i\\theta}$, with $u(r,\\theta)$ and $v(r,\\theta)$.", "Some functions are easier in polar form, with u and v depending on r and theta."),
      L("Then the CR equations become:", "Then the Cauchy Riemann equations become: u r equals one over r v theta, and v r equals minus one over r u theta.", "u_r = \\dfrac1r\\,v_\\theta, \\qquad v_r = -\\dfrac1r\\,u_\\theta", "key"),
      L("And the derivative is $f'(z) = e^{-i\\theta}(u_r + i\\,v_r)$.", "And the derivative is e to the minus i theta, times u r plus i v r.", "f'(z) = e^{-i\\theta}\\,(u_r + i\\,v_r)", "ok"),
      L("Example: $z^n = r^n(\\cos n\\theta + i\\sin n\\theta)$. So $u = r^n\\cos n\\theta$, $v = r^n\\sin n\\theta$.", "Example: z to the n is r to the n, times cos n theta plus i sin n theta. So u is r to the n cos n theta, and v is r to the n sin n theta.", "z^n:\\ u = r^n\\cos n\\theta,\\ \\ v = r^n\\sin n\\theta"),
      L("$u_r = nr^{n-1}\\cos n\\theta$ and $\\frac1r v_\\theta = nr^{n-1}\\cos n\\theta$. Equal, as they should be.", "u r is n r to the n minus 1 cos n theta. One over r times v theta is the same. Equal, as they should be.", "u_r = n r^{n-1}\\cos n\\theta = \\tfrac1r v_\\theta \\ \\checkmark", "ok"),
    ],
  },
  {
    id: "constant",
    chapter: "If f′ = 0, f is constant",
    kind: "board",
    lines: [
      L("A short theory question: if $f$ is analytic and $f'(z) = 0$ everywhere in a region, show $f$ is constant.", "A short theory question: if f is analytic and f dash is zero everywhere in a region, show that f is constant."),
      L("$f' = u_x + iv_x = 0$, so $u_x = 0$ and $v_x = 0$.", "f dash is u x plus i v x, which is zero. So u x is zero, and v x is zero.", "f' = u_x + iv_x = 0 \\Rightarrow u_x = v_x = 0"),
      L("By CR, $u_y = -v_x = 0$ and $v_y = u_x = 0$.", "By Cauchy Riemann, u y equals minus v x, which is zero, and v y equals u x, which is zero.", "u_y = -v_x = 0,\\quad v_y = u_x = 0"),
      L("All four partials are zero, so $u$ and $v$ are constant, and so is $f$.", "All four partial derivatives are zero, so u and v are constant, and so is f.", "\\Rightarrow u, v \\text{ constant} \\Rightarrow f \\text{ constant}", "ok"),
      L("Same idea: an analytic function with constant real part, or constant modulus, must be constant.", "The same idea shows that an analytic function with a constant real part, or a constant modulus, must be constant."),
    ],
  },
  {
    id: "harmonic",
    chapter: "Harmonic functions",
    kind: "contour",
    fn: "z2",
    lines: [
      L("A function $u(x,y)$ is harmonic if it satisfies Laplace's equation: $u_{xx} + u_{yy} = 0$.", "A function u is harmonic if it satisfies Laplace's equation: u x x plus u y y equals zero.", "u_{xx} + u_{yy} = 0", "key"),
      L("Big fact: the real and imaginary parts of an analytic function are always harmonic."),
      L("Proof: $u_{xx} = (v_y)_x = v_{yx}$ and $u_{yy} = (-v_x)_y = -v_{xy}$. They cancel.", "Proof: u x x is v y x, and u y y is minus v x y. They cancel.", "u_{xx} + u_{yy} = v_{yx} - v_{xy} = 0", "ok"),
      L("Check $u = x^2 - y^2$: $u_{xx} = 2$, $u_{yy} = -2$, sum zero. Harmonic.", "Check u equals x squared minus y squared: u x x is 2, u y y is minus 2, the sum is zero. Harmonic.", "u = x^2 - y^2:\\ 2 + (-2) = 0 \\ \\checkmark", "u"),
      L("If $u + iv$ is analytic, $v$ is called a harmonic conjugate of $u$. For $x^2 - y^2$, it is $v = 2xy$.", "If u plus i v is analytic, v is called a harmonic conjugate of u. For x squared minus y squared, it is 2 x y.", "v = 2xy \\text{ is a harmonic conjugate of } x^2 - y^2", "v"),
      L("Look at the curves $u = $ constant in blue and $v = $ constant in orange. They always meet at right angles.", "Look at the curves where u is constant, in blue, and where v is constant, in orange. They always meet at right angles."),
      L("Why: their gradients satisfy $u_x v_x + u_y v_y = u_x(-u_y) + u_y(u_x) = 0$ by CR.", "Why? The dot product of their gradients is u x v x plus u y v y. By Cauchy Riemann that is zero.", "\\nabla u \\cdot \\nabla v = u_xv_x + u_yv_y = -u_xu_y + u_yu_x = 0", "ok"),
      L("So the level curves of an analytic function are orthogonal. This answers the 'show the curves are orthogonal' questions."),
    ],
  },
  {
    id: "conjugate",
    chapter: "Finding the conjugate (method 1)",
    kind: "board",
    lines: [
      L("Exam type: show $u = y^3 - 3x^2y$ is harmonic and find $v$ and $f(z)$.", "Exam type: show that u equals y cubed minus 3 x squared y is harmonic, and find v and f of z.", "u = y^3 - 3x^2y"),
      L("Harmonic: $u_{xx} = -6y$, $u_{yy} = 6y$, sum zero.", "Harmonic: u x x is minus 6 y, u y y is 6 y, the sum is zero.", "u_{xx} = -6y,\\ u_{yy} = 6y \\Rightarrow \\nabla^2 u = 0 \\ \\checkmark", "ok"),
      L("From CR, $v_y = u_x = -6xy$. Integrate in $y$: $v = -3xy^2 + h(x)$.", "From Cauchy Riemann, v y equals u x, which is minus 6 x y. Integrate with respect to y: v is minus 3 x y squared, plus some function h of x.", "v_y = u_x = -6xy \\Rightarrow v = -3xy^2 + h(x)", "v"),
      L("Use the other equation: $v_x = -u_y$. So $-3y^2 + h'(x) = 3x^2 - 3y^2$.", "Use the other equation, v x equals minus u y. So minus 3 y squared plus h dash of x equals 3 x squared minus 3 y squared.", "v_x = -u_y:\\ -3y^2 + h'(x) = 3x^2 - 3y^2"),
      L("So $h'(x) = 3x^2$, and $h = x^3 + C$. Therefore $v = x^3 - 3xy^2 + C$.", "So h dash is 3 x squared, and h is x cubed plus a constant. Therefore v is x cubed minus 3 x y squared, plus C.", "h = x^3 + C \\Rightarrow v = x^3 - 3xy^2 + C", "v"),
      L("Put them together: $f = u + iv = i z^3 + iC$. You can check: the real part of $iz^3$ is $y^3 - 3x^2y$.", "Put them together: f equals i z cubed, plus a constant. You can check that the real part of i z cubed is y cubed minus 3 x squared y.", "f(z) = i z^3 + iC", "ok"),
    ],
  },
  {
    id: "milne",
    chapter: "Finding f fast: Milne–Thomson",
    kind: "board",
    lines: [
      L("A faster method, called Milne–Thomson, finds $f(z)$ directly from $u$.", "A faster method, called Milne Thomson, finds f of z directly from u."),
      L("Since $f' = u_x + iv_x = u_x - iu_y$, put $x = z$ and $y = 0$:", "Since f dash is u x plus i v x, which is u x minus i u y, put x equals z and y equals zero.", "f'(z) = u_x(z, 0) - i\\,u_y(z, 0)", "key"),
      L("Then integrate in $z$. That is all.", "Then integrate with respect to z. That is all.", "f(z) = \\int \\big[u_x(z,0) - i\\,u_y(z,0)\\big]\\,dz + C"),
      L("Example: $u = e^x\\cos y$. $u_x(z,0) = e^z$ and $u_y(z,0) = 0$. So $f' = e^z$ and $f = e^z + C$.", "Example: u equals e to the x cos y. u x at z comma zero is e to the z, and u y there is zero. So f dash is e to the z, and f is e to the z plus C.", "u = e^x\\cos y:\\ f' = e^z \\Rightarrow f = e^z + C", "ok"),
      L("Example: $u = \\dfrac{x}{x^2 + y^2}$. $u_x(z,0) = -\\dfrac1{z^2}$ and $u_y(z,0) = 0$, so $f = \\dfrac1z + C$.", "Example: u equals x over x squared plus y squared. u x at z comma zero is minus one over z squared, and u y there is zero. So f is one over z plus C.", "u = \\dfrac{x}{x^2+y^2}:\\ f' = -\\dfrac{1}{z^2} \\Rightarrow f = \\dfrac1z + C", "ok"),
      L("If you are given $v$ instead, use $f'(z) = v_y(z,0) + i\\,v_x(z,0)$.", "If you are given v instead, use f dash equals v y at z comma zero, plus i v x at z comma zero.", "\\text{given } v:\\ f'(z) = v_y(z,0) + i\\,v_x(z,0)", "v"),
    ],
  },
  {
    id: "polarharm",
    chapter: "Harmonic functions in polar form",
    kind: "board",
    lines: [
      L("In polar form, Laplace's equation is $u_{rr} + \\frac1r u_r + \\frac1{r^2}u_{\\theta\\theta} = 0$.", "In polar form, Laplace's equation is u r r plus one over r u r plus one over r squared u theta theta equals zero.", "u_{rr} + \\tfrac1r u_r + \\tfrac1{r^2} u_{\\theta\\theta} = 0", "key"),
      L("Example: $u = \\ln r$. $u_r = \\frac1r$, $u_{rr} = -\\frac1{r^2}$, $u_{\\theta\\theta} = 0$. Sum: zero. Harmonic.", "Example: u equals log r. u r is one over r, u r r is minus one over r squared, and u theta theta is zero. The sum is zero, so it is harmonic.", "u = \\ln r:\\ -\\tfrac1{r^2} + \\tfrac1{r^2} + 0 = 0 \\ \\checkmark", "ok"),
      L("Its conjugate: $v_\\theta = r u_r = 1$, so $v = \\theta$. And $f = \\ln r + i\\theta = \\ln z$.", "Its conjugate: v theta equals r u r, which is 1, so v is theta. And f is log r plus i theta, which is log z.", "v_\\theta = r u_r = 1 \\Rightarrow v = \\theta,\\quad f = \\ln z", "v"),
      L("And $u = r^n\\cos n\\theta$ gives $v = r^n\\sin n\\theta$ and $f = z^n$.", "And u equals r to the n cos n theta gives v equals r to the n sin n theta, and f equals z to the n.", "u = r^n\\cos n\\theta \\Rightarrow f = z^n", "ok"),
    ],
  },
];

/** MCQ beats: question (with options on screen), a 5-second think, then the answer and why. */
const MCQ_BEATS: Beat[] = MCQS.map((m, i) => ({
  id: `mcq${i + 1}`,
  chapter: `MCQ ${i + 1} of ${MCQS.length}`,
  kind: "mcq" as const,
  mcq: i,
  lines: [L(m.q, m.say), L(`Answer: ${String.fromCharCode(65 + m.correct)}. ${m.why}`, `The answer is ${"ABCD"[m.correct]}. ${m.whySay ?? m.why}`)],
}));

const SUBJECTIVE: Beat[] = [
  {
    id: "sub1",
    chapter: "Subjective 1: where analytic?",
    kind: "board",
    lines: [
      L("Question: where is $f(z) = iz - |z|^2$ analytic?", "Question: where is i z minus mod z squared analytic?", "f(z) = iz - |z|^2"),
      L("With $z = x + iy$: $iz = -y + ix$. So $u = -y - x^2 - y^2$ and $v = x$.", "With z equals x plus i y, i z is minus y plus i x. So u is minus y minus x squared minus y squared, and v is x.", "u = -y - x^2 - y^2,\\qquad v = x"),
      L("Partials: $u_x = -2x$, $u_y = -1 - 2y$, $v_x = 1$, $v_y = 0$. All continuous.", "The partials are: u x is minus 2 x, u y is minus 1 minus 2 y, v x is 1, and v y is zero. All are continuous.", "u_x = -2x,\\ u_y = -1 - 2y,\\ v_x = 1,\\ v_y = 0"),
      L("$u_x = v_y$ gives $x = 0$. $u_y = -v_x$ gives $-1 - 2y = -1$, so $y = 0$.", "u x equals v y gives x equals zero. u y equals minus v x gives minus 1 minus 2 y equals minus 1, so y is zero.", "x = 0,\\quad y = 0", "u"),
      L("Answer: differentiable only at $z = 0$, so analytic nowhere.", "Answer: it is differentiable only at z equals zero, so it is analytic nowhere.", "\\text{differentiable only at } 0;\\ \\text{analytic nowhere}", "ok"),
    ],
  },
  {
    id: "sub2",
    chapter: "Subjective 2: find the constants",
    kind: "board",
    lines: [
      L("Question: find $a$ and $b$ so that $\\cos x(\\cosh y + a\\sinh y) + i\\sin x(\\cosh y + b\\sinh y)$ is analytic.", "Question: find a and b so that this function, with cos x and sin x times hyperbolic terms, is analytic.", "f = \\cos x(\\cosh y + a\\sinh y) + i\\sin x(\\cosh y + b\\sinh y)"),
      L("$u_x = -\\sin x(\\cosh y + a\\sinh y)$ and $v_y = \\sin x(\\sinh y + b\\cosh y)$.", "u x is minus sin x times cosh y plus a sinh y. v y is sin x times sinh y plus b cosh y.", "u_x = -\\sin x(\\cosh y + a\\sinh y),\\quad v_y = \\sin x(\\sinh y + b\\cosh y)"),
      L("$u_x = v_y$ for all $x, y$: compare the $\\cosh y$ and $\\sinh y$ terms. So $b = -1$ and $a = -1$.", "u x equals v y for all x and y. Compare the cosh y terms and the sinh y terms. So b is minus 1 and a is minus 1.", "-\\cosh y - a\\sinh y = b\\cosh y + \\sinh y \\Rightarrow a = b = -1", "u"),
      L("Check with $u_y = -v_x$: $\\cos x(\\sinh y - \\cosh y) = -\\cos x(\\cosh y - \\sinh y)$. True.", "Check with u y equals minus v x. Both sides are cos x times sinh y minus cosh y. True.", "u_y = \\cos x(\\sinh y - \\cosh y) = -v_x \\ \\checkmark", "ok"),
      L("Answer: $a = b = -1$, and then $f = e^{-y}(\\cos x + i\\sin x) = e^{iz}$.", "Answer: a and b are both minus 1, and then f is e to the minus y times cos x plus i sin x, which is e to the i z.", "a = b = -1,\\quad f(z) = e^{iz}", "ok"),
    ],
  },
  {
    id: "sub3",
    chapter: "Subjective 3: Milne–Thomson",
    kind: "board",
    lines: [
      L("Question: show $u = e^{-x}(x\\cos y + y\\sin y)$ is harmonic and find the analytic $f(z)$.", "Question: show that u, equal to e to the minus x times x cos y plus y sin y, is harmonic, and find the analytic function f of z.", "u = e^{-x}(x\\cos y + y\\sin y)"),
      L("Its Laplacian works out to zero (expand $u_{xx}$ and $u_{yy}$ and the terms cancel), so it is harmonic.", "Its Laplacian works out to zero: expand u x x and u y y, and the terms cancel. So it is harmonic.", "\\nabla^2 u = 0 \\ \\checkmark", "ok"),
      L("$u_x(z, 0) = e^{-z}(1 - z)$ and $u_y(z, 0) = 0$.", "u x at z comma zero is e to the minus z times 1 minus z, and u y at z comma zero is zero.", "u_x(z,0) = e^{-z}(1 - z),\\quad u_y(z,0) = 0"),
      L("So $f'(z) = (1 - z)e^{-z}$. Integrating gives $f(z) = z e^{-z} + C$.", "So f dash is 1 minus z, times e to the minus z. Integrating gives f equals z e to the minus z, plus C.", "f'(z) = (1 - z)e^{-z} \\Rightarrow f(z) = z\\,e^{-z} + C", "ok"),
      L("Check: the real part of $z e^{-z}$ is exactly $e^{-x}(x\\cos y + y\\sin y)$.", "Check: the real part of z e to the minus z is exactly the u we started with."),
    ],
  },
  {
    id: "sub4",
    chapter: "Subjective 4: polar conjugate",
    kind: "board",
    lines: [
      L("Question: show $u = \\left(r + \\frac1r\\right)\\cos\\theta$ is harmonic and find $f$.", "Question: show that u equals r plus one over r, times cos theta, is harmonic, and find f.", "u = \\left(r + \\tfrac1r\\right)\\cos\\theta"),
      L("$u_r = \\left(1 - \\frac1{r^2}\\right)\\cos\\theta$, $u_{rr} = \\frac2{r^3}\\cos\\theta$, $u_{\\theta\\theta} = -\\left(r + \\frac1r\\right)\\cos\\theta$.", "u r is 1 minus one over r squared, times cos theta. u r r is 2 over r cubed cos theta. And u theta theta is minus r plus one over r, cos theta.", "u_r = (1 - \\tfrac1{r^2})\\cos\\theta,\\ u_{rr} = \\tfrac2{r^3}\\cos\\theta,\\ u_{\\theta\\theta} = -(r + \\tfrac1r)\\cos\\theta"),
      L("Putting them into the polar Laplace equation, everything cancels. Harmonic.", "Putting them into the polar Laplace equation, everything cancels. So it is harmonic.", "u_{rr} + \\tfrac1r u_r + \\tfrac1{r^2}u_{\\theta\\theta} = 0 \\ \\checkmark", "ok"),
      L("$v_\\theta = r u_r = \\left(r - \\frac1r\\right)\\cos\\theta$, so $v = \\left(r - \\frac1r\\right)\\sin\\theta$.", "v theta equals r u r, which is r minus one over r, cos theta. So v is r minus one over r, sin theta.", "v = \\left(r - \\tfrac1r\\right)\\sin\\theta", "v"),
      L("So $f = z + \\frac1z$, analytic everywhere except $z = 0$.", "So f is z plus one over z, analytic everywhere except z equals zero.", "f(z) = z + \\dfrac1z \\quad (z \\ne 0)", "ok"),
    ],
  },
  {
    id: "sub5",
    chapter: "Subjective 5: orthogonal curves",
    kind: "contour",
    fn: "z2",
    lines: [
      L("Question: for $f(z) = z^2$, find the level curves and show they are orthogonal.", "Question: for f of z equals z squared, find the level curves and show they are orthogonal.", "f(z) = z^2"),
      L("$u = x^2 - y^2 = c_1$ and $v = 2xy = c_2$: two families of hyperbolas.", "u equals x squared minus y squared equals c 1, and v equals 2 x y equals c 2. Two families of hyperbolas.", "x^2 - y^2 = c_1,\\qquad 2xy = c_2", "u"),
      L("Slopes: on the first, $\\frac{dy}{dx} = \\frac xy$. On the second, $\\frac{dy}{dx} = -\\frac yx$.", "Slopes: on the first family, d y by d x is x over y. On the second, it is minus y over x.", "m_1 = \\dfrac{x}{y},\\qquad m_2 = -\\dfrac{y}{x}"),
      L("Product of slopes: $\\frac xy \\cdot \\left(-\\frac yx\\right) = -1$. So they cross at right angles.", "The product of the slopes is x over y times minus y over x, which is minus 1. So they cross at right angles.", "m_1 m_2 = -1 \\Rightarrow \\text{orthogonal} \\ \\checkmark", "ok"),
    ],
  },
];

const RECAP: Beat = {
  id: "recap",
  chapter: "Remember",
  kind: "recap",
  lines: [
    L("Let's lock it in."),
    L("Analytic means differentiable in a whole neighbourhood, not just at one point."),
    L("Cauchy–Riemann: $u_x = v_y$ and $u_y = -v_x$. Necessary always; sufficient with continuous partials.", "Cauchy Riemann: u x equals v y, and u y equals minus v x. Always necessary, and sufficient when the partials are continuous."),
    L("Derivative: $f'(z) = u_x + iv_x$. Polar: $u_r = \\frac1r v_\\theta$, $v_r = -\\frac1r u_\\theta$.", "The derivative is u x plus i v x. In polar form, u r equals one over r v theta, and v r equals minus one over r u theta."),
    L("Harmonic: $u_{xx} + u_{yy} = 0$. Find the conjugate by integrating CR, or use Milne–Thomson.", "Harmonic means u x x plus u y y equals zero. Find the conjugate by integrating Cauchy Riemann, or use Milne Thomson."),
    L("Level curves of an analytic function are orthogonal. Practise the twenty MCQs again, and you are ready. All the best!"),
  ],
};

export const BEATS: Beat[] = [...TEACH, { ...MCQ_BEATS[0], lines: [L("Now, twenty MCQs. Pause on each one if you need more time."), ...MCQ_BEATS[0].lines] }, ...MCQ_BEATS.slice(1), ...SUBJECTIVE, RECAP];

export const spokenText = (l: Line) => speak(l.say ?? l.text);
export const lineKey = (beat: string, index: number) => `${beat}-${index}`;

// ---------- timing ----------

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
  id: string;
  from: number;
  seconds: number;
  lines: PlannedLine[];
}

const LEAD_S = 0.7;
const GAP_S = 0.5;
const TAIL_S = 1.2;
/** Thinking time after each MCQ question (the line before the answer). */
export const MCQ_THINK_S = 5;

export const estimateSeconds = (say: string) => 0.4 + say.trim().split(/\s+/).length / 2.6;

export function planComplex(voice: Voice = {}): { beats: PlannedBeat[]; seconds: number } {
  let from = 0;
  const beats = BEATS.map((b) => {
    let t = LEAD_S;
    const lines = b.lines.map((line, i) => {
      const key = lineKey(b.id, i);
      const clip = voice[key];
      const seconds = clip ? clip.seconds : estimateSeconds(spokenText(line));
      const planned = { key, at: t, seconds, clip };
      const thinking = b.kind === "mcq" && i === b.lines.length - 2 ? MCQ_THINK_S : 0;
      t += seconds + GAP_S + thinking;
      return planned;
    });
    const seconds = t - GAP_S + TAIL_S;
    const planned = { id: b.id, from, seconds, lines };
    from += seconds;
    return planned;
  });
  return { beats, seconds: from };
}
