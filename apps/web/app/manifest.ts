import type { MetadataRoute } from "next";
import { brand } from "../content/landingContent";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: brand.name,
    short_name: brand.name,
    description:
      "Record or write family stories and export a premium PDF keepsake storybook.",
    start_url: "/",
    display: "standalone",
    background_color: "#0a1321",
    theme_color: "#0a1321",
    icons: [
      {
        src: "/icon.svg",
        type: "image/svg+xml"
      },
      {
        src: "/apple-icon.svg",
        sizes: "180x180",
        type: "image/svg+xml"
      }
    ]
  };
}
