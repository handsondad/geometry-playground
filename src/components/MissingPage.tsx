import type { ReactNode } from "react";
import { href } from "../lib/route";

export function MissingPage({ children = "这一页找不到了，可能换了地方。" }: { children?: ReactNode }) {
  return (
    <div className="page missing">
      <p>{children}</p>
      <a className="primary-btn" href={href.home}>回到首页</a>
    </div>
  );
}