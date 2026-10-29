/* Repeatable low-frequency town developments; no forced decisions. */
const TOWN_DEVELOPMENTS=Object.freeze([
 {title:'Quiet month — no major developments',footfall:0,spendingPower:0},
 {title:'Local employer recruitment improves daytime trade',footfall:.06,spendingPower:1},
 {title:'Roadworks disrupt town-centre access',footfall:-.08,spendingPower:0},
 {title:'Regional tourism coverage attracts visitors',footfall:.07,spendingPower:0},
 {title:'Household budgets come under pressure',footfall:0,spendingPower:-2},
 {title:'Community arts weekend attracts shoppers',footfall:.05,spendingPower:0},
 {title:'Severe weather reduces visits',footfall:-.10,spendingPower:0}
]);
function monthlyDevelopment(state){
 // deterministic based on month and seed; roughly every other month has a development.
 const seed=(state.riskSeed||81773)>>>0;
 const month=state.month;
 const n=(Math.imul(seed^(month*977),1664525)+1013904223)>>>0;
 if(n%3===0)return TOWN_DEVELOPMENTS[0];
 return TOWN_DEVELOPMENTS[1+(n%6)];
}
