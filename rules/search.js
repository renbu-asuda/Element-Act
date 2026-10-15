'use strict';
(()=>{
 const input=document.getElementById('search'),scope=document.getElementById('scope'),form=document.getElementById('search-form'),results=document.getElementById('results'),status=document.getElementById('result-count');
 const normalize=s=>s.normalize('NFKC').toLocaleLowerCase('ja');
 const params=new URLSearchParams(location.search);input.value=params.get('q')||'';scope.value=params.get('scope')||'';
 if(scope.selectedIndex<0)scope.value='';
 function render(){
  const terms=normalize(input.value).trim().split(/\s+/).filter(Boolean);
  const matched=window.EA_SEARCH.filter(p=>(!scope.value||p.group===scope.value)&&terms.every(w=>normalize(p.title+' '+p.category+' '+p.body).includes(w)));
  results.replaceChildren();
  status.textContent=terms.length||scope.value?`${matched.length}ページが見つかりました。`:`全${matched.length}ページ。検索語を入力するか、分類を選んでください。`;
  for(const p of matched){
   const card=document.createElement('article');card.className='search-result';
   const category=document.createElement('div');category.className='eyebrow';category.textContent=p.category;
   const h=document.createElement('h2'),a=document.createElement('a');a.href=p.url;a.textContent=p.title;h.append(a);
   const hit=terms.length?p.sections.find(s=>terms.some(t=>normalize(s.body).includes(t))):null;
   const body=hit?.body||p.body;const at=terms.length?Math.max(0,normalize(body).indexOf(terms[0])-45):0;
   const para=document.createElement('p');para.textContent=(at?'…':'')+body.slice(at,at+180)+(body.length>at+180?'…':'');
   card.append(category,h,para);
   if(hit){const direct=document.createElement('a');direct.className='direct';direct.href=hit.url;direct.textContent='該当項目：'+hit.title+' →';card.append(direct);}
   results.append(card);
  }
  if(!matched.length){const p=document.createElement('p');p.textContent='一致するページがありません。検索語を短くするか、分類を「すべての分類」に戻してください。';results.append(p);}
 }
 function save(){const p=new URLSearchParams();if(input.value.trim())p.set('q',input.value.trim());if(scope.value)p.set('scope',scope.value);history.replaceState(null,'',location.pathname+(p.size?'?'+p:''));}
 form.addEventListener('submit',e=>{e.preventDefault();save();render();});
 input.addEventListener('input',()=>{save();render();});scope.addEventListener('change',()=>{save();render();});
 render();
})();
