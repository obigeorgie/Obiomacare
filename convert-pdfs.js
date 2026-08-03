const { mdToPdf } = require('md-to-pdf');
const path = require('path');

const files = [
  ['products/ngn-framework.md', 'public/products/NGN-Clinical-Judgment-Framework.pdf'],
  ['products/prioritization-trees.md', 'public/products/Prioritization-Decision-Trees.pdf'],
  ['products/case-walkthroughs.md', 'public/products/Real-Case-Walkthroughs.pdf'],
  ['products/sbar-templates.md', 'public/products/SBAR-Templates.pdf'],
  ['products/survival-guide.md', 'public/products/First-Year-Survival-Guide.pdf'],
  ['products/clinical-day-planner.md', 'public/products/Clinical-Day-Planner.pdf'],
];

(async () => {
  for (const [input, output] of files) {
    try {
      await mdToPdf({ path: input }, {
        dest: output,
        pdf_options: {
          format: 'Letter',
          margin: { top: '20mm', right: '20mm', bottom: '20mm', left: '20mm' },
          printBackground: true
        },
        launch_options: {
          args: ['--no-sandbox', '--disable-setuid-sandbox']
        }
      });
      console.log(`✅ ${path.basename(output)}`);
    } catch (err) {
      console.error(`❌ ${path.basename(output)}:`, err.message);
    }
  }
})();
