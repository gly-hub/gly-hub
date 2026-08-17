import { mkdir, readFile, writeFile } from "node:fs/promises";

async function styleSnake(input, output, background) {
  const raw = await readFile(input, "utf8");
  const match = raw.match(
    /viewBox=["']([-\d.]+)[ ,]+([-\d.]+)[ ,]+([-\d.]+)[ ,]+([-\d.]+)["']/
  );

  if (!match) throw new Error(`Missing viewBox in ${input}`);

  const [, x, y, width, height] = match;
  const card = `
  <rect x="${x}" y="${y}" width="${width}" height="${height}" rx="14" fill="${background}" />
`;

  const styled = raw.replace(/<svg\b[^>]*>/, (tag) => `${tag}${card}`);

  await mkdir("generated/profile-cards", { recursive: true });
  await writeFile(output, styled);
}

await styleSnake(
    "tmp/snake-light.svg",
    "generated/profile-cards/github-contribution-grid-snake.svg",
    "#ffffff"
  );
  
  await styleSnake(
    "tmp/snake-dark.svg",
    "generated/profile-cards/github-contribution-grid-snake-dark.svg",
    "#0d1117"
  );