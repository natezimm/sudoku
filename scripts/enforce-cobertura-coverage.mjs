import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const [rootDir = 'TestResults'] = process.argv.slice(2);
const thresholds = {
  lineRate: 0.9,
  branchRate: 0.8
};

function findCoverageFiles(directory) {
  if (!existsSync(directory)) {
    return [];
  }

  return readdirSync(directory).flatMap(entry => {
    const path = join(directory, entry);
    if (statSync(path).isDirectory()) {
      return findCoverageFiles(path);
    }

    return entry === 'coverage.cobertura.xml' ? [path] : [];
  });
}

function readRate(xml, attribute) {
  const match = xml.match(new RegExp(`${attribute}="([^"]+)"`));
  if (!match) {
    throw new Error(`Missing ${attribute} in coverage report.`);
  }

  return Number.parseFloat(match[1]);
}

const coverageFiles = findCoverageFiles(rootDir);
if (coverageFiles.length === 0) {
  throw new Error(`No coverage.cobertura.xml files found under ${rootDir}.`);
}

const combined = coverageFiles.map(path => {
  const xml = readFileSync(path, 'utf8');
  return {
    path,
    lineRate: readRate(xml, 'line-rate'),
    branchRate: readRate(xml, 'branch-rate')
  };
});

let failed = false;
for (const report of combined) {
  const linePercent = report.lineRate * 100;
  const branchPercent = report.branchRate * 100;

  console.log(
    `${report.path}: lines ${linePercent.toFixed(2)}%, branches ${branchPercent.toFixed(2)}%`
  );

  if (report.lineRate < thresholds.lineRate) {
    console.error(`Line coverage below ${(thresholds.lineRate * 100).toFixed(0)}%.`);
    failed = true;
  }

  if (report.branchRate < thresholds.branchRate) {
    console.error(`Branch coverage below ${(thresholds.branchRate * 100).toFixed(0)}%.`);
    failed = true;
  }
}

if (failed) {
  process.exit(1);
}
