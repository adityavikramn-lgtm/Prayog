import katex from "katex";
import React, { useMemo } from "react";

/** Renders a KaTeX string. Pure: the same TeX always gives the same markup. */
export const Tex: React.FC<{
  tex: string;
  display?: boolean;
  className?: string;
  style?: React.CSSProperties;
}> = ({ tex, display = false, className, style }) => {
  const html = useMemo(
    () => katex.renderToString(tex, { displayMode: display, throwOnError: false }),
    [tex, display],
  );
  return <span className={className} style={style} dangerouslySetInnerHTML={{ __html: html }} />;
};
