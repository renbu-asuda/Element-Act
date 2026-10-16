import {readFileSync,writeFileSync,readdirSync,mkdirSync} from 'node:fs';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const {marked}=createRequire(import.meta.url)('marked');
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const out=path.join(root,'rules');
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const text=s=>s.replace(/<[^>]+>/g,' ').replace(/&[^;]+;/g,' ').replace(/\s+/g,' ').trim();
const files=readdirSync(path.join(out,'source')).filter(f=>f.endsWith('.md')).sort();
const docs=files.map((file,d)=>{const parts=readFileSync(path.join(out,'source',file),'utf8').split(/(?=^## )/m);return {file,intro:parts.shift(),sections:parts.map((body,i)=>({title:body.split('\n')[0].replace('## ',''),body,old:`chapter-${d+1}-section-${i+1}`}))};});
const groups=[
 ['basics','基本ルール','初めて遊ぶ方へ。デッキ、準備、勝敗、ターンの進め方。'],
 ['zones','ゾーンと配置','カードを置く場所と公開情報。バイチュイもここから。'],
 ['types','カードタイプ','タイプごとの使い方。装備、フィールド、フラッグなど。'],
 ['execution','実行とコスト','カードの使用、マナ、セット、特殊実行権。'],
 ['actions','行動','コスト・ジャッジ、ルーティングなど、名前を持つ行動の手順。'],
 ['combat','攻撃とバトル','攻撃手順、シールド、ダメージ、パワー。'],
 ['effects','能力処理と状態','待機、置換、移動、封印、不適正な配置の処理。'],
 ['keywords','能力辞典','能力名から定義を調べる。各能力を独立ページで掲載。'],
 ['writing','能力文と制作','対象の指定、文章の読み方、カード制作。'],
 ['rulings','裁定事例','番号付き裁定を論点別に整理。個別カードの裁定も収録。'],
 ['guide','利用方針と未確定事項','創作・共有の方針と、まだ確定していない境界。']
].map(([id,title,desc])=>({id,title,desc,pages:[]}));
const pages=[],legacy={},assignments=new Map();
function add(group,slug,title,selected,{lead='',intro='',related=[]}={}){
 const p={group,slug,title,sections:selected,lead,intro,related,url:`${group}/${slug}.html`};
 for(const s of selected){if(assignments.has(s.old))throw Error(`Duplicate ${s.old}`);assignments.set(s.old,p.url+'#'+s.old);legacy[s.old]=p.url+'#'+s.old;}
 groups.find(g=>g.id===group).pages.push(p);pages.push(p);return p;
}
function take(doc,...titles){return titles.map(t=>{const s=docs[doc-1].sections.find(s=>s.title===t);if(!s)throw Error('Missing '+t);return s;});}
const all=n=>docs[n-1].sections;
add('basics','decks','デッキの組み方',take(1,'構築と勝敗','デッキ構成','同名カードの枚数について'),{lead:'メインデッキ・エクストラデッキの枚数と、同名カードの扱いを確認します。'});
add('basics','life-and-victory','ライフと勝敗',take(1,'勝敗について','ライフについて'));
add('basics','setup','ゲーム開始の準備',take(1,'開始準備'),{related:['types/flag.html']});
add('basics','turn','ターンとフェイズ',all(1).filter(s=>/^(ターン|スタートフェイズ|メインフェイズ|バトルフェイズ|エンドフェイズ)/.test(s.title)));
add('zones','overview','ゾーン一覧と「場」',take(1,'ゾーン'),{lead:'「場」と各ゾーンの関係、枠数、配置、公開・非公開を確認します。',related:['zones/baichui.html','types/flag.html']});
add('zones','baichui','バイチュイゾーン',all(7),{lead:'左右の専用ゾーンへの配置と、その2枚を使うバイチュイ実行をまとめています。',related:['execution/special.html','zones/overview.html']});
add('types','overview','カードタイプの一覧',[],{intro:docs[4].intro,lead:'エレメント／アクトの分類、タイプ固有の実行名、置き場、セット可否の早見表です。'});
add('types','elements-and-cards','エレメントとカードの違い',take(5,'エレメントとカード指定'));
add('types','equipment','クロスギアとウェポン',take(5,'クロスギア・ウェポン'),{related:['effects/seal.html','keywords/corpse-armament.html']});
add('types','field','フィールドとDスイッチ',take(5,'フィールドとDスイッチ'));
add('types','aura','オーラ',take(5,'オーラ'));
add('types','castle-fortress','城とフォートレス',take(5,'城・フォートレス'));
add('types','evolution','NEOと進化素材のコスト',take(5,'NEO・素材コスト'));
add('types','flag','フラッグ',all(6),{lead:'アクトに分類され、専用ゾーンに残るカードタイプです。初期配置、実行、更新、離脱をここにまとめています。',related:['basics/setup.html','zones/overview.html','execution/special.html']});
add('execution','overview','実行の基本と通常実行',take(2,'実行とは','通常実行'));
add('execution','mana','マナとコストの支払い',take(2,'コストの支払い','多色カードの実行'));
add('execution','special','特殊実行と特殊実行権',take(2,'ゼロ実行','スーパー実行','エクストラ実行','実行制限','代替コストと特殊実行権'),{related:['zones/baichui.html','types/flag.html']});
add('execution','set','セットと表向きの実行',take(2,'セット','アクトゾーンへのセット','バトルゾーンへのセット','アクトの解決'));
add('execution','events','「実行する」と「出す」の違い',take(2,'実行と「出す」の違い','実行イベント・支払い・登場の区別（第105問）'));
add('actions','cost-judge','コスト・ジャッジ',take(4,'コスト・ジャッジ'),{lead:'双方の山札の一番上を同時にめくり、コストを比べる行動です。同コストなら、めくったカードを山札の一番下に置いてやり直します。'});
add('actions','routing','ルーティングX&Y',take(4,'ルーティングX&Y'),{lead:'カードをX枚引き、その後、手札をY枚捨てる行動です。',related:['effects/hand-limit.html','effects/actions.html']});
add('combat','attack','攻撃の手順と攻撃先',take(3,'攻撃とは','攻撃の処理','召喚酔いについて','攻撃の境界事例（第57・68〜69・79〜81・92・98問）'));
add('combat','shields','シールド・ブレイク・ダメージ',take(3,'ブレイクについて','ダメージについて','セットしたカードへの攻撃について'));
add('combat','power','パワーとバトル',take(3,'バトルについて','アンタップパワー・タップパワーについて','パワー0以下・同時破壊','タップ・アンタップの成立（2026-10-15ピンチ・チュリス確認）'));
add('effects','waiting','待機の優先順と能力喪失',take(4,'待機の解決','待機の存続と能力喪失','回数制限付きの任意処理'));
add('effects','hand-limit','手札上限と調整',take(4,'手札上限'));
add('effects','actions','行動と結果の区別',take(4,'基本定義（回答からの条文化）','行動と結果の対応','同時処理・数・後続条件','具体例'));
add('effects','replacement','置き換えの適用と競合',take(4,'置き換え：最終回答を優先'),{related:['effects/actions.html','guide/unsettled.html']});
add('effects','movement','深淵送り・特殊帰還・トークン',take(4,'深淵送り・特殊帰還・トークン'));
add('effects','state','状況起因処理・再構築・ミスセット',take(4,'即時処理の分類','再構築・ミスセット'));
add('effects','seal','封印と封印解除',take(5,'封印'),{lead:'封印はカードタイプではなく、エレメントに置かれる裏向きカードです。クリーチャーと非クリーチャーの違いに注意してください。',related:['types/equipment.html','effects/waiting.html']});
add('keywords','corpse-armament','屍武装化',take(5,'屍武装化（第104問の最新エラッタ）'),{related:['effects/replacement.html','execution/events.html']});
for(const [i,s] of all(8).entries())add('keywords',({'スピリット':'spirit','スピリット・Ω':'spirit-omega','サモン・ドラグハート':'summon-dragheart','サモン・ドラグハート・Ω':'summon-dragheart-omega','スマッシュ・バースト':'smash-burst','ラスト・ワード':'last-word','ラスト・ワード・Ω':'last-word-omega',"侵略":"invasion","S級侵略":"s-class-invasion","S級侵略<原始>":"s-class-invasion-primitive","S級侵略<宇宙>":"s-class-invasion-space","S級侵略<不死>":"s-class-invasion-undead","S級侵略<轟速>":"s-class-invasion-speed","S級侵略<厄災>":"s-class-invasion-calamity"}[s.title]||`ability-${String(i+1).padStart(2,'0')}`),s.title,[s]);
add('writing','targets','ゾーン・対象・カードの指定',take(9,'ゾーン指定','これ','選ぶ・対象・すべて','持ち主','見る・山札の上からX枚表向きにする'));
add('writing','wording','能力文の読み方',take(9,'出す・実行','任意と強制','かわりに（2026-10-14改訂）','まで','参照する数値','能力消去と独立した移動','「直前に出た」の参照（2026-10-15チューバイ・トラップ確認）'));
add('writing','design','命名条件・能力指定・制作',take(9,'名前条件と能力指定','制作・レビュー'));
const qgroups=[
 ['cards','カードタイプと配置',[1,2,3,12,13,14,15,16,97,100]],
 ['replacement','置換の競合',[4,5,6]],
 ['seal','封印・解除と能力',[7,8,9,10,11,17,18,23,24,25,26,27,28,29,30]],
 ['aura','オーラの破壊と追従',[19,20,21,22]],
 ['power','加護・パワー・同時破壊',[31,32,33,34,35,36,37,38,39,40]],
 ['equipment','装備・クロスの成立',[41,42,43,44,45,103]],
 ['keywords','能力固有の処理',[46,47,48,49,50,51,52,53,54,55,56,58,59,60,61,62,63,64,65,66,67]],
 ['combat','攻撃先・ブロック・攻撃終了',[57,68,69,70,71,72,73,79,80,81,92,98]],
 ['state','即時勝敗・トークン・手順',[74,75,76,77,78,82,83]],
 ['waiting','待機・能力消去・不発',[84,85,93,94,95]],
 ['execution','実行・支払い・登場',[86,87,88,89,90,91,96,101,102,104,105]],
 ['movement','特殊カードの帰還',[99]]
];
for(const [slug,title,nums] of qgroups)add('rulings',slug,title,nums.map(n=>take(10,`第${n}問`)[0]),{lead:'関連する論点の裁定をまとめています。見出しの質問番号は出典の番号です。'});
for(const [slug,title,match] of [
 ['additional','置換・配置・初期配置などの追加25問','2026-10-15追加裁定テスト（別系列・全25問）'],
 ['nehetron','D2-I 禁断のネヘトロン','《D2-I 禁断のネヘトロン》個別裁定（2026-10-15・別系列第1〜10問）'],
 ['churis','ピンチ・チュリス／チューバイ・トラップ','《ピンチ・チュリス／チューバイ・トラップ》個別裁定（2026-10-15・別系列第1〜10問）'],
 ['untouchable','アンタッチャブル／Ωの対象範囲','アンタッチャブル／Ωの能力変更（2026-10-15提案者裁定）']])add('rulings',slug,title,take(10,match));
add('guide','about','エレメント・アクトと創作の方針',take(11,'このゲームについて','運用方針についてのお願い'));
add('guide','usage','利用上の注意と共有方針',all(11).filter(s=>!['このゲームについて','運用方針についてのお願い'].includes(s.title)));
add('guide','unsettled','未確定・暫定事項',all(12),{intro:docs[11].intro,lead:'確定していない境界、暫定解釈、未採用案を確認できます。'});
for(const d of docs)for(const s of d.sections)if(!assignments.has(s.old))throw Error('Unassigned '+s.title);
const categoryForDoc=['basics','execution','combat','effects','types','types','zones','keywords','writing','rulings','guide','guide'];
for(let i=0;i<12;i++)legacy[`chapter-${i+1}`]=i===5?'types/flag.html':i===6?'zones/baichui.html':i===11?'guide/unsettled.html':categoryForDoc[i]+'/index.html';
const sourceByDoc=docs.map(d=>{const intro=d.intro.replace(/^# .+\n/,'').trim();return d.file.startsWith('05')?intro.split('\n').filter(l=>l.startsWith('出典')).join('\n'):intro;});
function relative(from,to){return path.posix.relative(path.posix.dirname(from),to)||'index.html';}
function a(from,to,label,cls=''){return `<a${cls?` class="${cls}"`:''} href="${esc(relative(from,to))}">${esc(label)}</a>`;}
function md(body,from){
 let html=marked.parse(body,{gfm:true,breaks:true});
 docs.forEach((d,i)=>{html=html.replaceAll(`<code>${d.file}</code>`,a(from,legacy[`chapter-${i+1}`],i===5?'フラッグ':i===6?'バイチュイゾーン':groups.find(g=>g.id===categoryForDoc[i]).title,'reference'));});
 // Link individual question references without merging distinct numbered series.
 html=html.replace(/第(\d+)問/g,(m,n)=>{const section=take(10,`第${n}問`)[0];return a(from,assignments.get(section.old),m);});
 return html;
}
function sourceNote(p){
 const nums=[...new Set(p.sections.map(s=>Number(s.old.match(/^chapter-(\d+)/)[1])))];
 if(p.url==='types/overview.html')nums.push(5);if(p.url==='guide/unsettled.html'&&!nums.includes(12))nums.push(12);
 return `<details class="sources"><summary>出典・裁定の位置づけ</summary><p>収録基準：2026年10月16日。基本資料は10月15日までの統合版で、新行動および能力の追加・再登録は10月16日の提案者指定を反映しています。提案者の推奨基準を整理した資料であり、発言の逐語記録ではありません。</p>${nums.map(n=>`<div>${md(sourceByDoc[n-1],p.url)}</div>`).join('')}</details>`;
}
function shell(url,title,body,group='',extra=''){
 const active=groups.find(g=>g.id===group);
 const nav=groups.map((g,i)=>`<a${g.id===group?' class="active" aria-current="true"':''} href="${relative(url,g.id+'/index.html')}"><span>${String(i+1).padStart(2,'0')}</span>${g.title}</a>${g.id===group?`<div class="subnav">${g.pages.map(p=>a(url,p.url,p.title,p.url===url?'current':'')).join('')}</div>`:''}`).join('');
 return `<!doctype html><html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="description" content="${esc(title)} — エレメント・アクトのルール＆裁定ブック。"><title>${esc(title)} | EAルール＆裁定ブック</title><link rel="stylesheet" href="${relative(url,'book.css')}"></head><body><a class="skip" href="#content">本文へ</a><header>${a(url,'index.html','EA / ルール＆裁定ブック','brand')}<nav>${a(url,'search.html','検索')}<a href="${relative(url,'../index.html')}">カードメーカー ↗</a><button type="button" id="print">印刷</button></nav></header><div class="layout"><aside><details id="menu"><summary>目次を開く</summary><nav aria-label="カテゴリ">${nav}</nav></details><p class="aside-note">明日田錬武 提案<br>収録基準 2026.10.16</p></aside><main id="content"><nav class="breadcrumbs" aria-label="現在位置">${a(url,'index.html','ブックの入口')}${active?' <span>›</span> '+a(url,group+'/index.html',active.title):''}${url!==group+'/index.html'?' <span>›</span> '+esc(title):''}</nav>${body}<footer><p><strong>AIの利用について</strong><br>カードメーカーの開発、エレメント・アクトのルール・裁定の作成、および本サイトの制作にはAIを利用しています。</p>ELEMENT ACT · ルール＆裁定ブック<br>収録基準：2026-10-16<br>${a(url,'guide/unsettled.html','未確定・暫定事項')} · <a href="https://github.com/renbu-asuda/Element-Act">GitHub</a></footer></main></div><script src="${relative(url,'book.js')}" defer></script>${extra}</body></html>`;
}
function write(url,s){mkdirSync(path.dirname(path.join(out,url)),{recursive:true});writeFileSync(path.join(out,url),s);}
function listing(list,from){return `<div class="page-list">${list.map(p=>a(from,p.url,p.title)).join('')}</div>`;}
for(const p of pages){
 const siblings=groups.find(g=>g.id===p.group).pages,i=siblings.indexOf(p);
 const sections=p.sections.filter(s=>s.body.replace(/^## .*\n/,'').trim());
 const toc=sections.length>1?`<details open class="section-index"><summary>このページの項目</summary><div>${sections.map(s=>`<a href="#${s.old}">${esc(s.title)}</a>`).join('')}</div></details>`:'';
 const intro=p.intro?md(p.intro.replace(/^# .+\n/,''),p.url):'';
 const body=`<div class="eyebrow">${groups.find(g=>g.id===p.group).title}</div><h1>${esc(p.title)}</h1>${p.lead?`<p class="lead">${esc(p.lead)}</p>`:''}${toc}<div class="article-body">${intro}${p.sections.map(s=>`<section id="${s.old}">${md(p.sections.length===1?s.body.replace(/^## .*\n/,''):s.body,p.url)}</section>`).join('')}</div>${p.related.length?`<section class="related"><h2>あわせて読む</h2>${listing(p.related.map(url=>pages.find(x=>x.url===url)),p.url)}</section>`:''}${sourceNote(p)}<nav class="pager" aria-label="前後のページ">${siblings[i-1]?a(p.url,siblings[i-1].url,'← '+siblings[i-1].title):'<span></span>'}${siblings[i+1]?a(p.url,siblings[i+1].url,siblings[i+1].title+' →'):'<span></span>'}</nav>`;
 write(p.url,shell(p.url,p.title,body,p.group));
}
for(const g of groups){
 const url=g.id+'/index.html';
 const list=g.id==='keywords'?[...g.pages].sort((a,b)=>a.title.localeCompare(b.title,'ja')):g.pages;
 write(url,shell(url,g.title,`<div class="eyebrow">REFERENCE / ${g.id.toUpperCase()}</div><h1>${g.title}</h1><p class="lead">${g.desc}</p><p class="count">${g.pages.length}ページ · 項目を選んで開く</p>${listing(list,url)}`,g.id));
}
const home=`<div class="hero"><div class="eyebrow">ELEMENT ACT / REFERENCE BOOK</div><h1>必要なルールへ、<br><em>迷わず進む。</em></h1><p class="lead">遊び方、カードの分類、能力の処理、具体的な裁定。<br>調べたい分野を選んで、項目ごとのページへ。</p><form class="search-form" action="search.html" role="search"><label for="home-search">ルール・能力名を検索</label><div><input id="home-search" type="search" name="q" placeholder="例：フラッグ、バイチュイ、待機"><button>検索</button></div></form><div class="quick-links">${a('index.html','basics/decks.html','初めて遊ぶ →')}${a('index.html','keywords/index.html','能力名から探す →')}${a('index.html','rulings/index.html','裁定を確認 →')}</div></div><section class="category-grid">${groups.map((g,i)=>`<a class="category-card" href="${g.id}/index.html"><span>${String(i+1).padStart(2,'0')} / ${g.pages.length} PAGES</span><h2>${g.title}</h2><p>${g.desc}</p><b>項目を見る →</b></a>`).join('')}</section><p class="source-note">2026年10月16日までの推奨基準を収録。暫定解釈・未採用案は${a('index.html','guide/unsettled.html','未確定・暫定事項')}で確認できます。</p>`;
write('index.html',shell('index.html','ルール＆裁定ブック',home,'','<script src="legacy-links.js" defer></script>'));
write('legacy-links.js',`'use strict';\nconst legacy=${JSON.stringify(legacy)};\nfunction followLegacy(){const dest=legacy[location.hash.slice(1)];if(dest)location.replace(dest);}followLegacy();window.addEventListener('hashchange',followLegacy);\n`);
const searchBody=`<div class="eyebrow">SEARCH</div><h1>ルールを検索</h1><p class="lead">すべてのページの本文を検索します。空白で区切ると、すべての言葉を含む項目を探せます。</p><form id="search-form" class="search-form" action="search.html" role="search"><label for="search">検索する言葉</label><div><input id="search" type="search" name="q" placeholder="能力名・用語・裁定番号" autocomplete="off"><button>検索</button></div><label for="scope">分類で絞り込む</label><select id="scope" name="scope"><option value="">すべての分類</option>${groups.map(g=>`<option value="${g.id}">${g.title}</option>`).join('')}</select></form><p id="result-count" role="status" aria-live="polite"></p><div id="results"></div><noscript>全文検索にはJavaScriptが必要です。${a('search.html','index.html','分類別の目次')}から各項目を開けます。</noscript>`;
write('search.html',shell('search.html','ルールを検索',searchBody,'','<script src="search-data.js" defer></script><script src="search.js" defer></script>'));
write('search-data.js','window.EA_SEARCH='+JSON.stringify(pages.map(p=>({title:p.title,url:p.url,group:p.group,category:groups.find(g=>g.id===p.group).title,body:text(marked.parse(p.sections.map(s=>s.body).join('\n')+'\n'+p.intro)),sections:p.sections.map(s=>({title:s.title,url:p.url+'#'+s.old,body:text(marked.parse(s.body))}))}))).replaceAll('<','\\u003c')+';\n');
write('catalog.json',JSON.stringify({pages:pages.map(p=>({title:p.title,url:p.url,group:p.group,sections:p.sections.map(s=>s.old)})),groups:groups.map(g=>({id:g.id,title:g.title,pages:g.pages.map(p=>p.url)})),legacy},null,2));
console.log(`Built ${groups.length} categories, ${pages.length} item pages, ${assignments.size} preserved sections, ${Object.keys(legacy).length} legacy redirects.`);
