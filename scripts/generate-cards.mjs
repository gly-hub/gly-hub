import { mkdir, writeFile } from "node:fs/promises";

const username = process.env.GITHUB_USERNAME || "gly-hub";
const token = process.env.GITHUB_TOKEN;
const output = "generated/profile-cards";
const theme = {
    bg: "#ffffff",
    text: "#24292f",
    muted: "#57606a",
    blue: "#0969da",
    green: "#1a7f37",
    yellow: "#9a6700",
};

const escapeXml = (value) =>
  String(value).replace(/[<>&"']/g, (char) =>
    ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;" }[char])
  );

const text = (x, y, value, size, color, weight = 500, anchor = "start") =>
  `<text x="${x}" y="${y}" fill="${color}" font-family="Arial, sans-serif" font-size="${size}" font-weight="${weight}" text-anchor="${anchor}">${escapeXml(value)}</text>`;

async function github(path) {
  const response = await fetch(`https://api.github.com${path}`, {
    headers: {
      Accept: "application/vnd.github+json",
      "User-Agent": "gly-hub-profile-cards",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!response.ok) {
    throw new Error(`GitHub API ${response.status}: ${await response.text()}`);
  }

  return response.json();
}

function svg(body, label) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="220" viewBox="0 0 600 220" role="img" aria-label="${escapeXml(label)}">
  <rect width="600" height="220" fill="${theme.bg}"/>
  <rect x="1" y="1" width="598" height="218" fill="none" stroke="${theme.blue}" stroke-opacity=".23"/>
  ${body}
</svg>`;
}

function stat(x, value, label) {
  return `${text(x, 164, Number(value).toLocaleString(), 22, theme.text, 700)}
${text(x, 184, label, 9, theme.muted, 700)}`;
}

async function main() {
  const [user, repos, events] = await Promise.all([
    github(`/users/${username}`),
    github(`/users/${username}/repos?per_page=100&sort=updated`),
    github(`/users/${username}/events/public?per_page=30`).catch(() => []),
  ]);

  const stars = repos.reduce((sum, repo) => sum + repo.stargazers_count, 0);
  const languages = Object.entries(
    repos.reduce((counts, repo) => {
      if (repo.language) counts[repo.language] = (counts[repo.language] || 0) + 1;
      return counts;
    }, {})
  ).sort((a, b) => b[1] - a[1]).slice(0, 4);

  const overview = svg(
    `${text(28, 42, "GITHUB PROFILE", 11, theme.blue, 700)}
${text(28, 75, `@${user.login}`, 23, theme.text, 700)}
${text(28, 101, user.name || user.login, 12, theme.muted)}
<line x1="28" y1="125" x2="572" y2="125" stroke="${theme.muted}" opacity=".24"/>
${stat(28, user.public_repos, "REPOSITORIES")}
${stat(175, user.followers, "FOLLOWERS")}
${stat(315, user.following, "FOLLOWING")}
${stat(453, stars, "STARS")}`,
    `${user.login} GitHub profile overview`
  );

  const totalLanguages = Math.max(1, languages.reduce((sum, [, count]) => sum + count, 0));
  const colors = [theme.blue, theme.green, theme.yellow, theme.muted];
  const languageRows = languages.map(([name, count], index) => {
    const y = 112 + index * 25;
    const percent = Math.round((count / totalLanguages) * 100);
    return `<circle cx="31" cy="${y - 4}" r="5" fill="${colors[index]}"/>
${text(44, y, name, 12, theme.text, 600)}
${text(562, y, `${percent}%`, 11, theme.muted, 700, "end")}
<rect x="160" y="${y - 10}" width="288" height="5" fill="${theme.text}" opacity=".12"/>
<rect x="160" y="${y - 10}" width="${2.88 * percent}" height="5" fill="${colors[index]}"/>`;
  }).join("");

  const languageCard = svg(
    `${text(28, 41, "TOP LANGUAGES", 11, theme.blue, 700)}
${text(28, 76, "Public repository languages", 20, theme.text, 700)}
${languageRows}`,
    `${user.login} top languages`
  );

  const activityRows = events.slice(0, 3).map((event, index) => {
    const y = 110 + index * 28;
    const label = `${event.type.replace("Event", "")} in ${event.repo?.name || "a repository"}`;
    return `<circle cx="34" cy="${y}" r="4" fill="${index === 0 ? theme.blue : theme.green}"/>
${text(48, y + 4, label, 12, theme.text)}`;
  }).join("");

  const activityCard = svg(
    `${text(28, 41, "PUBLIC ACTIVITY", 11, theme.blue, 700)}
${text(28, 74, `@${user.login}'s latest work`, 20, theme.text, 700)}
${activityRows || text(48, 114, "No recent public activity", 12, theme.muted)}`,
    `${user.login} recent public activity`
  );

  await mkdir(output, { recursive: true });
  await Promise.all([
    writeFile(`${output}/profile-details.svg`, overview),
    writeFile(`${output}/languages.svg`, languageCard),
    writeFile(`${output}/activity.svg`, activityCard),
  ]);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});