import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    <div style={{ alignItems: "center", background: "#F5F1E8", border: "9px solid #000000", color: "#000000", display: "flex", fontSize: 98, fontWeight: 800, height: "100%", justifyContent: "center", position: "relative", width: "100%" }}>
      F
      <div style={{ background: "#E4572E", bottom: 16, height: 12, left: 16, position: "absolute", right: 16 }} />
    </div>,
    size,
  );
}
