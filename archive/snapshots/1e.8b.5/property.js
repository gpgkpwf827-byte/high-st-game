/* Stage 6C: deterministic vacancy condition and applicant requirements. */
const PROPERTY_COSTS=Object.freeze({base:11000,perVacantMonth:950,maxAge:18,ratesCoefficient:18});
const APPLICANT_WORKS=Object.freeze({'Pub':11500,'Restaurant':17000,'Takeaway':8500,'Café':6500,'Florist':1500,'Gift shop':1200,'Greengrocer':4500,'Clothing shop':2500});
function vacancyStart(state,id){
 const closures=(state.closed||[]).filter(x=>x.id===id);
 return closures.length?closures[closures.length-1].month+1:1;
}
function monthsVacant(state,id){return Math.max(0,state.month-vacancyStart(state,id));}
function premiseCondition(state,id){
 const age=monthsVacant(state,id);
 return age>=9?'Poor':age>=4?'Fair':'Good';
}
function tenantFitoutCost(state,id,applicantIndex){
 const p=currentPremise(state,id);
 if(!p||p.occupied)throw Error('Fit-out costs require a vacant unit.');
 const template=TENANT_TEMPLATES[applicantIndex];
 if(!template)throw Error('Invalid applicant.');
 const age=Math.min(PROPERTY_COSTS.maxAge,monthsVacant(state,id));
 const amount=PROPERTY_COSTS.base+age*PROPERTY_COSTS.perVacantMonth+template.finance.monthlyBusinessRates*PROPERTY_COSTS.ratesCoefficient+(APPLICANT_WORKS[template.type]||2000);
 return Math.round(amount/500)*500;
}
function actionBlockReason(state,cost,points=1){
 const reasons=[];
 if(challengeFinished(state))reasons.push('The challenge has finished.');
 else {if(actionsRemaining(state)<points)reasons.push('Insufficient capacity: '+actionsRemaining(state)+' of '+points+' required Action Points available.');
 if(state.councilBudget<cost)reasons.push('Insufficient funds: '+currency(state.councilBudget)+' available, '+currency(cost)+' required.');}
 return reasons.join(' ');
}
