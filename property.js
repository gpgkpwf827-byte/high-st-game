/* Stage 10A.1: physical condition replaces vacancy-age deterioration.
   Property condition is independent from business financial health. */
const PROPERTY_COSTS=Object.freeze({base:11000,conditionCoefficient:180,ratesCoefficient:18});
const APPLICANT_WORKS=Object.freeze({'Pub':11500,'Restaurant':17000,'Takeaway':8500,'Café':6500,'Florist':1500,'Gift shop':1200,'Greengrocer':4500,'Clothing shop':2500});
const PROPERTY_BANDS=Object.freeze([{minimum:85,name:'Excellent'},{minimum:65,name:'Good'},{minimum:40,name:'Fair'},{minimum:15,name:'Poor'},{minimum:0,name:'Derelict'}]);
const LANDLORD_DECAY=Object.freeze({responsible:2,average:4,neglectful:6});
function vacancyStart(state,id){const closures=(state.closed||[]).filter(x=>x.id===id);return closures.length?closures[closures.length-1].month+1:1;}
function monthsVacant(state,id){return Math.max(0,state.month-vacancyStart(state,id));}
function conditionScore(state,id){return Math.max(0,Math.min(100,Number(state.propertyConditions?.[id]?.condition??75)));}
function conditionBand(score){return PROPERTY_BANDS.find(b=>score>=b.minimum).name;}
function premiseCondition(state,id){const band=conditionBand(conditionScore(state,id));return band==='Excellent'?'Good':band==='Derelict'?'Poor':band;}
function tenantFitoutCost(state,id,applicantIndex){
 const p=currentPremise(state,id);
 if(!p||p.occupied)throw Error('Fit-out costs require a vacant unit.');
 const template=TENANT_TEMPLATES[applicantIndex];if(!template)throw Error('Invalid applicant.');
 const conditionWorks=(100-conditionScore(state,id))*PROPERTY_COSTS.conditionCoefficient;
 const amount=PROPERTY_COSTS.base+conditionWorks+template.finance.monthlyBusinessRates*PROPERTY_COSTS.ratesCoefficient+(APPLICANT_WORKS[template.type]||2000);
 return Math.round(amount/500)*500;
}
function actionBlockReason(state,cost,points=1){
 const reasons=[];
 if(challengeFinished(state))reasons.push('The challenge has finished.');
 else {if(actionsRemaining(state)<points)reasons.push('Insufficient capacity: '+actionsRemaining(state)+' of '+points+' required Action Points available.');if(state.councilBudget<cost)reasons.push('Insufficient funds: '+currency(state.councilBudget)+' available, '+currency(cost)+' required.');}
 return reasons.join(' ');
}
