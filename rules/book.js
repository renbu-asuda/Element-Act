'use strict';
const menu=document.getElementById('menu');
if(menu&&matchMedia('(min-width: 851px)').matches)menu.open=true;
document.getElementById('print')?.addEventListener('click',()=>window.print());
