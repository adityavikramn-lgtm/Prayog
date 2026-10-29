import React from "react";
import { Tex } from "./Tex";

/** Plain text with inline maths between $…$, e.g. "At the top, $v_y = 0$." */
export const RichText: React.FC<{ text: string }> = ({ text }) => (
  <>
    {text.split(/(\$[^$]+\$)/).map((part, i) =>
      part.startsWith("$") && part.endsWith("$") && part.length > 1 ? (
        <Tex key={i} tex={part.slice(1, -1)} />
      ) : (
        <React.Fragment key={i}>{part}</React.Fragment>
      ),
    )}
  </>
);
