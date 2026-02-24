import { fontFaceCss } from "../typography";

export function getPageCss() {
  return `
${fontFaceCss()}
* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; background: #d8dadd; color: #111827; }
body { font-family: MemoriosoSans, Arial, sans-serif; }
.document-root { padding: 24px; }
.pdf-page {
  position: relative;
  margin: 0 auto 20px auto;
  overflow: hidden;
  background: #fff;
  box-shadow: 0 8px 24px rgba(0,0,0,0.12);
  page-break-after: always;
  break-after: page;
}
.pdf-page:last-child { page-break-after: auto; break-after: auto; }
.pdf-frame {
  position: absolute;
  overflow: hidden;
}
.pdf-frame--text { background: transparent; }
.pdf-frame--image {
  background: #efe6d0;
  display: flex;
  align-items: center;
  justify-content: center;
}
.pdf-frame__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.pdf-frame__placeholder {
  display: grid;
  place-items: center;
  width: 100%;
  height: 100%;
  color: #5b513c;
  font-size: 12px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.pdf-safe-area {
  position: absolute;
  border: 1px dashed rgba(217, 119, 6, 0.22);
  pointer-events: none;
}
.pdf-footer {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 12px;
  display: flex;
  justify-content: space-between;
  font-family: MemoriosoSans, Arial, sans-serif;
  font-size: 10px;
  color: rgba(17, 24, 39, 0.7);
  padding: 0 20px;
}
`;
}

