'use strict';
const $=s=>document.querySelector(s);
const search=$('#search'),scope=$('#scope'),entries=[...document.querySelectorAll('.entry')],chapters=[...document.querySelectorAll('.chapter')];
const normalize=s=>s.normalize('NFKC').toLocaleLowerCase('ja');
const texts=new Map(entries.map(e=>[e,normalize(e.textContent)]));
function filter(){
 const words=normalize(search.value).trim().split(/\s+/).filter(Boolean);
 let count=0;
 chapters.forEach(ch=>{
  const allowed=scope.value==='all'||scope.value===ch.id;
  let visible=0;
  ch.querySelectorAll('.entry').forEach(e=>{const match=allowed&&words.every(w=>texts.get(e).includes(w)||normalize(ch.querySelector('h1').textContent).includes(w));e.hidden=!match;if(match){visible++;count++;}});
  ch.hidden=!visible;
  ch.querySelector('.section-index').hidden=words.length>0;
 });
 $('#empty').hidden=count>0;
 $('#result').textContent=(words.length?'検索結果：':'表示中：')+count+'項目'+(words.length?'（空白区切りでAND検索）':'');
}
search.addEventListener('input',filter);scope.addEventListener('change',filter);
$('#clear').addEventListener('click',()=>{search.value='';scope.value='all';filter();search.focus();});
function revealHash(){
 let id;try{id=decodeURIComponent(location.hash.slice(1));}catch{return;}
 const target=document.getElementById(id);if(!target)return;
 if(target.closest('.chapter')?.hidden||target.closest('.entry')?.hidden){search.value='';scope.value='all';filter();}
 if(target.closest('.chapter'))document.querySelectorAll('[data-chapter]').forEach(a=>a.classList.toggle('active',a.dataset.chapter===target.closest('.chapter').id));
 requestAnimationFrame(()=>target.scrollIntoView({block:'start'}));
}
window.addEventListener('hashchange',revealHash);
document.addEventListener('click',e=>{const a=e.target.closest('a[href^="#"]');if(a&&a.hash===location.hash)revealHash();});
$('#print').addEventListener('click',()=>window.print());
let printState;
window.addEventListener('beforeprint',()=>{printState=[search.value,scope.value];search.value='';scope.value='all';filter();});
window.addEventListener('afterprint',()=>{if(printState){[search.value,scope.value]=printState;filter();printState=null;}});
filter();if(location.hash)revealHash();
