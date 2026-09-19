import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const manifest = readJson("custom-elements.json");
const packageJson = readJson("package.json");

for (const tagName of ["git-diff", "git-log", "git-show"]) {
  const { declaration, module } = findDeclaration(tagName);
  const markdown = renderApi(tagName, declaration, module);
  const outputPath = resolve(projectRoot, `docs/components/_generated/${tagName}-api.md`);
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, markdown);
}

function readJson(path) {
  return JSON.parse(readFileSync(resolve(projectRoot, path), "utf8"));
}

function findDeclaration(tagName) {
  for (const module of manifest.modules) {
    const declaration = module.declarations?.find((item) => item.tagName === tagName);
    if (declaration) {
      return { declaration, module };
    }
  }

  throw new Error(`No custom element declaration found for ${tagName}.`);
}

function renderApi(tagName, declaration, module) {
  const publicMembers = (declaration.members ?? []).filter(
    (member) => !member.privacy && member.description,
  );
  const properties = publicMembers.filter((member) => member.kind === "field");
  const methods = publicMembers.filter((member) => member.kind === "method");
  const lines = ["<!-- Generated from custom-elements.json. Do not edit directly. -->", ""];

  appendTable(
    lines,
    "Attributes",
    ["Name", "Type", "Description"],
    declaration.attributes,
    (item) => [code(item.name), code(typeText(item)), item.description],
  );

  appendTable(lines, "Properties", ["Name", "Type", "Description"], properties, (item) => [
    code(item.name),
    code(typeText(item)),
    `${item.description}${item.readonly ? " Read-only." : ""}`,
  ]);

  appendTable(lines, "Methods", ["Name", "Returns", "Description"], methods, (item) => [
    code(`${item.name}(${renderParameters(item.parameters)})`),
    code(typeText(item.return)),
    item.description,
  ]);

  appendTable(lines, "Slots", ["Name", "Description"], declaration.slots, (item) => [
    code(item.name || "default"),
    item.description,
  ]);

  appendTable(lines, "Events", ["Name", "Type", "Description"], declaration.events, (item) => [
    code(item.name),
    code(typeText(item)),
    item.description,
  ]);

  appendTable(
    lines,
    "CSS custom properties",
    ["Name", "Default", "Description"],
    declaration.cssProperties,
    (item) => [code(item.name), code(item.default ?? "—"), item.description],
  );

  appendTable(lines, "CSS parts", ["Name", "Description"], declaration.cssParts, (item) => [
    code(item.name),
    item.description,
  ]);

  appendTable(
    lines,
    "Exports and registration",
    ["Name", "Kind", "Module"],
    exportsFor(tagName, declaration, module),
    (item) => [code(item.name), item.kind, code(item.module)],
  );

  return `${lines.join("\n").trimEnd()}\n`;
}

function appendTable(lines, heading, columns, items, rowFor) {
  if (!items?.length) {
    return;
  }

  const rows = [columns, ...items.map((item) => rowFor(item).map(cell))];
  const widths = columns.map((_, index) =>
    Math.max(3, ...rows.map((row) => row[index]?.length ?? 0)),
  );
  const renderRow = (row) =>
    `| ${row.map((value, index) => value.padEnd(widths[index])).join(" | ")} |`;

  lines.push(`### ${heading}`, "", renderRow(rows[0]));
  lines.push(renderRow(widths.map((width) => "-".repeat(width))));
  for (const row of rows.slice(1)) {
    lines.push(renderRow(row));
  }
  lines.push("");
}

function exportsFor(tagName, declaration, declarationModule) {
  const registration = manifest.modules
    .flatMap((module) =>
      (module.exports ?? []).map((entry) => ({ ...entry, modulePath: module.path })),
    )
    .find((entry) => entry.kind === "custom-element-definition" && entry.name === tagName);
  const classExport = (declarationModule.exports ?? []).find(
    (entry) => entry.kind === "js" && entry.name === declaration.name,
  );
  const exports = [];

  if (registration) {
    exports.push({
      name: `<${tagName}>`,
      kind: "Custom element registration",
      module: packageModule(registration.modulePath),
    });
  }
  if (classExport) {
    exports.push({
      name: classExport.name,
      kind: "Class",
      module: packageModule(declarationModule.path),
    });
  }

  return exports;
}

function packageModule(modulePath) {
  for (const [subpath, target] of Object.entries(packageJson.exports)) {
    const importPath = typeof target === "string" ? target : target.import;
    if (importPath?.replace(/^\.\//, "") === modulePath) {
      return subpath === "." ? packageJson.name : `${packageJson.name}/${subpath.slice(2)}`;
    }
  }

  return modulePath;
}

function renderParameters(parameters = []) {
  return parameters
    .map((parameter) => `${parameter.name}${parameter.optional ? "?" : ""}: ${typeText(parameter)}`)
    .join(", ");
}

function typeText(value) {
  return value?.type?.text ?? "—";
}

function code(value) {
  return `\`${String(value).replaceAll("`", "\\`")}\``;
}

function cell(value) {
  return String(value ?? "—")
    .replaceAll("|", "\\|")
    .replaceAll("\n", " ");
}
