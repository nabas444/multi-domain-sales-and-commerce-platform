const fs = require('fs');
const path = require('path');

const xmlPath = path.join(__dirname, '..', 'doc_unzipped', 'word', 'document.xml');
const outPath = path.join(__dirname, '..', 'MASTER_DOCUMENTATION.md');

const xml = fs.readFileSync(xmlPath, 'utf8');

let md = '';
const regex = /<w:p(?: [^>]*)?>([\s\S]*?)<\/w:p>|<w:tbl(?: [^>]*)?>([\s\S]*?)<\/w:tbl>/g;

let match;
while ((match = regex.exec(xml)) !== null) {
  if (match[1] !== undefined) {
    const pContent = match[1];
    const styleMatch = pContent.match(/<w:pStyle w:val="([^"]+)"\/>/);
    const style = styleMatch ? styleMatch[1] : '';

    let text = '';
    const tRegex = /<w:t(?: [^>]*)?>([\s\S]*?)<\/w:t>/g;
    let tMatch;
    while ((tMatch = tRegex.exec(pContent)) !== null) {
      text += tMatch[1];
    }
    
    text = text.replace(/&amp;/g, '&')
               .replace(/&lt;/g, '<')
               .replace(/&gt;/g, '>')
               .replace(/&quot;/g, '"')
               .replace(/&apos;/g, "'")
               .trim();

    if (!text) continue;

    if (style === 'Heading1' || style === 'Title') {
      md += `\n# ${text}\n\n`;
    } else if (style === 'Heading2') {
      md += `\n## ${text}\n\n`;
    } else if (style === 'Heading3') {
      md += `\n### ${text}\n\n`;
    } else if (style === 'Heading4') {
      md += `\n#### ${text}\n\n`;
    } else if (style.includes('List') || pContent.includes('<w:numPr>')) {
      md += `* ${text}\n`;
    } else {
      md += `${text}\n\n`;
    }
  } else if (match[2] !== undefined) {
    const tblContent = match[2];
    const trRegex = /<w:tr(?: [^>]*)?>([\s\S]*?)<\/w:tr>/g;
    let trMatch;
    let isHeader = true;
    while ((trMatch = trRegex.exec(tblContent)) !== null) {
      const rowContent = trMatch[1];
      const tcRegex = /<w:tc(?: [^>]*)?>([\s\S]*?)<\/w:tc>/g;
      let tcMatch;
      let cells = [];
      while ((tcMatch = tcRegex.exec(rowContent)) !== null) {
        const cellContent = tcMatch[1];
        let cellText = '';
        const tRegex = /<w:t(?: [^>]*)?>([\s\S]*?)<\/w:t>/g;
        let tMatch;
        while ((tMatch = tRegex.exec(cellContent)) !== null) {
          cellText += tMatch[1];
        }
        cellText = cellText.replace(/&amp;/g, '&')
                           .replace(/&lt;/g, '<')
                           .replace(/&gt;/g, '>')
                           .replace(/&quot;/g, '"')
                           .replace(/&apos;/g, "'")
                           .trim();
        cells.push(cellText);
      }
      md += `| ${cells.join(' | ')} |\n`;
      if (isHeader) {
        md += `| ${cells.map(() => '---').join(' | ')} |\n`;
        isHeader = false;
      }
    }
    md += '\n';
  }
}

fs.writeFileSync(outPath, md, 'utf8');
console.log(`Wrote ${md.length} characters to ${outPath}`);
