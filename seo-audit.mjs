import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const domain = 'https://tuled.com.mx';
const blogDir = path.join(root, 'blog');
const rootPages = fs.readdirSync(root).filter(name => name.endsWith('.html')).sort();
const articlePages = fs.readdirSync(blogDir).filter(name => name.endsWith('.html')).sort();
const pagePaths = [
  ...rootPages.map(name => path.join(root, name)),
  ...articlePages.map(name => path.join(blogDir, name))
];
const errors = [];
const titles = new Map();
const descriptions = new Map();
const canonicals = new Map();

const matches = (text, pattern) => [...text.matchAll(pattern)];
const first = (text, pattern) => text.match(pattern)?.[1]?.trim() || '';
const pageName = file => path.relative(root, file).replaceAll('\\', '/');

for (const file of pagePaths) {
  const rel = pageName(file);
  const html = fs.readFileSync(file, 'utf8');
  const title = first(html, /<title>([\s\S]*?)<\/title>/i);
  const description = first(html, /<meta\s+name="description"\s+content="([^"]*)"/i);
  const canonical = first(html, /<link\s+rel="canonical"\s+href="([^"]+)"/i);
  const expectedCanonical = rel === 'index.html' ? `${domain}/` : `${domain}/${rel}`;

  if (!title) errors.push(`${rel}: falta <title>`);
  if (!description) errors.push(`${rel}: falta meta description`);
  if (canonical !== expectedCanonical) errors.push(`${rel}: canonical incorrecta (${canonical || 'vacía'})`);
  if ((html.match(/<link\s+rel="canonical"/gi) || []).length !== 1) errors.push(`${rel}: canonical duplicada o ausente`);
  if (/noindex/i.test(html)) errors.push(`${rel}: contiene noindex`);
  if (/www\.pinturastuled\.com/i.test(html)) errors.push(`${rel}: conserva el dominio anterior`);
  if ((html.match(/<h1\b/gi) || []).length !== 1) errors.push(`${rel}: debe contener exactamente un H1`);

  for (const [value, map, label] of [[title, titles, 'title'], [description, descriptions, 'description'], [canonical, canonicals, 'canonical']]) {
    if (!value) continue;
    if (map.has(value)) errors.push(`${rel}: ${label} duplicada con ${map.get(value)}`);
    else map.set(value, rel);
  }

  for (const tag of matches(html, /<img\b[^>]*>/gi)) {
    if (!/\balt="[^"]*"/i.test(tag[0])) errors.push(`${rel}: imagen sin atributo alt`);
  }

  for (const script of matches(html, /<script\s+type="application\/ld\+json">([\s\S]*?)<\/script>/gi)) {
    try { JSON.parse(script[1]); }
    catch (error) { errors.push(`${rel}: JSON-LD inválido (${error.message})`); }
  }

  for (const ref of matches(html, /(?:href|src)="([^"]+)"/gi)) {
    const value = ref[1];
    if (/^(?:https?:|mailto:|tel:|data:|javascript:|#)/i.test(value)) continue;
    const clean = value.split(/[?#]/)[0];
    if (!clean) continue;
    const target = clean.startsWith('/')
      ? path.join(root, clean.replace(/^\/+/, ''))
      : path.resolve(path.dirname(file), clean);
    if (!fs.existsSync(target)) errors.push(`${rel}: referencia local inexistente ${value}`);
  }
}

const sitemapText = fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8');
const sitemapUrls = matches(sitemapText, /<loc>([^<]+)<\/loc>/g).map(match => match[1]);
const expectedUrls = [...canonicals.keys()].sort();
const uniqueSitemapUrls = new Set(sitemapUrls);
if (uniqueSitemapUrls.size !== sitemapUrls.length) errors.push('sitemap.xml: contiene URLs duplicadas');
for (const url of expectedUrls) if (!uniqueSitemapUrls.has(url)) errors.push(`sitemap.xml: falta ${url}`);
for (const url of uniqueSitemapUrls) if (!canonicals.has(url)) errors.push(`sitemap.xml: URL inexistente o no canónica ${url}`);
if (!/^<\?xml version="1\.0" encoding="UTF-8"\?>/.test(sitemapText)) errors.push('sitemap.xml: declaración XML incorrecta');
if (!/xmlns="http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9"/.test(sitemapText)) errors.push('sitemap.xml: namespace inválido');

const robots = fs.readFileSync(path.join(root, 'robots.txt'), 'utf8');
if (!/^User-agent:\s*\*$/m.test(robots)) errors.push('robots.txt: falta User-agent: *');
if (!/^Allow:\s*\/$/m.test(robots)) errors.push('robots.txt: falta Allow: /');
if (!new RegExp(`^Sitemap:\\s*${domain.replaceAll('.', '\\.')}/sitemap\\.xml$`, 'm').test(robots)) errors.push('robots.txt: sitemap incorrecto');
if (/Disallow:\s*\//i.test(robots)) errors.push('robots.txt: bloqueo global detectado');

const blogIndex = fs.readFileSync(path.join(root, 'blog.html'), 'utf8');
const linkedArticles = new Set(matches(blogIndex, /href="blog\/([^"#?]+\.html)"/g).map(match => match[1]));
for (const article of articlePages) if (!linkedArticles.has(article)) errors.push(`blog.html: no enlaza ${article}`);

if (process.argv.includes('--production')) {
  const productionUrls = [...uniqueSitemapUrls, `${domain}/robots.txt`, `${domain}/sitemap.xml`];
  for (const url of productionUrls) {
    try {
      const response = await fetch(url, {redirect: 'manual'});
      if (response.status !== 200) errors.push(`Producción: ${url} respondió ${response.status}`);
    } catch (error) {
      errors.push(`Producción: no se pudo obtener ${url} (${error.message})`);
    }
  }
}

console.log(`Páginas revisadas: ${pagePaths.length}`);
console.log(`Artículos revisados: ${articlePages.length}`);
console.log(`URLs del sitemap: ${sitemapUrls.length}`);
if (errors.length) {
  console.error(`SEO audit: FAIL (${errors.length} problemas)`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}
console.log('SEO audit: PASS');
