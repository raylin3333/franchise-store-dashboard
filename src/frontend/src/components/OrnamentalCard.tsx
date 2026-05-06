import type React from "react";

// Cornflower blue for ornaments, light blue-gray for border
const ORNAMENT_COLOR = "#5B8DEF";
const BORDER_COLOR = "#DCE4F5";

function WingOrnament({
  flipX = false,
  flipY = false,
}: { flipX?: boolean; flipY?: boolean }) {
  const transform = `scale(${flipX ? -1 : 1}, ${flipY ? -1 : 1})`;
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden="true"
      role="presentation"
      style={{ transform, display: "block" }}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M2 10 C2 4, 10 2, 10 10"
        stroke={ORNAMENT_COLOR}
        strokeWidth="1.2"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M2 10 C2 6, 8 4, 10 10"
        stroke={ORNAMENT_COLOR}
        strokeWidth="0.7"
        fill="none"
        strokeLinecap="round"
        opacity="0.5"
      />
      <path
        d="M18 10 C18 4, 10 2, 10 10"
        stroke={ORNAMENT_COLOR}
        strokeWidth="1.2"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M18 10 C18 6, 12 4, 10 10"
        stroke={ORNAMENT_COLOR}
        strokeWidth="0.7"
        fill="none"
        strokeLinecap="round"
        opacity="0.5"
      />
      <circle cx="10" cy="10" r="1.5" fill={ORNAMENT_COLOR} />
    </svg>
  );
}

interface OrnamentalCardProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  padding?: string;
  "data-ocid"?: string;
}

export function OrnamentalCard({
  children,
  className = "",
  style,
  padding = "p-6",
  "data-ocid": dataOcid,
}: OrnamentalCardProps) {
  return (
    <div
      className={`relative ${padding} ${className}`}
      data-ocid={dataOcid}
      style={{
        border: `1px solid ${BORDER_COLOR}`,
        borderRadius: "16px",
        background: "#FFFFFF",
        overflow: "visible",
        ...style,
      }}
    >
      {/* Corner ornaments - purely decorative */}
      <span
        className="absolute pointer-events-none"
        style={{ top: -9, left: -9 }}
        aria-hidden="true"
      >
        <WingOrnament />
      </span>
      <span
        className="absolute pointer-events-none"
        style={{ top: -9, right: -9 }}
        aria-hidden="true"
      >
        <WingOrnament flipX />
      </span>
      <span
        className="absolute pointer-events-none"
        style={{ bottom: -9, left: -9 }}
        aria-hidden="true"
      >
        <WingOrnament flipY />
      </span>
      <span
        className="absolute pointer-events-none"
        style={{ bottom: -9, right: -9 }}
        aria-hidden="true"
      >
        <WingOrnament flipX flipY />
      </span>
      {children}
    </div>
  );
}
