/* 1E Stage 2 — town-wide metrics and category sensitivity. No DOM or local storage. */
const ECONOMY=Object.freeze({footfall:7500,spendingPower:38,attractiveness:32,baselineVitality:0,monthlyUnderlyingFootfallDecline:.01});
const CATEGORY_SENSITIVITY=Object.freeze({
 'Bakery':[1.2,.5,.6], 'Café':[1.2,.8,1], 'Convenience store':[.7,.3,.3],
 'Pharmacy':[.4,.2,.2], 'Charity shop':[.8,.5,.5], 'Hairdresser':[.5,.8,.7],
 'Independent bookshop':[1,1.2,1],
 'Florist':[1,1.1,1.1], 'Gift shop':[1.1,1.2,1.1], 'Greengrocer':[.9,.5,.5],
 'Pub':[1.1,.9,.9], 'Restaurant':[1.1,1.2,1.2]
});
const clamp=(x,min,max)=>Math.min(max,Math.max(min,x));
function businessHealth(p,cash,rateBand='standard',latest=null){
 const f=p.finance;if(!p.occupied||!f)return 0;
 const revenue=latest?latest.revenue:f.transactions*f.averageSale;
 const cost=latest?latest.totalExpenses:f.rent+f.wages+f.otherCosts+calculateMonthlyBusinessRates(p,rateBand);
 const margin=revenue? (revenue-cost)/revenue : -.25;
 const profitScore=clamp(50+200*margin,0,100);
 const cashScore=clamp(cash/(cost*3)*100,0,100);
 return .5*profitScore+.5*cashScore;
}
function commercialVitality(state){
 const occupied=occupiedPremises(state),count=occupied.length;
 const occupancy=count/PREMISES.length*100;
 // Scale against full street capacity, preventing seven varied traders from scoring 100 diversity automatically.
 const diversity=new Set(occupied.map(p=>p.type)).size/PREMISES.length*100;
 const health=count?occupied.reduce((sum,p)=>sum+businessHealth(p,state.cashByPremise[p.id]||0,state.ratesBand||'standard',(state.latestResults||[]).find(r=>r.premiseId===p.id)),0)/count:0;
 return {occupancy,diversity,health,score:clamp(.4*occupancy+.25*diversity+.35*health,0,100)};
}
function townMetrics(state){
 const vitality=commercialVitality(state);
 const neutral=state.startingVitality??vitality.score;
 const delta=vitality.score-neutral;
 const baseFootfall=ECONOMY.footfall*Math.max(.65,1-ECONOMY.monthlyUnderlyingFootfallDecline*(state.month-1));
 const cp=(typeof councilPolicies==='function'?councilPolicies(state):{cleaning:'basic',lighting:'basic'});
 const clean=(typeof SERVICES!=='undefined'?SERVICES.cleaning[cp.cleaning]:{attractiveness:0});
 const light=(typeof SERVICES!=='undefined'?SERVICES.lighting[cp.lighting]:{attractiveness:0,footfall:0});
 const transport=(typeof TRANSPORT!=='undefined'&&state.transportChoice)?TRANSPORT[state.transportChoice]:null;
 const marketing=(state.marketingUntil||0)>=state.month?(typeof MARKETING!=='undefined'?MARKETING.footfall:0):0;
 const strategic=typeof opportunityEffects==='function'?opportunityEffects(state,state.month):{footfall:0,attractiveness:0};
 const footfall=Math.round(Math.max(0,baseFootfall*(1+delta*.008+(light.footfall||0)+(transport?.footfall||0)+marketing+strategic.footfall)));
 const attractiveness=clamp(ECONOMY.attractiveness+delta*.2+clean.attractiveness+light.attractiveness+(transport?.attractiveness||0)+strategic.attractiveness,0,100);
 return {footfall,spendingPower:spendingIndex(currentLocalEconomy(state)),attractiveness,vitality:vitality.score,
  occupancyScore:vitality.occupancy,diversityScore:vitality.diversity,businessHealth:vitality.health,baselineVitality:neutral};
}
function categoryEconomyFactors(type,metrics){
 const [foot,spend,attract]=CATEGORY_SENSITIVITY[type]||[.8,.7,.7];
 const footEffect=(metrics.footfall/ECONOMY.footfall-1)*foot;
 const attractEffect=((metrics.attractiveness-ECONOMY.attractiveness)/5)*.1*attract;
 const spendEffect=((metrics.spendingPower-ECONOMY.spendingPower)/5)*.1*spend;
 return {transactionFactor:clamp(1+footEffect+attractEffect,.2,2.5),saleFactor:clamp(1+spendEffect,.3,2.5)};
}
