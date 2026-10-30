const fs = require('fs');
const path = require('path');
const postcss = require('postcss');
const tailwindcss = require('tailwindcss');
const autoprefixer = require('autoprefixer');

async function testPostcss() {
  const css = fs.readFileSync(path.join(__dirname, '../apps/web/src/styles/theme.css'), 'utf8');
  const config = require('../apps/web/tailwind.config.js');
  console.log('Tailwind config content:', config.content);

  const result = await postcss([
    tailwindcss(config),
    autoprefixer
  ]).process(css, {
    from: path.join(__dirname, '../apps/web/src/styles/theme.css'),
  });

  console.log('Processed CSS length:', result.css.length);
  console.log('has bg-surface:', result.css.includes('bg-surface'));
  console.log('has text-white:', result.css.includes('text-white'));
  console.log('has aspect-[7/9]:', result.css.includes('aspect-'));
}

testPostcss().catch(console.error);
