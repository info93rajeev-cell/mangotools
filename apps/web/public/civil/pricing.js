'use strict';
// Exact decimal rate multiplication; each displayed line rounds half-up to cents.
function decimalParts(value){
 const text=String(value).trim(),m=text.match(/^([+-]?)(\d+)(?:\.(\d*))?(?:e([+-]?\d+))?$/i);
 if(!m)throw Error('Enter a valid decimal rate or quantity.');
 const fraction=m[3]||'',exponent=Number(m[4]||0);if(Math.abs(exponent)>40)throw Error('Decimal value exceeds the reference range.');
 let n=BigInt(m[2]+fraction)*(m[1]==='-'?-1n:1n),scale=fraction.length-exponent;
 if(scale<0){n*=10n**BigInt(-scale);scale=0;}return{n,scale};
}
function lineCents(quantity,rate){
 const a=decimalParts(quantity),b=decimalParts(rate);if(a.n<0n||b.n<0n)throw Error('Cost quantities and rates must be nonnegative.');
 if(b.scale>6)throw Error('Rates support up to six decimal places.');
 const numerator=a.n*b.n*100n,denominator=10n**BigInt(a.scale+b.scale);
 return(numerator+denominator/2n)/denominator;
}
function centsDecimal(cents){const c=BigInt(cents);return(c/100n).toString()+'.'+(c%100n).toString().padStart(2,'0');}
function currencySymbol(){return{INR:'₹',USD:'$',EUR:'€',GBP:'£'}[choice('currency')]||'₹';}
function centsMoney(cents){const c=BigInt(cents);return currencySymbol()+(c/100n).toLocaleString(choice('currency')==='INR'?'en-IN':'en-US')+'.'+(c%100n).toString().padStart(2,'0');}
function pricingEnabled(){return q('#pricingEnabled')?.checked!==false;}
function synchronizePricing(){
 const enabled=pricingEnabled();q('.pricing-fields').hidden=!enabled;
 qa('[data-price]').forEach(n=>{n.disabled=!enabled;n.closest('label').querySelector('.suffix').textContent=currencySymbol();});
 if(cfg.id==='concrete'){
  const ready=choice('mixMode').startsWith('Ready');
  for(const id of ['cementRate','sandRate','aggregateRate'])q('#'+id).closest('label').hidden=ready;
  q('#rate').closest('label').hidden=!ready;
 }
}
function applyPricing(r){
 if(!pricingEnabled()){
  r.pricing={enabled:false,totalCents:'0',lines:[],currency:choice('currency')};r.cost='0.00';r.costNote='Pricing off';
 }else{
  const lines=[];
  const add=(label,quantity,key,unit)=>{const rate=q('#'+key).value,cents=lineCents(quantity,rate);lines.push({label,quantity:String(quantity),rate,unit,cents:cents.toString()});};
  switch(cfg.id){
   case'brickwork':add('Bricks',r.buy,'brickRate','pieces');add('Cement · whole bags',ceil(r.bags),'cementRate','bags');add('Sand',r.sand,'sandRate','m³');add('Masonry labour',r.area,'labourRate','m²');break;
   case'concrete':
    if(choice('mixMode').startsWith('Ready'))add('Ready-mix · supplier order',r.order,'rate','m³');
    else{add('Cement · whole bags',ceil(r.bags),'cementRate','bags');add('Sand',r.sand,'sandRate','m³');add('Aggregate',r.aggregate,'aggregateRate','m³');}
    add('Placing labour',r.needed,'concreteLabourRate','m³');break;
   case'excavation':add('Excavation · bank volume',r.bank,'digRate','m³ bank');add('Haul · whole truckloads',r.loads,'loadRate','loads');break;
   case'paint':add('Finish · purchased litres',r.paintTins*val('pack'),'paintRate','L');add('Primer · purchased litres',r.primerTins*val('primerPack'),'primerRate','L');add('Preparation',r.area,'prepRate','m²');add('Painting labour',r.area,'paintLabourRate','m²');break;
   case'plaster':add('Cement · whole bags',ceil(r.bags),'cementRate','bags');add('Sand',r.sand,'sandRate','m³');add('Plastering labour',r.area,'labourRate','m²');break;
   case'tile-flooring':add('Tiles · whole boxes',r.boxes,'boxRate','boxes');add('Adhesive · whole bags',ceil(r.adhesive/val('adhesivePack')),'adhesiveRate','bags');add('Grout · whole packs',ceil(r.grout/val('groutPack')),'groutRate','packs');add('Underlay · whole packs',ceil(r.underlay/val('underlayPack')),'underlayRate','packs');add('Installation',r.area,'labourRate','m²');break;
   case'pallet-loading':add('Pallet supply',r.count,'palletRate','pallets');add('Handling',r.count,'handlingRate','pallets');add('Wrapping',r.count,'wrappingRate','pallets');break;
   case'volumetric-weight':{
    add('Freight · chargeable weight',r.charged,'rate','charged kg');
    const base=BigInt(lines[0].cents),minimum=lineCents(1,q('#minimum').value);
    if(minimum>base)lines.push({label:'Minimum-charge adjustment',quantity:'1',rate:centsDecimal(minimum-base),unit:'adjustment',cents:(minimum-base).toString()});break;
   }
  }
  add('Other charges',1,cfg.id==='volumetric-weight'?'other':'otherCharges','flat');
  const total=lines.reduce((sum,l)=>sum+BigInt(l.cents),0n);
  r.pricing={enabled:true,totalCents:total.toString(),lines,currency:choice('currency')};r.cost=centsDecimal(total);r.costNote='Estimated total '+centsMoney(total)+' · user-entered rates';
 }
 for(const card of r.kpis)if(/cost|quote/i.test(card.name)){card.value=r.pricing.enabled?centsMoney(r.pricing.totalCents):'Pricing off';card.note=r.pricing.enabled?'See itemized Cost Estimate':'Quantities remain available';card.money=true;}
 return r;
}
function renderPricing(r){
 q('.pricing-total').textContent=r.pricing.enabled?centsMoney(r.pricing.totalCents):'Pricing off';q('.pricing').dataset.stale='false';
 if(!r.pricing.enabled){q('.pricing-breakdown').textContent='Pricing is excluded. Quantity calculations remain available.';return;}
 const rows=r.pricing.lines.map(l=>`<tr><th scope="row">${escapeText(l.label)}</th><td>${escapeText(number(l.quantity,6).replace(/\.?0+$/,''))} ${escapeText(l.unit)}</td><td>${escapeText(currencySymbol()+l.rate)}</td><td>${escapeText(centsMoney(l.cents))}</td></tr>`).join('');
 q('.pricing-breakdown').innerHTML=`<div class="pricing-table-scroll" role="region" aria-label="Itemized cost estimate" tabindex="0"><table><caption>Cost breakdown · ${escapeText(r.pricing.currency)}</caption><thead><tr><th scope="col">Item</th><th scope="col">Quantity / basis</th><th scope="col">Entered rate</th><th scope="col">Amount</th></tr></thead><tbody>${rows}</tbody><tfoot><tr><th scope="row" colspan="3">Estimated total</th><td>${escapeText(centsMoney(r.pricing.totalCents))}</td></tr></tfoot></table></div>`;
}
function pricingSummary(r){return r.pricing.enabled?r.pricing.lines.map(l=>l.label+': '+l.quantity+' '+l.unit+' × '+r.pricing.currency+' '+l.rate+' = '+centsMoney(l.cents)).join('\n')+'\nEstimated total: '+centsMoney(r.pricing.totalCents):'Pricing off';}
function setupPricing(){
 synchronizePricing();q('#pricingEnabled').onchange=()=>{synchronizePricing();stale();};q('#currency').onchange=()=>{synchronizePricing();stale();};
 q('#mixMode')?.addEventListener('change',synchronizePricing);q('.recalculate-pricing').onclick=calculate;
 let openBeforePrint=false;
 addEventListener('beforeprint',()=>{openBeforePrint=q('.pricing').open;if(q('.results').dataset.stale==='true'&&!calculate())q('.pricing-breakdown').textContent='No current estimate: correct invalid inputs and recalculate.';q('.pricing').open=true;});
 addEventListener('afterprint',()=>{q('.pricing').open=openBeforePrint;});
}
