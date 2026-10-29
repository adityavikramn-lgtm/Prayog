/**
 * Turns a number into words the way a teacher reads it aloud:
 * 30 → "thirty", 15.7 → "fifteen point seven", 0.4 → "zero point four", 135 → "one hundred thirty-five".
 * Rounds to one decimal place, which is how the videos display values.
 */
export function spokenNumber(n: number): string {
  const ones = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"];
  const tens = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];
  const under100 = (k: number): string => (k < 20 ? ones[k] : tens[Math.floor(k / 10)] + (k % 10 ? "-" + ones[k % 10] : ""));
  const whole = (k: number): string =>
    k < 100 ? under100(k) : k < 1000 ? `${ones[Math.floor(k / 100)]} hundred${k % 100 ? " " + under100(k % 100) : ""}` : String(k);
  const sign = n < 0 ? "minus " : "";
  const rounded = Math.round(Math.abs(n) * 10) / 10;
  const int = Math.floor(rounded);
  const dec = Math.round((rounded - int) * 10);
  return sign + (dec === 0 ? whole(int) : `${whole(int)} point ${ones[dec]}`);
}

/**
 * Reads a number exactly as it is shown on screen, digit by digit after the point:
 * "2.45" → "two point four five", "60.0" → "sixty", "0.400" → "zero point four", "135" → "one hundred thirty-five".
 */
export function spokenDisplay(shown: string): string {
  const [int, frac = ""] = shown.replace(/^-/, "").split(".");
  const digits = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"];
  const kept = frac.replace(/0+$/, "");
  const head = (shown.startsWith("-") ? "minus " : "") + spokenNumber(Number(int));
  return kept ? `${head} point ${[...kept].map((d) => digits[Number(d)]).join(" ")}` : head;
}
