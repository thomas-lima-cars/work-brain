const fs=require('fs');
const D=JSON.parse(fs.readFileSync(process.argv[2],'utf8'));
function adNum(valor,media,desvio){if(valor===null||valor===undefined||media===null||!media)return null;
  if(desvio&&desvio>0)return 1/(1+Math.abs(valor-media)/desvio);return 1/(1+Math.abs(valor-media)/media);}
const mo={}; // modelo_id/categoria_id da loja nao publicados: usa nome
function pontua(v,l){const c=[];
 let a=adNum(v.valor,l.preco_medio,l.preco_desvio);if(a!==null&&l.p_preco>0)c.push([a,l.p_preco]);
 a=adNum(v.idade,l.idade_media,l.idade_desvio);if(a!==null&&l.p_idade>0)c.push([a,l.p_idade]);
 a=adNum(v.km,l.km_medio,l.km_desvio);if(a!==null&&l.p_km>0)c.push([a,l.p_km]);
 if(l.pct_modelo>0&&v.model_id!==null)c.push([v.modelo===l.modelo?1:0,l.pct_modelo/100]);
 if(l.pct_categoria>0&&v.category_id!==null)c.push([v.categoria===l.categoria?1:0,l.pct_categoria/100]);
 a=adNum(v.desagio,l.desagio,l.desagio_desvio);if(a!==null&&l.p_desagio>0)c.push([a,l.p_desagio]);
 if(l.pct_laudo>0&&l.laudo_moda)c.push([v.laudo===l.laudo_moda?1:0,l.pct_laudo/100]);
 if(l.p_uf>0)c.push([v.uf===l.uf?1:0,l.p_uf]);
 if(!c.length)return null;let sp=0,spa=0;c.forEach(x=>{sp+=x[1];spa+=x[0]*x[1];});
 return sp>0?(spa/sp)*l.confianca*100:null;}
const porWl={};D.lojas.forEach((l,i)=>{(porWl[l.whitelabel_id]=porWl[l.whitelabel_id]||[]).push(i);});
const cont=[];let tot=0,tot60=0;
D.veiculos.forEach(v=>{let n=0,n60=0;const vis={};(v.wls||[]).forEach(w=>(porWl[w]||[]).forEach(i=>{if(vis[i])return;vis[i]=1;const s=pontua(v,D.lojas[i]);if(s!==null&&s>=70)n++;if(s!==null&&s>=60)n60++;}));cont.push(n);tot+=n;tot60+=n60;});
cont.sort((a,b)=>a-b);const q=p=>cont[Math.floor(p*(cont.length-1))];
// controle: quantos >=50 por este metodo vs acima_do_corte do run
let n50=0;D.veiculos.forEach(v=>{const vis={};(v.wls||[]).forEach(w=>(porWl[w]||[]).forEach(i=>{if(vis[i])return;vis[i]=1;const s=pontua(v,D.lojas[i]);if(s!==null&&s>=50)n50++;}));});
console.log('veiculos',D.veiculos.length,'lojas publicadas',D.lojas.length);
console.log('controle: pares>=50 recomputados',n50,'| acima_do_corte somado no run',D.veiculos.reduce((s,v)=>s+(v.acima_do_corte||0),0));
console.log('pares >=70:',tot,'| >=60:',tot60);
console.log('por veiculo (>=70): p50',q(.5),'p75',q(.75),'p90',q(.9),'p95',q(.95),'p99',q(.99),'max',cont[cont.length-1]);
console.log('veiculos com >30 pares>=70:',cont.filter(x=>x>30).length,'com >100:',cont.filter(x=>x>100).length,'com >200:',cont.filter(x=>x>200).length);
[30,50,100,150,200,300].forEach(t=>console.log('cap',t,'-> pares>=70 publicados',cont.reduce((s,x)=>s+Math.min(x,t),0)));
