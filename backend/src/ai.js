exports.ask=async(question,facts)=>{
 if(!process.env.ANTHROPIC_API_KEY){const q=question.toLowerCase(),o=facts.overview;
  if(/margin/.test(q))return'Lowest-margin products: '+facts.products.slice(0,5).map(p=>`${p.name} (${p.margin==null?'n/a':(p.margin*100).toFixed(1)+'%'})`).join(', ');
  if(/not sold|dead|slow/.test(q))return'Dead stock (no sales in period): '+(facts.inventory.filter(i=>i.deadStock).map(i=>i.name).join(', ')||'none');
  if(/expense/.test(q))return'Expenses by category: '+JSON.stringify(facts.expenseByCategory);
  return`Revenue ${o.revenue}, gross profit ${o.grossProfit}, expenses ${o.expenses}, operating result ${o.operatingResult} (${facts.meta.currency}).`;}
 const r=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'x-api-key':process.env.ANTHROPIC_API_KEY,'anthropic-version':'2023-06-01','content-type':'application/json'},
  body:JSON.stringify({model:'claude-sonnet-4-6',max_tokens:800,system:'You are a retail business analyst. Answer ONLY from the provided JSON facts. State period, currency and definitions. If data is missing, say so. Recommendations are advisory. Never do your own accounting arithmetic.',messages:[{role:'user',content:`FACTS:\n${JSON.stringify(facts).slice(0,60000)}\n\nQUESTION: ${question}`}]})});
 const j=await r.json();return j.content?.map(c=>c.text).join('')||'AI unavailable.';};
