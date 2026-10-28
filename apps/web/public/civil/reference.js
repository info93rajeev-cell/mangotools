'use strict';
const cfg=window.__CIVIL_CONFIG__||JSON.parse(document.querySelector('#config')?.textContent||'{}'),form=document.querySelector('form');
let mode=cfg.initial||cfg.modes[0],previousUnit=cfg.unit,previousWeight='kg';
const modeValues={};
const q=s=>document.querySelector(s),qa=s=>[...document.querySelectorAll(s)];
const factors=cfg.id==='pallet-loading'?{mm:1,in:25.4}:cfg.id==='volumetric-weight'?{cm:1,m:100,in:2.54,ft:30.48}:{m:1,ft:.3048};
const scale=()=>factors[q('#unit').value];
const number=(x,d=2)=>Number(x).toLocaleString('en-IN',{minimumFractionDigits:d,maximumFractionDigits:d});
const money=x=>'₹'+number(x,0),ceil=x=>Math.ceil(x-1e-9),floor=x=>Math.floor(x+1e-9);
const escapeText=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const val=key=>{const n=document.getElementById(key);if(!n)return 0;if(n.dataset.price&&!pricingEnabled())return 0;return Number(n.value)*(n.dataset.role==='length'?scale():n.dataset.role==='area'?scale()**2:1);};
const choice=key=>document.getElementById(key)?.value;
const kpi=(name,value,unit,note)=>({name,value,unit,note});
const rowDefs={
 openings:{keys:['name','width','height','quantity'],labels:['Type','Width','Height','Qty'],roles:['','length','length',''],data:[['Door',.9,2.1,1],['Window',1.2,1.2,1]]},
 walls:{keys:['name','length','height','thickness','quantity','deduction'],labels:['Wall','Length','Height','Thickness mm','Qty','Deduction m²'],roles:['','length','length','','','area'],data:[['Wall A',5,3,200,1,3.33],['Wall B',4,3,200,1,0]]},
 elements:{keys:['name','length','width','depth','quantity'],labels:['Element','Length','Width','Depth','Qty'],roles:['','length','length','length',''],data:[]},
 sections:{keys:['name','length','width','depth','quantity'],labels:['Section','Length','Width','Depth','Qty'],roles:['','length','length','length',''],data:[]},
 rooms:{keys:['name','length','width','height','deduction'],labels:['Room','Length','Width','Height','Opening m²'],roles:['','length','length','length','area'],data:[]},
 surfaces:{keys:['name','length','height','faces','deduction'],labels:['Surface','Length','Height','Faces','Deduction m²'],roles:['','length','length','','area'],data:[]},
 areas:{keys:['name','length','width','deduction','quantity'],labels:['Area','Length','Width / height','Exclusion m²','Qty'],roles:['','length','length','area',''],data:[['Living room',6,4,1,1],['Hallway',3,1.5,0,1]]},
 packages:{keys:['name','length','width','height','quantity','weight'],labels:['Description','Length','Width','Height','Qty','Actual weight'],roles:['','length','length','length','',''],data:[['Carton A',60,40,50,2,8],['Carton B',30,30,30,3,7]]},
 cartons:{keys:['name','length','width','height','quantity','weight'],labels:['SKU','Length','Width','Height','Qty','Weight kg'],roles:['','length','length','length','',''],data:[['Carton A',400,300,250,200,8],['Carton B',500,300,300,60,12]]}
};
function fieldMarkup(f){
 const stored=modeValues[mode]?.[f.key],value=stored??(f.role?Number((f.value/scale()**(f.role==='area'?2:1)).toPrecision(12)):f.value);
 const unit=f.role==='length'?q('#unit').value:f.role==='area'?'m²':f.unit;
 const input=f.options?`<select id="${f.key}">${f.options.map(s=>`<option${s===value?' selected':''}>${escapeText(s)}</option>`).join('')}</select>`:`<span class="control"><input id="${f.key}" type="number" value="${value}" min="${f.min}" max="${f.max}" step="any" required inputmode="decimal" data-role="${f.role}"><span class="suffix">${escapeText(unit)}</span></span>`;
 return `<label class="field" for="${f.key}"><span>${escapeText(f.label)}</span>${input}</label>`;
}
function updateMode(){
 const fields=cfg.dimensions[mode];
 q('.dimensions').innerHTML=fields.length?'<div class="fields">'+fields.map(fieldMarkup).join('')+'</div>':'';
 qa('[data-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mode===mode)));
 q('.mode-context').textContent=mode;
 const conditional=q('.conditional-rows');
 conditional.hidden=!(cfg.id==='brickwork'&&mode==='Multiple Walls'||cfg.id==='tile-flooring'&&mode==='Multiple Areas'||cfg.id==='pallet-loading'&&mode==='Multiple Types');
 const openings=q('[data-rows=openings]');
 if(openings)openings.hidden=cfg.id==='brickwork'&&mode==='Multiple Walls'||cfg.id==='paint'&&['Ceiling','Custom'].includes(mode)||cfg.id==='plaster'&&['Ceiling','Custom'].includes(mode);
 if(cfg.id==='concrete')updateSection();
 updateUnits();
}
function updateSection(){
 const shape=choice('section');
 if(mode==='Column')for(const id of ['width','breadth','diameter'])q('#'+id).closest('label').hidden=shape==='Circular'?id!=='diameter':id==='diameter';
 if(mode==='Custom')for(const id of ['sectionArea','width','breadth'])q('#'+id).closest('label').hidden=shape==='Measured area'?id!=='sectionArea':shape==='Circular'?id!=='width':id==='sectionArea';
}
function updateUnits(){
 qa('input[data-role=length],input[data-role=area]').forEach(n=>{const label=n.closest('label');const suffix=label.querySelector('.suffix');if(suffix)suffix.textContent=q('#unit').value+(n.dataset.role==='area'?'²':'');});
}
function renderRows(section,data){
 const kind=section.dataset.rows,def=rowDefs[kind];
 section.querySelector('.rows').innerHTML=data.map((r,index)=>'<div class="data-row">'+def.keys.map((key,i)=>`<label><span>${escapeText(def.labels[i])}</span><input type="${i===0?'text':'number'}" value="${escapeText(r[i])}" data-key="${key}" data-role="${def.roles[i]}" aria-label="${escapeText(def.labels[i])} ${index+1}" ${i?'required min="'+(['deduction'].includes(key)?0:key==='weight'&&kind==='packages'?0:.001)+'" max="1000000" step="any" inputmode="decimal"':''}></label>`).join('')+`<button type="button" class="delete" aria-label="Delete ${kind} row ${index+1}">×</button></div>`).join('');
 section.querySelector('.row-count').textContent=data.length+' rows';
 section.querySelectorAll('.delete').forEach(b=>b.onclick=()=>{b.closest('.data-row').remove();section.querySelector('.row-count').textContent=section.querySelectorAll('.data-row').length+' rows';stale();});
}
function getRows(kind){const section=q(`[data-rows=${kind}]`);if(!section)return[];return[...section.querySelectorAll('.data-row')].map(r=>Object.fromEntries([...r.querySelectorAll('input')].map(n=>[n.dataset.key,n.type==='text'?n.value:Number(n.value)*(n.dataset.role==='length'?scale():n.dataset.role==='area'?scale()**2:1)])));}
function openingArea(){const s=q('[data-rows=openings]');if(!s||s.hidden)return 0;return getRows('openings').reduce((a,r)=>a+r.width*r.height*r.quantity,0);}
function nonnegative(x,message){if(x<0)throw Error(message);return x;}
function positive(...keys){for(const key of keys)if(val(key)<=0)throw Error('Enter a positive '+document.getElementById(key).closest('label').querySelector('span').textContent+'.');}
function validate(){
 const fields=qa('form input[type=number]').filter(n=>!n.closest('[hidden]'));
 for(const n of fields){if(!n.checkValidity()||!Number.isFinite(Number(n.value)))throw Error('Check numeric inputs: '+(n.getAttribute('aria-label')||n.closest('label').querySelector('span').textContent));if(['quantity','faces','coats','wallCount','perBox','spares','layerLimit','primerCoats','plasterFaces'].includes(n.id||n.dataset.key)&&!Number.isInteger(Number(n.value)))throw Error('Counts and coats must be whole numbers.');}
}
function brickwork(){
 positive('brickL','brickW','brickH','bag','density');
 let area,volume;
 if(mode==='Multiple Walls'){
  const rows=getRows('walls');if(!rows.length)throw Error('Add at least one wall.');
  area=0;volume=0;for(const r of rows){const a=nonnegative(r.length*r.height-r.deduction,'Wall deductions exceed its face area.')*r.quantity;area+=a;volume+=a*r.thickness/1000;}
 }else{area=(mode==='Room'?2*(val('length')+val('width'))*val('height'):val('length')*val('height'))-openingArea();volume=area*val('thickness')/1000;}
 if(area<=0)throw Error('Openings must be smaller than the measured wall area.');
 const j=val('joint'),solid=val('brickL')*val('brickW')*val('brickH')/1e9,module=(val('brickL')+j)*(val('brickW')+j)*(val('brickH')+j)/1e9;
 const net=volume/module,buy=ceil(net*(1+val('brickWaste')/100)),wet=volume-net*solid,wetOrder=wet*(1+val('mortarWaste')/100),dry=wetOrder*val('dryFactor'),cementKg=dry/(1+val('sandParts'))*val('density'),bags=cementKg/val('bag'),sand=dry*val('sandParts')/(1+val('sandParts'));
 const cost=buy*val('brickRate')+ceil(bags)*val('cementRate')+sand*val('sandRate')+area*val('labourRate'),plaster=area*val('plasterFaces');
 return{area,volume,net,buy,wet,wetOrder,dry,cementKg,bags,sand,cost,plaster,kpis:[kpi('Bricks to order',number(buy,0),'nos',number(net,0)+' net + '+val('brickWaste')+'% allowance'),kpi('Mortar · wet / dry',number(wetOrder,3)+' / '+number(dry,3),'m³','Separate '+val('mortarWaste')+'% mortar allowance'),kpi('Cement required',number(bags),'bags','Buy '+ceil(bags)+' × '+val('bag')+' kg'),kpi('Sand required',number(sand,3),'m³','Loose dry material estimate')],detail:`Net wall ${number(area)} m² · Masonry ${number(volume,3)} m³ · Actual brick ${val('brickL')}×${val('brickW')}×${val('brickH')} mm`,costNote:`Entered material/labour estimate ${money(cost)}${plaster?' · Optional plaster '+number(plaster)+' m² / '+number(plaster*val('plasterThickness')/1000,3)+' m³':''}`,badges:[number(area)+' m² net',number(volume,3)+' m³ masonry',val('joint')+' mm joints'],caption:mode==='Room'?'Room quantities use wall centreline dimensions. The wall artwork is illustrative.':'Actual brick size, nominal joint module and separate purchase allowances remain visible.'};
}
function concrete(){
 let net,section=choice('section'),count=val('quantity');
 if(mode==='Slab')net=val('length')*val('width')*val('depth')/1000*count;
 else if(mode==='Beam'||mode==='Footing')net=val('length')*val('width')*val('height')*count;
 else if(mode==='Column')net=(section==='Circular'?Math.PI*val('diameter')**2/4:val('width')*val('breadth'))*val('height')*count;
 else{let a=val('sectionArea');if(section==='Circular')a=Math.PI*val('width')**2/4;else if(section==='Triangular')a=val('width')*val('breadth')/2;else if(section==='Hollow circular'){if(val('breadth')>=val('width'))throw Error('Inner diameter must be smaller than outer diameter.');a=Math.PI*(val('width')**2-val('breadth')**2)/4;}net=a*val('height')*count;}
 net+=getRows('elements').reduce((a,r)=>a+r.length*r.width*r.depth*r.quantity,0);net-=val('displacement');
 if(net<=0)throw Error('Concrete volume must remain positive after displacement.');positive('bag','density','increment');
 const needed=net*(1+val('waste')/100),dry=needed*val('dryFactor'),parts=1+val('sandParts')+val('aggParts'),cementKg=dry/parts*val('density'),bags=cementKg/val('bag'),sand=dry*val('sandParts')/parts,aggregate=dry*val('aggParts')/parts,order=ceil(needed/val('increment'))*val('increment'),materialCost=ceil(bags)*val('cementRate')+sand*val('sandRate')+aggregate*val('aggregateRate'),cost=choice('mixMode').startsWith('Ready')?order*val('rate'):materialCost;
 const ready=choice('mixMode').startsWith('Ready');
 return{net,needed,dry,cementKg,bags,sand,aggregate,order,cost,kpis:ready?[kpi('Concrete · net',number(net,3),'m³','Before site allowance'),kpi('Required with allowance',number(needed,3),'m³',val('waste')+'% applied once'),kpi('Supplier order',number(order),'m³',val('increment')+' m³ increment'),kpi('Entered order cost',money(cost),'','Your rate '+money(val('rate'))+'/m³')]:[kpi('Concrete required',number(needed,3),'m³',number(net,3)+' m³ net + '+val('waste')+'%'),kpi('Cement estimate',number(bags),'bags','Buy '+ceil(bags)+' × '+val('bag')+' kg'),kpi('Sand estimate',number(sand,3),'m³','Nominal loose-volume split'),kpi('Aggregate estimate',number(aggregate,3),'m³','Not an engineered design mix')],detail:`${mode} · ${choice('grade')} (record only) · 1 : ${val('sandParts')} : ${val('aggParts')} nominal · Dry factor ${val('dryFactor')} · Ready-mix order ${number(order)} m³`,costNote:`Entered estimate ${money(cost)} · Bagged product alternative ${ceil(needed/val('bagYield'))} bags at entered yield`,badges:[number(net,3)+' m³ geometry',count+' '+mode.toLowerCase()+' element(s)',val('waste')+'% allowance'],caption:'Illustrative material view. Selected geometry, mix assumptions and supplier rounding are calculated independently.'};
}
function excavation(){
 const d=val('depth'),s=val('slope');let bank,top,base;
 if(mode==='Circular'){const r=val('diameter')/2,R=r+s*d;base=Math.PI*r*r;top=Math.PI*R*R;bank=Math.PI*d*(r*r+r*R+R*R)/3;}
 else if(mode==='Custom'){base=val('baseArea');top=val('topArea');bank=d*(base+4*val('midArea')+top)/6;}
 else if(mode==='Trench'){base=val('length')*val('width');top=val('length')*(val('width')+2*s*d);bank=d*(base+top)/2;}
 else{const slope=mode==='Sloped'?s:0;base=val('length')*val('width');top=(val('length')+2*slope*d)*(val('width')+2*slope*d);const mid=(val('length')+slope*d)*(val('width')+slope*d);bank=d*(base+4*mid+top)/6;}
 bank+=getRows('sections').reduce((a,r)=>a+r.length*r.width*r.depth*r.quantity,0);
 if(bank<=0)throw Error('Enter positive measured section dimensions.');if(val('retained')>bank)throw Error('Retained bank volume exceeds excavation.');positive('truck','payload','looseDensity','compaction');
 const loose=bank*(1+val('swell')/100),compacted=bank*val('compaction'),haul=(bank-val('retained'))*(1+val('swell')/100),effective=Math.min(val('truck'),val('payload')/val('looseDensity')),loads=ceil(haul/effective),borrow=Math.max(0,val('backfill')-val('retained')*val('compaction'))/val('compaction'),cost=loads*val('loadRate')+bank*val('digRate');
 return{bank,loose,compacted,haul,effective,loads,borrow,cost,kpis:[kpi('Excavation · bank',number(bank,3),'m³',mode+' measured geometry'),kpi('Loose material',number(loose,3),'m³',val('swell')+'% swell from bank'),kpi('Off-site disposal',number(haul,3),'m³',val('retained')+' m³ bank retained'),kpi('Truckloads',number(loads,0),'loads',number(effective)+' m³ effective / load')],detail:`Base ${number(base)} m² · Top ${number(top)} m² · Additional borrow ${number(borrow,3)} m³ bank`,costNote:`Entered excavation + haul ${money(cost)} · Compacted equivalent ${number(compacted)} m³`,badges:[number(d)+' m depth',mode,number(bank,3)+' m³ bank'],caption:'The slope illustration is a material-volume reference. It does not approve a batter, soil class or protective system.',flow:[['Bank',number(bank)+' m³'],['Loose',number(loose)+' m³'],['Compacted',number(compacted)+' m³']]};
}
function paint(){
 let walls=0,ceiling=0;
 if(mode==='Custom')walls=val('customArea');else if(mode==='Exterior Walls')walls=val('length')*val('height')*val('wallCount')-openingArea();else{ceiling=val('length')*val('width');if(mode!=='Ceiling')walls=2*(val('length')+val('width'))*val('height')-openingArea();if(mode==='Interior Walls')ceiling=0;}
 for(const r of getRows('rooms')){if(mode!=='Ceiling')walls+=nonnegative(2*(r.length+r.width)*r.height-r.deduction,'Room openings exceed its wall area.');if(['Ceiling','Both'].includes(mode))ceiling+=r.length*r.width;}
 if(walls<0||walls+ceiling<=0)throw Error('Deductions must be below the selected paintable area.');positive('coverage','primerCoverage','pack','primerPack');
 const area=walls+ceiling,paint=area*val('coats')/val('coverage')*(1+val('waste')/100),primer=area*val('primerCoats')/val('primerCoverage')*(1+val('waste')/100),paintTins=ceil(paint/val('pack')),primerTins=ceil(primer/val('primerPack')),cost=paintTins*val('pack')*val('paintRate')+primerTins*val('primerPack')*val('primerRate')+area*val('prepRate');
 return{walls,ceiling,area,paint,primer,paintTins,primerTins,cost,kpis:[kpi('Paintable area',number(area),'m²','Openings deducted once'),kpi('Finish required',number(paint),'L',val('coats')+' coats · '+val('coverage')+' m²/L/coat'),kpi('Primer required',number(primer),'L',val('primerCoats')+' coat(s) · own coverage'),kpi('Finish to purchase',number(paintTins*val('pack'),0),'L',paintTins+' × '+val('pack')+' L tins')],detail:`Walls ${number(walls)} m² + ceiling ${number(ceiling)} m² · Primer order ${primerTins} × ${val('primerPack')} L`,costNote:`Entered finish / primer / prep estimate ${money(cost)}`,badges:[number(walls)+' m² walls',number(ceiling)+' m² ceiling',val('coats')+' finish coats'],caption:'Product category and surface condition are explicit notes. Enter the manufacturer’s correct per-coat coverage basis.'};
}
function plaster(){
 let area;if(mode==='Custom')area=val('customArea');else if(mode==='Ceiling')area=val('length')*val('width');else if(mode==='Both')area=2*(val('length')+val('width'))*val('height')-openingArea()+val('length')*val('width');else area=(val('length')*val('height')-openingArea())*val('faces');
 if(area<=0)throw Error('Openings must be smaller than the selected surface.');
 area+=val('returns');for(const r of getRows('surfaces'))area+=nonnegative(r.length*r.height-r.deduction,'Surface deduction exceeds face area.')*r.faces;
 positive('bag','density');const factor=1+val('waste')/100;
 const layers=[[val('layer'),val('sandParts')],[val('secondLayer'),val('secondSand')]].filter(x=>x[0]>0).map(([thickness,sandParts])=>{const wet=area*thickness/1000*factor,dry=wet*val('dryFactor');return{thickness,sandParts,wet,dry,cementKg:dry/(1+sandParts)*val('density'),sand:dry*sandParts/(1+sandParts)};});
 const wet=layers.reduce((a,r)=>a+r.wet,0),dry=layers.reduce((a,r)=>a+r.dry,0),cementKg=layers.reduce((a,r)=>a+r.cementKg,0),sand=layers.reduce((a,r)=>a+r.sand,0),bags=cementKg/val('bag'),cost=ceil(bags)*val('cementRate')+sand*val('sandRate')+area*val('labourRate');
 return{area,wet,dry,cementKg,sand,bags,cost,layers,kpis:[kpi('Plaster area',number(area),'m²','Returns / surfaces included'),kpi('Wet / dry mortar',number(wet,3)+' / '+number(dry,3),'m³',val('waste')+'% mortar allowance'),kpi('Cement required',number(bags),'bags','Buy '+ceil(bags)+' × '+val('bag')+' kg'),kpi('Sand required',number(sand,3),'m³','Summed after per-layer split')],detail:layers.map(r=>`${r.thickness} mm · 1:${r.sandParts} → ${number(r.cementKg,1)} kg cement`).join(' | '),costNote:`Entered materials + labour ${money(cost)}`,badges:[number(area)+' m² finished',layers.map(x=>x.thickness).join(' + ')+' mm',layers.length+' layer(s)'],caption:'Layer thickness is exaggerated in the illustration. Different coat mixes are calculated separately.'};
}
function polygonArea(text){
 let points=text.split(';').filter(x=>x.trim()).map(x=>x.split(',').map(Number));if(points.length>2&&String(points[0])===String(points.at(-1)))points.pop();
 if(points.length<3||points.length>100||points.some(p=>p.length!==2||p.some(n=>!Number.isFinite(n))))throw Error('Use 3–100 finite polygon x,y points, separated by semicolons.');
 const cross=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
 for(let i=0;i<points.length;i++)for(let j=i+1;j<points.length;j++){if(j===i+1||i===0&&j===points.length-1)continue;const a=points[i],b=points[(i+1)%points.length],c=points[j],d=points[(j+1)%points.length];if(cross(a,b,c)*cross(a,b,d)<=0&&cross(c,d,a)*cross(c,d,b)<=0&&Math.max(Math.min(a[0],b[0]),Math.min(c[0],d[0]))<=Math.min(Math.max(a[0],b[0]),Math.max(c[0],d[0]))&&Math.max(Math.min(a[1],b[1]),Math.min(c[1],d[1]))<=Math.min(Math.max(a[1],b[1]),Math.max(c[1],d[1])))throw Error('Polygon edges intersect or overlap. Enter a simple boundary.');}
 const area=Math.abs(points.reduce((a,p,i)=>a+p[0]*points[(i+1)%points.length][1]-p[1]*points[(i+1)%points.length][0],0))/2*scale()**2;if(!area)throw Error('Polygon area must be positive.');return area;
}
function tileFlooring(){
 let area;if(mode==='L-shape'){if(val('cutL')>=val('length')||val('cutW')>=val('width'))throw Error('Notch dimensions must be smaller than the outer room.');area=val('length')*val('width')-val('cutL')*val('cutW');}else if(mode==='Multiple Areas')area=getRows('areas').reduce((a,r)=>a+nonnegative(r.length*r.width-r.deduction,'An area exclusion exceeds its gross area.')*r.quantity,0);else if(mode==='Custom Shape')area=q('#polygon').value.trim()?polygonArea(q('#polygon').value):val('customArea');else area=val('length')*val('width')-val('exclude');
 if(area<=0)throw Error('Net area must be positive.');positive('tileL','tileW','perBox','adhesivePack','groutPack','underlayPack');
 const adjusted=area*(1+val('waste')/100),tileArea=val('tileL')*val('tileW')/1e6,needed=ceil(adjusted/tileArea)+val('spares'),boxes=ceil(needed/val('perBox')),buy=boxes*val('perBox'),coverage=buy*tileArea,app=1+val('materialWaste')/100,adhesive=area*val('adhesive')*app,grout=(val('tileL')+val('tileW'))/(val('tileL')*val('tileW'))*val('tileDepth')*val('joint')*val('groutK')*area*app,underlay=area*(1+val('underlayWaste')/100),cost=boxes*val('boxRate')+area*val('labourRate');
 let border=0;if(val('borderWidth')>0){if(!['Rectangle','L-shape'].includes(mode))throw Error('Border-area measurement currently requires a rectangular outer room.');const b=val('borderWidth')/1000;if(b*2>=Math.min(val('length'),val('width')))throw Error('Border is wider than half the room.');border=val('length')*val('width')-(val('length')-2*b)*(val('width')-2*b);}
 return{area,adjusted,needed,boxes,buy,coverage,adhesive,grout,underlay,border,cost,kpis:[kpi('Net tiled area',number(area),'m²',choice('target')+' · '+mode),kpi('Tiles required',number(needed,0),'nos',val('waste')+'% cuts + '+val('spares')+' spares'),kpi('Boxes to order',number(boxes,0),'boxes',buy+' tiles · '+number(coverage)+' m²'),kpi('Entered purchase cost',money(cost),'','Tiles + entered installation')],detail:`Adhesive ${number(adhesive,1)} kg → ${ceil(adhesive/val('adhesivePack'))} bags · Grout ${number(grout)} kg → ${ceil(grout/val('groutPack'))} packs`,costNote:`Underlayment ${number(underlay)} m² → ${ceil(underlay/val('underlayPack'))} packs${border?' · Border area '+number(border)+' m² (separate material order)':''}`,badges:[val('tileL')+' × '+val('tileW')+' mm',val('joint')+' mm joint',choice('pattern')],caption:'Pattern and orientation are shown as an indicative layout. Cutting allowance is explicit; offcut optimization is not claimed.'};
}
function palletFor(r){
 const P=val('palletL')+2*val('overhang'),Q=val('palletW')+2*val('overhang');
 const L=r.length,W=r.width,H=r.height,weight=r.weight;
 if(Math.min(P,Q,L,W,H,weight)<=0)throw Error('Pallet and carton dimensions/weights must be positive.');
 const layers=Math.min(floor((val('maxHeight')-val('palletHeight'))/H),val('layerLimit')),weightCap=floor((val('grossLimit')-val('tare'))/weight),rotate=choice('rotation').startsWith('Allowed');
 if(layers<1||weightCap<1)throw Error('Height/gross weight limits leave no usable carton capacity.');
 const candidates=[];
 function candidate(a,b,firstRows,split){
  const firstNx=floor(P/a),secondNx=floor(P/b),remaining=Q-firstRows*b,secondRows=split?floor(remaining/a):0;
  const perLayer=firstRows*firstNx+secondRows*secondNx;if(!perLayer)return;
  if(perLayer>1000)throw Error('Reference layer bound is 1,000 cartons. Increase carton dimensions or reduce the measured footprint.');
  const positions=[];
  for(let y=0;y<firstRows;y++)for(let x=0;x<firstNx;x++)positions.push({x:x*a,y:y*b,l:a,w:b});
  for(let y=0;y<secondRows;y++)for(let x=0;x<secondNx;x++)positions.push({x:x*b,y:firstRows*b+y*a,l:b,w:a});
  candidates.push({name:split?'Split rows · '+firstRows+' / '+secondRows:(a===L?'0° upright grid':'90° upright grid'),perLayer,capacity:Math.min(perLayer*layers,weightCap),positions});
 }
 candidate(L,W,floor(Q/W),false);
 if(rotate){candidate(W,L,floor(Q/L),false);for(const[a,b]of[[L,W],[W,L]]){const n=floor(Q/b);if(n>500)throw Error('Reference split-row search bound exceeded.');for(let k=1;k<n;k++)candidate(a,b,k,true);}}
 if(!candidates.length)throw Error('No carton fits within the measured pallet footprint.');
 candidates.sort((a,b)=>b.capacity-a.capacity||b.perLayer-a.perLayer);
 const best=candidates[0],capacity=best.capacity,count=ceil(r.quantity/capacity),last=r.quantity-(count-1)*capacity,usedLayers=ceil(capacity/best.perLayer),height=usedLayers*H+val('palletHeight'),gross=capacity*weight+val('tare'),util=best.perLayer*L*W/(val('palletL')*val('palletW'))*100;
 return{...r,best,candidates:candidates.slice(0,8),capacity,count,last,layers:usedLayers,height,gross,util,P,Q};
}
function palletLoading(){
 let rows=mode==='Multiple Types'?getRows('cartons'):[Object.fromEntries(['length','width','height','quantity','weight'].map(k=>[k,val(k)]))];
 if(!rows.length)throw Error('Add at least one carton type.');
 const items=rows.map(palletFor),r=items[0],count=items.reduce((a,r)=>a+r.count,0),pieces=items.reduce((a,r)=>a+r.quantity,0);
 return{...r,items,count,pieces,kpis:[kpi('Cartons per layer',number(r.best.perLayer,0),'nos',r.best.name),kpi('Cartons / full pallet',number(r.capacity,0),'nos',r.layers+' layers · '+number(r.height,0)+' mm total'),kpi('Pallets for order',number(count,0),'pallets',mode==='Multiple Types'?'Separate pallets per SKU':pieces+' cartons · last pallet '+r.last),kpi('Full-pallet gross',number(r.gross,0),'kg',val('tare')+' kg pallet tare included')],detail:items.map((r,i)=>(r.name||'Carton '+(i+1))+': '+r.count+' pallets · last '+r.last+' cartons').join(' | '),costNote:`Selected layer footprint ${number(r.util,1)}% · ${r.best.name} · ${val('overhang')} mm allowed overhang`,badges:[number(val('palletL'),0)+' × '+number(val('palletW'),0)+' mm',number(r.height,0)+' mm loaded',r.capacity+' cartons / pallet'],caption:mode==='Multiple Types'?'Multiple Types uses dedicated pallets per SKU. The artwork is illustrative; the measured 2D layer below is the tested arrangement.':'The carton artwork is illustrative. The measured layer plan reflects the selected arrangement; stability and compression need a separate assessment.'};
}
function volumetricWeight(){
 positive('divisor','rounding');const rows=getRows('packages');if(!rows.length)throw Error('Add at least one package.');
 const unitWeight=choice('weightUnit')==='lb'?.45359237:1,step=val('rounding'),up=x=>ceil(x/step)*step,roundDims=choice('dimensionRound').startsWith('Up');
 const items=rows.map(r=>{const dims=[r.length,r.width,r.height].map(x=>roundDims?ceil(x):x),actual=r.weight*unitWeight,dim=dims.reduce((a,x)=>a*x,1)/val('divisor'),charged=Math.max(up(actual),up(dim),up(val('minimumKg')));return{...r,dims,actual,dim,charged,total:charged*r.quantity};});
 const actual=items.reduce((a,r)=>a+r.actual*r.quantity,0),dim=items.reduce((a,r)=>a+r.dim*r.quantity,0),charged=items.reduce((a,r)=>a+r.total,0),pieces=items.reduce((a,r)=>a+r.quantity,0),freight=Math.max(val('minimum'),charged*val('rate')),cost=freight+val('other');
 return{items,actual,dim,charged,pieces,freight,cost,kpis:[kpi('Chargeable weight',number(charged),'kg','Sum of per-package comparisons'),kpi('Actual weight',number(actual),'kg','All '+pieces+' packages'),kpi('Raw dimensional weight',number(dim),'kg','Before billing increments'),kpi('Entered quote estimate',money(cost),'','Your rate '+money(val('rate'))+'/charged kg')],detail:items.map(r=>r.name+' × '+r.quantity+': '+number(r.charged)+' kg each → '+number(r.total)+' kg').join(' | '),costNote:`Divisor ${val('divisor')} cm³/kg · ${step} kg per-piece increment · ${pieces} pieces`,badges:[number(items[0].length)+' × '+number(items[0].width)+' × '+number(items[0].height)+' cm','Actual '+number(items[0].actual)+' kg','DIM '+number(items[0].dim)+' kg'],caption:'Each package is compared before multiplying quantity. No live rates, automatic surcharges or universal carrier acceptance are implied.'};
}
const calculators={brickwork,concrete,excavation,paint,plaster,'tile-flooring':tileFlooring,'pallet-loading':palletLoading,'volumetric-weight':volumetricWeight};
function smallLayer(r){
 const P=r.P,Q=r.Q,max=116,ratio=Math.min(max/P,48/Q),width=P*ratio,height=Q*ratio;
 const boxes=r.best.positions.map(p=>`<rect x="${p.x*ratio+2}" y="${p.y*ratio+2}" width="${p.l*ratio-.6}" height="${p.w*ratio-.6}" rx=".5" fill="#eed0a4" stroke="#ad8655" stroke-width=".5"/>`).join('');
 return `<div class="layer-plan"><svg viewBox="0 0 122 54" role="img" aria-label="Measured selected pallet layer, ${r.best.perLayer} cartons"><rect x="2" y="2" width="${width}" height="${height}" fill="#e7f0fb" stroke="#37618e"/>${boxes}</svg><span><b>${r.best.perLayer} cartons / layer · ${r.layers} layers</b><br>${escapeText(r.best.name)} · compare ${r.candidates.slice(0,3).map(x=>x.perLayer).join(' / ')} cartons per tested layer</span></div>`;
}
function tilePlan(){
 const diagonal=choice('pattern')==='Diagonal',brick=choice('pattern')==='Brick bond',vertical=choice('orientation')==='Width along room';let lines='';
 for(let y=0;y<5;y++)for(let x=0;x<8;x++)lines+=`<rect x="${x*14+(brick&&y%2?7:0)}" y="${y*9}" width="14" height="9" fill="${x===7||y===4?'#ffe5a2':'#e1edf9'}" stroke="#94adc9" stroke-width=".4"/>`;
 if(choice('pattern')==='Herringbone'){lines='';for(let y=-4;y<7;y++)for(let x=-5;x<8;x++){const dx=x*18+y*9,dy=y*9-x*2;lines+=`<g transform="translate(${dx} ${dy}) rotate(-45)"><rect width="18" height="9" fill="#d6e6f6" stroke="#8aa5c2" stroke-width=".5"/><rect x="18" width="9" height="18" fill="#e8d9bb" stroke="#8aa5c2" stroke-width=".5"/></g>`;}}
 if(choice('pattern')==='Border + field')lines+='<rect x="1" y="1" width="110" height="43" fill="none" stroke="#e8c36c" stroke-width="5"/>';
 return `<div class="layer-plan"><svg viewBox="0 0 122 54" role="img" aria-label="Illustrative ${escapeText(choice('pattern'))} tile layout, not a cutting plan"><defs><clipPath id="tile-clip"><rect width="112" height="45" x="3" y="3"/></clipPath></defs><g clip-path="url(#tile-clip)"><g transform="translate(3 3) ${diagonal?'rotate(45 56 22) scale(1.5)':''}${vertical?'rotate(90 56 22)':''}">${lines}</g></g><rect x="3" y="3" width="112" height="45" fill="none" stroke="#54789f"/></svg><span><b>${escapeText(choice('pattern'))} · ${escapeText(choice('orientation'))}</b><br>Layout illustration; enter the cutting allowance and verify the installer’s actual plan.</span></div>`;
}
function render(r){
 q('.kpis').innerHTML=r.kpis.map(n=>`<div class="kpi${n.money?' money':''}"><span class="name">${escapeText(n.name)}</span><strong>${escapeText(n.value)} <small>${escapeText(n.unit)}</small></strong><em>${escapeText(n.note)}</em></div>`).join('');
 q('.result-detail').textContent=r.detail;q('.result-cost').textContent='';renderPricing(r);
 let dimensions=r.badges;
 if(cfg.id==='brickwork')dimensions=mode==='Multiple Walls'?['Per-wall dimensions in schedule',number(r.area)+' m² net',val('joint')+' mm joint']:['L '+number(val('length'))+' m','H '+number(val('height'))+' m','t '+number(val('thickness'),0)+' mm'];
 if(cfg.id==='concrete')dimensions=mode==='Slab'?['L '+number(val('length'))+' m','W '+number(val('width'))+' m','t '+number(val('depth'),0)+' mm']:mode==='Column'?[(choice('section')==='Circular'?'Ø '+number(val('diameter')):'Section '+number(val('width'))+'×'+number(val('breadth')))+' m','H '+number(val('height'))+' m',val('quantity')+' columns']:mode==='Custom'?['Custom cross section','Run '+number(val('height'))+' m',number(r.net,3)+' m³ net']:['L '+number(val('length'))+' m','W '+number(val('width'))+' m','D '+number(val('height'))+' m'];
 if(cfg.id==='excavation')dimensions=mode==='Circular'?['Ø '+number(val('diameter'))+' m','D '+number(val('depth'))+' m',mode]:mode==='Custom'?['Base '+number(val('baseArea'))+' m²','Top '+number(val('topArea'))+' m²','D '+number(val('depth'))+' m']:['L '+number(val('length'))+' m','W '+number(val('width'))+' m','D '+number(val('depth'))+' m'];
 if(cfg.id==='paint')dimensions=mode==='Custom'?[number(r.area)+' m² measured']:['L '+number(val('length'))+' m',mode==='Exterior Walls'?'H '+number(val('height'))+' m':'W '+number(val('width'))+' m',mode==='Ceiling'?'Ceiling only':'H '+number(val('height'))+' m'];
 if(cfg.id==='plaster')dimensions=mode==='Custom'?[number(r.area)+' m² finished',val('layer')+' mm coat']:['L '+number(val('length'))+' m',mode==='Wall'?'H '+number(val('height'))+' m':'W '+number(val('width'))+' m',val('layer')+' mm first coat'];
 if(cfg.id==='tile-flooring')dimensions=['Rectangle','L-shape'].includes(mode)?['L '+number(val('length'))+' m','W '+number(val('width'))+' m',val('tileL')+'×'+val('tileW')+' mm tile']:[number(r.area)+' m² net',mode,val('tileL')+'×'+val('tileW')+' mm tile'];
 q('.dimension-badges').innerHTML=dimensions.map(s=>'<span>'+escapeText(s)+'</span>').join('');q('.visual-caption').textContent=r.caption;
 let visual='';
 if(r.flow)visual='<div class="flow">'+r.flow.map(([a,b])=>'<span>'+escapeText(a)+'<b>'+escapeText(b)+'</b></span>').join('<span aria-hidden="true">→</span>')+'</div>';
 if(cfg.id==='pallet-loading')visual=smallLayer(r);
 if(cfg.id==='tile-flooring')visual=tilePlan();
 if(cfg.id==='volumetric-weight'){const a=r.items[0],maximum=Math.max(a.actual,a.dim,1);visual=`<div class="weight-bars"><span>Actual · A</span><i><b class="actual" style="width:${a.actual/maximum*100}%"></b></i><strong>${number(a.actual,1)} kg</strong><span>DIM · A</span><i><b style="width:${a.dim/maximum*100}%"></b></i><strong>${number(a.dim,1)} kg</strong></div>`;}
 q('.visual-extra').innerHTML=visual;q('.results').dataset.stale='false';q('.status').textContent='✓ Calculated';q('.copy').disabled=false;q('.print').disabled=false;window.lastResult=r;
}
function calculate(){
 try{validate();const result=applyPricing(calculators[cfg.id]());for(const v of Object.values(result))if(typeof v==='number'&&!Number.isFinite(v))throw Error('Input exceeds the bounded reference range.');render(result);q('.validation').hidden=true;return result;}
 catch(e){q('.validation').hidden=false;q('.validation').textContent=e.message;q('.status').textContent='Check inputs';q('.results').dataset.stale='true';q('.copy').disabled=true;q('.print').disabled=true;return null;}
}
function stale(){q('.pricing-total').textContent='Recalculate';q('.pricing').dataset.stale='true';q('.results').dataset.stale='true';q('.status').textContent='Inputs changed';q('.copy').disabled=true;q('.print').disabled=true;}
function saveMode(){modeValues[mode]={};qa('.dimensions input,.dimensions select').forEach(n=>modeValues[mode][n.id]=n.value);}
qa('[data-mode]').forEach(b=>b.onclick=()=>{saveMode();mode=b.dataset.mode;updateMode();if(cfg.id==='volumetric-weight')q('#divisor').value=mode==='Air Freight'?6000:5000;stale();});
for(const section of qa('[data-rows]')){
 const kind=section.dataset.rows,def=rowDefs[kind];renderRows(section,def.data);
 section.querySelector('.add-row').onclick=()=>{const all=[...section.querySelectorAll('.data-row')].map(r=>[...r.querySelectorAll('input')].map(n=>n.value));if(all.length>=50)return;let row=all.at(-1)||def.data[0];if(!row){const defaults={elements:['Element',2,1,.4,1],sections:['Section',2,1,1,1],rooms:['Room',4,3,2.8,1],surfaces:['Surface',4,3,1,1]};row=defaults[kind];}all.push([...row]);renderRows(section,all);section.querySelector('.data-row:last-child input').focus();stale();};
}
form.addEventListener('submit',e=>{e.preventDefault();calculate();});form.addEventListener('input',stale);form.addEventListener('change',e=>{if(e.target.id==='section')updateSection();stale();});
q('#unit').onchange=e=>{const ratio=factors[previousUnit]/factors[e.target.value];qa('input[data-role=length],input[data-role=area]').forEach(n=>n.value=String(Number((Number(n.value)*ratio**(n.dataset.role==='area'?2:1)).toPrecision(12))));for(const [m,values]of Object.entries(modeValues)){for(const f of cfg.dimensions[m])if(f.role&&values[f.key]!==undefined)values[f.key]=Number(values[f.key])*ratio**(f.role==='area'?2:1);}if(q('#polygon')?.value.trim()){const pts=q('#polygon').value.split(';').map(p=>p.split(',').map(Number));if(pts.every(p=>p.length===2&&p.every(Number.isFinite)))q('#polygon').value=pts.map(p=>p.map(x=>Number((x*ratio).toPrecision(12))).join(',')).join('; ');}previousUnit=e.target.value;updateUnits();stale();};
q('#brickPreset')?.addEventListener('change',e=>{const dims=e.target.selectedIndex===0?[190,90,90]:[215,102.5,65];if(e.target.selectedIndex<2)['brickL','brickW','brickH'].forEach((id,i)=>q('#'+id).value=dims[i]);stale();});
q('#mix')?.addEventListener('change',e=>{if(e.target.selectedIndex<2){q('#sandParts').value=e.target.selectedIndex===0?1.5:2;q('#aggParts').value=e.target.selectedIndex===0?3:4;}stale();});
q('#palletPreset')?.addEventListener('change',e=>{const dims=[[1200,800],[1219.2,1016],[1200,1000]][e.target.selectedIndex];if(dims){q('#palletL').value=dims[0]/scale();q('#palletW').value=dims[1]/scale();}stale();});
q('#weightUnit')?.addEventListener('change',e=>{const ratio=previousWeight==='kg'?1/.45359237:.45359237;qa('[data-rows=packages] input[data-key=weight]').forEach(n=>n.value=Number((Number(n.value)*ratio).toPrecision(12)));previousWeight=e.target.value;stale();});
q('#soil')?.addEventListener('change',e=>{if(e.target.selectedIndex){q('#swell').value=e.target.selectedIndex===1?20:30;q('#looseDensity').value=e.target.selectedIndex===1?1.6:1.5;}stale();});
q('#service')?.addEventListener('change',e=>{if(e.target.selectedIndex===1)q('#divisor').value=5000;stale();});
q('.reset').onclick=()=>location.reload();
q('.copy').onclick=async()=>{if(q('.results').dataset.stale==='true')return;const r=window.lastResult,text=cfg.title+' · '+mode+'\n'+r.kpis.map(n=>n.name+': '+n.value+' '+n.unit).join('\n')+'\n'+r.detail+'\n'+pricingSummary(r)+'\n'+cfg.warning;try{await navigator.clipboard.writeText(text);q('.copy-status').textContent='Current summary copied.';}catch{q('.copy-status').textContent='Clipboard unavailable; use Print / Save PDF.';}};
q('.print').onclick=()=>window.print();
updateMode();setupPricing();calculate();window.referenceCalculator={calculate,config:cfg,getMode:()=>mode,getRows,palletFor,polygonArea};
