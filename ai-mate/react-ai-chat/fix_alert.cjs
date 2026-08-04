const fs = require('fs');

let wb = fs.readFileSync('src/components/maker/WorkBoard.tsx', 'utf8');
// Replace all Alert message= with title=
wb = wb.replace(/(<Alert\n\s+)message=/g, '$1title=');
// Also handle single-line <Alert message="...">
wb = wb.replace(/(<Alert\s+)message=/g, '$1title=');
fs.writeFileSync('src/components/maker/WorkBoard.tsx', wb, 'utf8');
console.log('WorkBoard OK');

let ep = fs.readFileSync('src/components/sage/EntrepreneurshipPlanning.tsx', 'utf8');
ep = ep.replace(/(<Alert\n\s+)message=/g, '$1title=');
ep = ep.replace(/(<Alert\s+)message=/g, '$1title=');
fs.writeFileSync('src/components/sage/EntrepreneurshipPlanning.tsx', ep, 'utf8');
console.log('Entrepreneurship OK');

console.log('DONE');
