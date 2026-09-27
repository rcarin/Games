export function renderWpmSparkline(history, width = 380, height = 140) {
  const points = history.slice(-10).map((h) => h.wpm);

  if (points.length < 2) {
    return `
      <div class="graph-empty">
        <div class="graph-empty-icon">&#128200;</div>
        <div>Play a few more rounds to see your trend line here!</div>
      </div>
    `;
  }

  const padding = 26;
  const max = Math.max(...points, 10);
  const min = Math.min(...points, 0);
  const range = Math.max(max - min, 1);
  const stepX = (width - padding * 2) / (points.length - 1);

  const yFor = (v) => height - padding - ((v - min) / range) * (height - padding * 2);

  const coords = points.map((v, i) => ({ x: padding + i * stepX, y: yFor(v), v }));

  const linePath = coords.map((c, i) => `${i === 0 ? "M" : "L"}${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(" ");
  const areaPath = `${linePath} L${coords[coords.length - 1].x.toFixed(1)},${height - padding} L${coords[0].x.toFixed(1)},${height - padding} Z`;

  const baselineY = height - padding;

  const dots = coords
    .map((c, i) => {
      const isLast = i === coords.length - 1;
      return `<circle cx="${c.x.toFixed(1)}" cy="${c.y.toFixed(1)}" r="${isLast ? 6 : 4}" fill="${isLast ? "#4a3222" : "#a9784f"}" stroke="#f2e6c9" stroke-width="1.5" />`;
    })
    .join("");

  const showAllLabels = points.length <= 6;
  const labels = coords
    .map((c, i) => {
      const isLast = i === coords.length - 1;
      const isFirst = i === 0;
      if (!showAllLabels && !isLast && !isFirst) return "";
      return `<text x="${c.x.toFixed(1)}" y="${(c.y - 12).toFixed(1)}" font-size="13" font-weight="${isLast ? "700" : "400"}" text-anchor="middle" fill="#4a3222" font-family="Special Elite, monospace">${c.v}</text>`;
    })
    .join("");

  return `
    <svg viewBox="0 0 ${width} ${height}" width="100%" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <line x1="${padding}" y1="${baselineY}" x2="${width - padding}" y2="${baselineY}" stroke="#c9a25a" stroke-width="1" stroke-dasharray="3,3" opacity="0.5" />
      <path d="${areaPath}" fill="rgba(111, 78, 55, 0.15)" stroke="none" />
      <path d="${linePath}" fill="none" stroke="#6f4e37" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
      ${dots}
      ${labels}
    </svg>
    <div class="graph-caption">Last ${points.length} run${points.length === 1 ? "" : "s"} &middot; WPM over time</div>
  `;
}
