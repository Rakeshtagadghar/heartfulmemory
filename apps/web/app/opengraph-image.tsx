import { ImageResponse } from "next/og";
import { brand, heroCopy } from "../content/landingContent";

export const size = {
  width: 1200,
  height: 630
};

export const contentType = "image/png";

function Mark({ size = 132 }: { size?: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: 28,
        border: "1px solid rgba(213,179,106,0.35)",
        background:
          "radial-gradient(circle at 32% 20%, rgba(213,179,106,0.28), transparent 55%), linear-gradient(135deg, rgba(29,43,69,0.9), rgba(10,19,33,1))",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08)"
      }}
    >
      <svg
        width={size * 0.72}
        height={size * 0.72}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M32 8c8 6 16 6 20 6v18c0 13-9 20-20 24C21 52 12 45 12 32V14c4 0 12 0 20-6Z"
          stroke="rgba(244,236,220,0.42)"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M22 42V22l10 12 10-12v20"
          stroke="#f4ecdc"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M22 42h20" stroke="rgba(244,236,220,0.75)" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M16 18c-2 3-3 7-3 11" stroke="rgba(213,179,106,0.45)" strokeWidth="1.4" strokeLinecap="round" />
        <path d="M48 18c2 3 3 7 3 11" stroke="rgba(213,179,106,0.45)" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    </div>
  );
}

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          color: "#f4ecdc",
          background:
            "radial-gradient(circle at 12% 10%, rgba(213,179,106,0.14), transparent 40%), radial-gradient(circle at 88% 14%, rgba(17,59,52,0.24), transparent 44%), radial-gradient(circle at 58% 100%, rgba(198,109,99,0.12), transparent 48%), linear-gradient(180deg, #0a1321 0%, #0b1423 45%, #09111d 100%)"
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 24,
            borderRadius: 28,
            border: "1px solid rgba(255,255,255,0.12)",
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.015))",
            overflow: "hidden"
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 24,
            borderRadius: 28,
            opacity: 0.08,
            backgroundImage:
              "linear-gradient(to right, rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.8) 1px, transparent 1px)",
            backgroundSize: "24px 24px"
          }}
        />

        <div
          style={{
            position: "relative",
            display: "flex",
            width: "100%",
            height: "100%",
            padding: "58px 64px",
            justifyContent: "space-between",
            alignItems: "center"
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", maxWidth: 700 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                marginBottom: 24
              }}
            >
              <Mark />
              <div style={{ display: "flex", flexDirection: "column" }}>
                <div style={{ fontSize: 44, fontWeight: 700 }}>{brand.name}</div>
                <div
                  style={{
                    fontSize: 16,
                    letterSpacing: "0.34em",
                    textTransform: "uppercase",
                    color: "rgba(244,236,220,0.62)"
                  }}
                >
                  Heirloom Storybooks
                </div>
              </div>
            </div>
            <div style={{ fontSize: 64, lineHeight: 1.02, fontWeight: 700 }}>
              {heroCopy.headline}
            </div>
            <div
              style={{
                marginTop: 22,
                fontSize: 28,
                lineHeight: 1.35,
                color: "rgba(255,255,255,0.82)",
                maxWidth: 680
              }}
            >
              {heroCopy.subheadline}
            </div>
          </div>

          <div
            style={{
              width: 300,
              height: 370,
              borderRadius: 28,
              border: "1px solid rgba(213,179,106,0.24)",
              background:
                "radial-gradient(circle at 20% 14%, rgba(213,179,106,0.12), transparent 48%), linear-gradient(180deg, rgba(15,30,53,0.88), rgba(8,16,28,0.94))",
              boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
              padding: 22,
              display: "flex",
              flexDirection: "column"
            }}
          >
            <div
              style={{
                fontSize: 14,
                letterSpacing: "0.25em",
                textTransform: "uppercase",
                color: "rgba(213,179,106,0.92)"
              }}
            >
              Memorioso
            </div>
            <div style={{ fontSize: 34, lineHeight: 1.05, marginTop: 14, fontWeight: 700 }}>
              Your family history, beautifully told.
            </div>
            <div style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                "Record or type stories",
                "AI-guided prompts",
                "Export premium PDF"
              ].map((line) => (
                <div
                  key={line}
                  style={{
                    borderRadius: 14,
                    border: "1px solid rgba(255,255,255,0.1)",
                    background: "rgba(255,255,255,0.03)",
                    padding: "12px 14px",
                    fontSize: 18,
                    color: "rgba(255,255,255,0.86)"
                  }}
                >
                  {line}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    ),
    size
  );
}

