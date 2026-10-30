async function check() {
  const pageRes = await fetch('http://localhost:3000/cards');
  const pageHtml = await pageRes.text();
  const cssMatch = pageHtml.match(/href="(\/_next\/static\/css\/[^"]+\.css[^"]*)"/);
  if (!cssMatch) {
    console.log('No CSS match found in HTML');
    return;
  }
  const cssUrl = 'http://localhost:3000' + cssMatch[1];
  console.log('Found CSS URL:', cssUrl);
  const cssRes = await fetch(cssUrl);
  const css = await cssRes.text();
  console.log('CSS Total Length:', css.length);
  console.log('has bg-surface:', css.includes('bg-surface'));
  console.log('has text-white:', css.includes('text-white'));
  console.log('has aspect-[7/9]:', css.includes('aspect-') || css.includes('7/9'));
  console.log('has font-syne:', css.includes('font-syne') || css.includes('Syne'));
}
check().catch(console.error);
