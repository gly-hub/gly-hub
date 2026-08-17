import { mkdir, readFile, writeFile } from "node:fs/promises";

async function styleSnake(input, output, background, border) {
  const raw = await readFile(input, "utf8");
  const match = raw.match(
    /viewBox=["']([-\d.]+)[ ,]+([-\d.]+)[ ,]+([-\d.]+)[ ,]+([-\d.]+)["']/
  );

  if (!match) throw new Error(`Missing viewBox in ${input}`);

  const [, x, y, width, height] = match;
  const card = `
  <rect x="${x}" y="${y}" width="${width}" height="${height}" rx="14" fill="${background}" />
  <rect x="${Number(x) + 0.5}" y="${Number(y) + 0.5}" width="${Number(width) - 1}" height="${Number(height) - 1}" rx="13.5" fill="none" stroke="${border}" />
`;

  const styled = raw.replace(/<svg\b[^>]*>/, (tag) => `${tag}${card}`);

  await mkdir("generated/profile-cards", { recursive: true });
  await writeFile(output, styled);
}

await styleSnake(
  "tmp/snake-light.svg",
  "generated/profile-cards/github-contribution-grid-snake.svg",
  "#ffffff",
  "#d0d7de"
);

await styleSnake(
  "tmp/snake-dark.svg",
  "generated/profile-cards/github-contribution-grid-snake-dark.svg",
  "#0d1117",
  "#30363d"
);