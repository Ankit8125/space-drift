import {mkdir,readFile,writeFile,copyFile,cp} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
// Produce a single deployable page; Three.js remains a pinned CDN import.
// Follow relative imports in dependency order, including the scenery library.
const visited=new Set(),visiting=new Set(),modules=[],externalImports=new Set();
async function collect(file){
  file=resolve(file);
  if(visiting.has(file))throw new Error(`Circular module import: ${file}`);
  if(visited.has(file))return;
  visiting.add(file);
  const source=await readFile(file,'utf8');
  const importPattern=/^import\s+[^;\n]+?\s+from\s+['"]([^'"]+)['"];?\r?\n/gm;
  for(const match of source.matchAll(importPattern)){
    if(match[1].startsWith('.'))await collect(resolve(dirname(file),match[1]));
    else externalImports.add(match[0].trim());
  }
  modules.push(source.replace(importPattern,'').replace(/^export /gm,''));
  visiting.delete(file);visited.add(file);
}
await collect('src/main.js');
const code=[...externalImports,...modules].join('\n');
const css=await readFile('src/style.css','utf8');
const baseUrl='https://ankit8125.github.io/space-drift';
const siteUrl=(process.env.SITE_URL||baseUrl).replace(/\/$/,'');
const parsedUrl=new URL(siteUrl);
if(parsedUrl.protocol!=='https:')throw new Error('Production SITE_URL must use HTTPS');
const html=(await readFile('index.html','utf8'))
  .replaceAll(baseUrl,siteUrl)
  .replace('<link rel="stylesheet" href="./src/style.css" />',()=>`<style>${css}</style>`)
  .replace(/<script type="module">[\s\S]*?<\/script>/,()=>`<script type="module">\n${code}\n</script>`);
await mkdir('dist/about',{recursive:true});
await writeFile('dist/index.html',html);
await cp('assets','dist/assets',{recursive:true});
await writeFile('dist/about/index.html',(await readFile('about/index.html','utf8')).replaceAll(baseUrl,siteUrl));
await writeFile('dist/404.html',(await readFile('404.html','utf8')).replace('href="/"',`href="${parsedUrl.pathname.replace(/\/$/,'')}/"`).replace('href="/assets/',`href="${parsedUrl.pathname.replace(/\/$/,'')}/assets/`));
await writeFile('dist/robots.txt',`User-agent: *\nAllow: /\n\nSitemap: ${siteUrl}/sitemap.xml\n`);
await writeFile('dist/sitemap.xml',`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${siteUrl}/</loc></url><url><loc>${siteUrl}/about/</loc></url></urlset>\n`);
await copyFile('.nojekyll','dist/.nojekyll');
console.log(`Built Space Drift, guide, sharing assets, robots.txt, and sitemap for ${siteUrl}.`);
