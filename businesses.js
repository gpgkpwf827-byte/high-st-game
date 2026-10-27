/* Stage 3: transparent business distress and seeded rare shocks. Simulation only. */
const BUSINESS_RISK=Object.freeze({distressMonths:3,distressRunway:1,distressExitChance:.08,unexpectedExitChance:.001});
// Deterministic fractional draw per game seed/month/shop/kind. No uncontrolled Math.random().
function riskDraw(seed,month,id,kind){
 let x=(seed ^ Math.imul(month,2654435761) ^ Math.imul(id,1597334677) ^ Math.imul(kind,2246822519))>>>0;
 x=Math.imul(x^(x>>>16),2246822507)>>>0;x=Math.imul(x^(x>>>13),3266489909)>>>0;
 return ((x^(x>>>16))>>>0)/4294967296;
}
function businessRiskStatus(p,cash,rateBand='standard',latest=null,lossStreak=0){
 if(!p.occupied)return {name:'Vacant',health:0,runway:0,lossStreak:0};
 const costs=latest?.totalExpenses??(p.finance.rent+p.finance.wages+p.finance.otherCosts+calculateMonthlyBusinessRates(p,rateBand));
 const revenue=latest?.revenue??(p.finance.transactions*p.finance.averageSale);
 const runway=costs>0?Math.max(0,cash)/costs:3;
 const health=businessHealth(p,cash,rateBand,latest);
 const margin=revenue>0?(revenue-costs)/revenue:-1;
 const name=cash<=0?'Critical':(runway<1||lossStreak>=3||health<35)?'Critical':(margin<0||runway<2||health<55)?'Struggling':'Stable';
 return {name,health,runway,lossStreak,margin};
}
function evaluateExit(p,r,state,streak){
 if(r.closingCash<=0)return 'insolvency';
 const seed=state.riskSeed??81773;
 if(streak>=BUSINESS_RISK.distressMonths && r.closingCash<r.totalExpenses*BUSINESS_RISK.distressRunway && riskDraw(seed,state.month,p.id,1)<BUSINESS_RISK.distressExitChance)return 'financial distress';
 if(riskDraw(seed,state.month,p.id,2)<BUSINESS_RISK.unexpectedExitChance)return 'unexpected owner departure';
 return null;
}
