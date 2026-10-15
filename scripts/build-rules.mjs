import {readFileSync,writeFileSync,readdirSync} from 'node:fs';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const require=createRequire(import.meta.url);
const {marked}=require('marked');
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const files=readdirSync(path.join(root,'rules/source')).filter(f=>f.endsWith('.md')).sort();
const esc=s=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const chapters=files.map((file,i)=>({file,id:`chapter-${i+1}`,name:file.slice(2,-3),text:readFileSync(path.join(root,'rules/source',file),'utf8')}));
function render(text){
 let html=marked.parse(text,{gfm:true});
 for(const c of chapters)html=html.replaceAll(`<code>${c.file}</code>`,`<a class="reference" href="#${c.id}">${esc(c.name)}</a>`);
 return html;
}
let count=0;
const articles=chapters.map(c=>{
 const parts=c.text.split(/(?=^## )/m);
 const intro=parts.shift();
 const sections=parts.map((part,i)=>{
  const title=part.split('\n')[0].replace(/^## /,'');
  const id=`${c.id}-section-${i+1}`;count++;
  return {id,title,html:`<section class="entry" id="${id}">${render(part)}<a class="permalink" href="#${id}" aria-label="${esc(title)}へのリンク">この項目へのリンク ↗</a></section>`};
 });
 c.sections=sections;
 return `<article class="chapter${c.id==='chapter-12'?' provisional':''}" id="${c.id}"><div class="chapter-label">CHAPTER ${c.id.split('-')[1].padStart(2,'0')}${c.id==='chapter-12'?' · 未確定・暫定':''}</div><div class="intro">${render(intro)}</div><details class="section-index"><summary>この章の目次（${sections.length}項目）</summary><div>${sections.map(s=>`<a href="#${s.id}">${esc(s.title)}</a>`).join('')}</div></details>${sections.map(s=>s.html).join('')}</article>`;
}).join('\n');
const nav=chapters.map(c=>`<a href="#${c.id}" data-chapter="${c.id}"><span>${c.id.split('-')[1].padStart(2,'0')}</span>${esc(c.name)}</a>`).join('');
const html=`<!doctype html>
<html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="description" content="エレメント・アクトのルール・能力辞典・裁定事例。2026年10月15日までのプラグイン内包資料を収録。全文検索・章別目次・印刷に対応。"><title>ルール＆裁定ブック | エレメント・アクト</title><link rel="stylesheet" href="book.css"></head>
<body><a class="skip" href="#book">本文へ移動</a>
<header><a class="brand" href="#top"><span class="brand-icon">EA</span><span>ELEMENT ACT<small>ルール＆裁定ブック</small></span></a><nav aria-label="関連サイト"><a href="../">カードメーカー ↗</a><button type="button" id="print">印刷 / PDF</button></nav></header>
<div class="layout"><aside><details open id="chapter-menu"><summary>CONTENTS <span>全12章</span></summary><nav aria-label="章の目次">${nav}</nav></details><p class="aside-note">提案者：明日田錬武<br>非公式・非営利の同人TCG<br>収録基準：2026.10.15</p></aside>
<main id="book"><div id="top" class="hero"><div class="eyebrow">ELEMENT ACT / REFERENCE BOOK</div><h1>作る。遊ぶ。<br><em>ルールを確かめる。</em></h1><p>基本の遊び方から、能力の定義、具体的な裁定まで。<br>対戦中の確認にも、オリジナルカードの制作にも。</p><div class="facts"><span><b>12</b> 分野</span><span><b>36</b> 能力定義</span><span><b>105</b> 問＋追加裁定</span></div><div class="quick-links"><a href="#chapter-1">はじめて遊ぶ →</a><a href="#chapter-8">能力を調べる →</a><a href="#chapter-10">裁定を確認する →</a></div></div>
<div class="search-panel"><label for="search">ルール・能力・裁定を検索</label><div class="search-row"><input id="search" type="search" placeholder="例：アンタッチャブル　待機　特殊実行権" autocomplete="off" aria-controls="chapters"><button id="clear" type="button">クリア</button></div><div class="search-meta"><span id="result" role="status" aria-live="polite">全${count}項目を表示</span><label for="scope" class="scope-label">検索範囲<select id="scope"><option value="all">すべての章</option>${chapters.map(c=>`<option value="${c.id}">${esc(c.name)}</option>`).join('')}</select></label></div></div>
<div class="source-note"><strong>このブックについて</strong><p>エレメント・アクト プラグイン v0.29.0の全12分野を、本文を省略せず収録しています。2026年10月15日までの確定裁定を統合した資料であり、提案者の発言の逐語記録ではありません。各章の出典・質問番号・日付と併せて参照してください。提案者の推奨基準として、卓の合意と創作者の意図を尊重します。</p><p>暫定解釈・未採用案・未確定の境界は<a href="#chapter-12">第12章</a>にも記載しています。プラグインの今後の更新が自動反映されるサイトではありません。</p></div>
<p id="empty" hidden>一致する項目がありません。検索語を短くするか、検索範囲を「すべての章」に戻してください。</p><noscript><p>JavaScriptが無効なため検索は使えません。目次と本文はそのまま閲覧できます。</p></noscript>
<div id="chapters">${articles}</div><footer>ELEMENT ACT · ルール＆裁定ブック<br>収録基準：2026-10-15 ／ サイト作成：2026-10-16<br><a href="https://github.com/renbu-asuda/Element-Act">GitHubリポジトリ</a> · <a href="../">カードメーカー</a> · <a href="#top">ページの先頭へ ↑</a></footer></main></div><script src="book.js" defer></script></body></html>`;
writeFileSync(path.join(root,'rules/index.html'),html);
console.log(`Built ${chapters.length} chapters, ${count} searchable sections.`);
