const escapeHtml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

/** Allow only <strong> and <br> after escaping. */
export const sanitizeAgentHtml = (raw: string) => {
  const escaped = escapeHtml(raw);
  return escaped
    .replaceAll("&lt;strong&gt;", "<strong>")
    .replaceAll("&lt;/strong&gt;", "</strong>")
    .replaceAll("&lt;br/&gt;", "<br/>")
    .replaceAll("&lt;br&gt;", "<br/>");
};
