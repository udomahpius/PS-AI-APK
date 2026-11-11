const {Product,Sale,Expense}=require('./models');
const rng=q=>{const d={};if(q.from)d.$gte=new Date(q.from);if(q.to)d.$lte=new Date(q.to);return Object.keys(d).length?{date:d}:{};};
// Net sales = qty*price - discount. COGS = qty * product-master unit cost. GP = net - COGS. Margin = GP/net when net>0.
exports.compute=async(orgId,q={})=>{
 const [prods,sales,exps]=await Promise.all([Product.find({orgId}).lean(),Sale.find({orgId,...rng(q)}).lean(),Expense.find({orgId,...rng(q)}).lean()]);
 const cost=Object.fromEntries(prods.map(p=>[p.sku,p.cost||0])),by={};let rev=0,cogs=0;
 for(const s of sales){const net=s.qty*s.price-(s.discount||0),c=s.qty*(cost[s.sku]||0);rev+=net;cogs+=c;
  const b=by[s.sku]??={sku:s.sku,qty:0,revenue:0,cogs:0};b.qty+=s.qty;b.revenue+=net;b.cogs+=c;}
 const products=Object.values(by).map(b=>({...b,gp:b.revenue-b.cogs,margin:b.revenue>0?(b.revenue-b.cogs)/b.revenue:null,name:prods.find(p=>p.sku===b.sku)?.name||b.sku})).sort((a,b)=>(a.margin??9)-(b.margin??9));
 const expenses=exps.reduce((a,e)=>a+e.amount,0),ec={};exps.forEach(e=>ec[e.category]=(ec[e.category]||0)+e.amount);
 const ts=sales.map(s=>+s.date),days=ts.length?Math.max(1,(Math.max(...ts)-Math.min(...ts))/864e5):30;
 const inventory=prods.map(p=>{const sold=by[p.sku]?.qty||0,daily=sold/days;return{sku:p.sku,name:p.name,stock:p.stock,value:(p.stock||0)*(p.cost||0),daily:+daily.toFixed(2),daysCover:daily>0?+(p.stock/daily).toFixed(1):null,deadStock:sold===0&&p.stock>0,stockoutRisk:daily>0&&p.stock/daily<7};});
 return{meta:{currency:'NGN',period:{from:q.from||'all',to:q.to||'all'},costMethod:'Unit cost from product master',generatedAt:new Date(),operatingResultNote:'Revenue − COGS − recorded expenses; not statutory net profit.'},
  overview:{revenue:rev,cogs,grossProfit:rev-cogs,grossMargin:rev>0?(rev-cogs)/rev:null,expenses,operatingResult:rev-cogs-expenses},products,inventory,expenseByCategory:ec};};

// Extra, deterministic series for charts/insights. Same definitions as compute().
exports.extra=async(orgId,q={})=>{
 const [prods,sales,counts]=await Promise.all([Product.find({orgId}).lean(),Sale.find({orgId,...rng(q)}).lean(),Promise.all([Product.countDocuments({orgId}),Sale.countDocuments({orgId}),Expense.countDocuments({orgId})])]);
 const info=Object.fromEntries(prods.map(p=>[p.sku,p])),day={},cat={},refs=new Set();let lines=0;
 for(const s of sales){const p=info[s.sku]||{},net=s.qty*s.price-(s.discount||0),gp=net-s.qty*(p.cost||0),k=s.date.toISOString().slice(0,10);
  const d=day[k]??={date:k,revenue:0,gp:0};d.revenue+=net;d.gp+=gp;const c=cat[p.category||'Other']??={name:p.category||'Other',revenue:0,gp:0};c.revenue+=net;c.gp+=gp;
  s.ref?refs.add(s.ref):lines++;}
 const baskets=refs.size+lines,rev=Object.values(day).reduce((x,d)=>x+d.revenue,0),gp=Object.values(day).reduce((x,d)=>x+d.gp,0),cogs=rev-gp;
 const invValue=prods.reduce((x,p)=>x+(p.stock||0)*(p.cost||0),0);
 return{daily:Object.values(day).sort((a,b)=>a.date<b.date?-1:1),categories:Object.values(cat).sort((a,b)=>b.revenue-a.revenue),
  counts:{products:counts[0],sales:counts[1],expenses:counts[2]},kpis:{atv:baskets?rev/baskets:null,transactions:baskets,inventoryValue:invValue,gmroi:invValue?gp/invValue:null,turnover:invValue?cogs/invValue:null},
  lastSale:sales.length?new Date(Math.max(...sales.map(s=>+s.date))):null};};
