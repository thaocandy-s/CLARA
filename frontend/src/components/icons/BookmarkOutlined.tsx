import type { CSSProperties } from "react";

interface BookmarkOutlinedProps {
  style?: CSSProperties;
  className?: string;
}

const BookmarkOutlined = ({ style, className }: BookmarkOutlinedProps) => (
  <svg
    viewBox="0 0 24 24"
    width="1em"
    height="1em"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    style={style}
    className={className}
  >
    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
  </svg>
);

export default BookmarkOutlined;
