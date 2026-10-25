import {mkdirSync,copyFileSync,cpSync,readFileSync,writeFileSync} from 'node:fs';
import {validateEdition,validatePolicy} from '../src/core.js';
validateEdition(JSON.parse(readFileSync('public/data/edition.json','utf8')));
validatePolicy(JSON.parse(readFileSync('public/data/ranking-policy.json','utf8')));
mkdirSync('dist',{recursive:true});copyFileSync('index.html','dist/index.html');cpSync('src','dist/src',{recursive:true});cpSync('public','dist',{recursive:true});cpSync('public','dist/public',{recursive:true});
writeFileSync('dist/_headers','/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n  Permissions-Policy: geolocation=(), camera=(), microphone=()\n  Content-Security-Policy: default-src \'self\'; script-src \'self\'; style-src \'self\' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src \'self\' data:; connect-src \'self\'; object-src \'none\'; base-uri \'self\'; frame-ancestors \'none\'\n');
console.log('Built static prototype in dist/');
