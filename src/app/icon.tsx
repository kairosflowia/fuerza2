import { ImageResponse } from "next/og";

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    <div style={{ alignItems: "center", background: "#F5F1E8", border: "24px solid #000000", color: "#000000", display: "flex", fontSize: 270, fontWeight: 800, height: "100%", justifyContent: "center", letterSpacing: "-0.08em", position: "relative", width: "100%" }}>
      F
      <div style={{ background: "#E4572E", bottom: 44, height: 34, left: 44, position: "absolute", right: 44 }} />
    </div>,
    size,
  );
}
