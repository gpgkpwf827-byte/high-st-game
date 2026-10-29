/* Council choices: transparent fictional numbers for balancing, not UK policy advice. */
const SERVICES=Object.freeze({
 cleaning:Object.freeze({basic:{cost:0,attractiveness:0},standard:{cost:1100,attractiveness:2},enhanced:{cost:2500,attractiveness:5}}),
 lighting:Object.freeze({basic:{cost:0,attractiveness:0,footfall:0},improved:{cost:850,attractiveness:2,footfall:.02},extended:{cost:2100,attractiveness:4,footfall:.05}})
});
const TRANSPORT=Object.freeze({bus:{name:'Improved bus connections',cost:65000,footfall:.22,attractiveness:1},parking:{name:'Free town parking',cost:45000,footfall:.17,attractiveness:0}});
const MARKETING=Object.freeze({cost:5000,footfall:.08,duration:2});
function councilPolicies(state){return state.councilPolicies||{cleaning:'basic',lighting:'basic'};}
function serviceCosts(state){const p=councilPolicies(state);return SERVICES.cleaning[p.cleaning].cost+SERVICES.lighting[p.lighting].cost;}
function changeService(state,service,level){
 if(challengeFinished(state))throw Error('Challenge complete.');
 if(!Object.hasOwn(SERVICES,service)||!Object.hasOwn(SERVICES[service],level))throw Error('Unknown council service level.');
 return {...state,councilPolicies:{...councilPolicies(state),[service]:level}};
}
function chooseTransport(state,choice){
 if(challengeFinished(state))throw Error('Challenge complete.');
 if(state.transportChoice)throw Error('Transport investment already selected.');
 const p=TRANSPORT[choice];if(!p)throw Error('Invalid transport option.');
 if(state.councilBudget<p.cost)throw Error('Insufficient council funds.');
 return {...state,councilBudget:state.councilBudget-p.cost,transportChoice:choice};
}
function startMarketing(state){
 if(challengeFinished(state))throw Error('Challenge complete.');
 if(state.councilBudget<MARKETING.cost)throw Error('Insufficient council funds.');
 if((state.marketingUntil||0)>=state.month)throw Error('Campaign already active.');
 return {...state,councilBudget:state.councilBudget-MARKETING.cost,marketingUntil:state.month+MARKETING.duration-1};
}
function projectedCouncil(state){
 const nextBand=state.nextRatesBand||state.ratesBand||'standard';
 const receipts=occupiedPremises(state).reduce((s,p)=>s+calculateMonthlyBusinessRates(p,nextBand),0);
 const expense=serviceCosts(state);
 return {receipts,expense,net:receipts-expense};
}
