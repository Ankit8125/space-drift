import assert from 'node:assert/strict';
import {readFile,stat} from 'node:fs/promises';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';

const home=await readFile('dist/index.html','utf8');
const canonical=home.match(/rel="canonical" href="([^"]+)"/)[1];
const origin=new URL(canonical).origin;
for(const [path,url] of [['index.html',`${origin}/`],['about/index.html',`${origin}/about/`]]){
  const html=await readFile(join('dist',path),'utf8');
  assert.match(html,/<html lang="en">/);
  assert.match(html,/<title>[^<]*Space Drift/);
  assert.match(html,/<meta name="description" content=".{60,}"/);
  assert.ok(html.includes(`rel="canonical" href="${url}"`));
  assert.equal((html.match(/<h1\b/g)||[]).length,1);
  assert.ok(!html.includes('noindex'));
  for(const [,href] of html.matchAll(/(?:href|src)="([^"]+)"/g)){
    if(/^(https?:|data:|#)/.test(href))continue;
    const resolved=new URL(href,url).pathname;
    await stat(join('dist',resolved,resolved.endsWith('/')?'index.html':''));
  }
  const share=html.match(/property="og:image" content="([^"]+)"/)[1];
  assert.equal(new URL(share).origin,origin);
  const png=await readFile(join('dist',new URL(share).pathname));
  assert.equal(png.readUInt32BE(16),1200);assert.equal(png.readUInt32BE(20),630);
}
const schema=JSON.parse(home.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
assert.equal(schema.url,canonical);assert.equal(schema.name,'Space Drift');
const sitemap=await readFile('dist/sitemap.xml','utf8');
assert.ok(sitemap.includes(`<loc>${origin}/</loc>`));
assert.ok(sitemap.includes(`<loc>${origin}/about/</loc>`));
assert.ok((await readFile('dist/robots.txt','utf8')).includes(`Sitemap: ${origin}/sitemap.xml`));
const script=home.match(/<script type="module">([\s\S]*?)<\/script>/)[1];
const syntax=spawnSync(process.execPath,['--input-type=module','--check'],{input:script,encoding:'utf8'});
assert.equal(syntax.status,0,syntax.stderr);
console.log('Site checks passed: bundled JavaScript, crawlable pages, metadata, canonical URLs, local links, social image, structured data, robots and sitemap.');
