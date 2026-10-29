/* Stage 7A: persistent local household economy, independent from council controls. */
const LOCAL_ECONOMY=Object.freeze({employment:40,earnings:42,livingCosts:70});
function spendingIndex(e){return Math.round(clamp(.4*e.employment+.3*e.earnings+.3*(100-e.livingCosts),0,100)*10)/10;}
function initialLocalEconomy(){return {...LOCAL_ECONOMY};}
function currentLocalEconomy(state){
 const e=state.localEconomy;
 return e&&['employment','earnings','livingCosts'].every(k=>Number.isFinite(e[k]))?e:initialLocalEconomy();
}
function localEconomyChange(state){
 const previous=currentLocalEconomy(state),month=state.month,seed=(state.riskSeed??81773)>>>0;
 // Three distinct seeded streams. Small persistent drifts + gradual mean reversion.
 const noise=salt=>{let n=(seed^Math.imul(month+17,salt))>>>0;n=Math.imul(n^(n>>>16),2246822519)>>>0;n=Math.imul(n^(n>>>13),3266489917)>>>0;return ((n^(n>>>16))>>>0)/4294967295*2-1;};
 const targets={employment:46,earnings:47,livingCosts:66};
 const drift={employment:.20,earnings:.16,livingCosts:.12};
 const volatility={employment:.68,earnings:.55,livingCosts:.85};
 const result={};
 for(const [i,k] of ['employment','earnings','livingCosts'].entries()){
  const delta=drift[k]+.055*(targets[k]-previous[k])+noise(73241+i*40213)*volatility[k];
  result[k]=Math.round(clamp(previous[k]+delta,0,100)*10)/10;
 }
 return result;
}
function localEconomyExplanation(before,after){
 const labels={employment:'Employment',earnings:'Earnings',livingCosts:'Living costs'};
 return Object.keys(labels).map(k=>{
  const change=Math.round((after[k]-before[k])*10)/10;
  return labels[k]+' '+(change>0?'+':'')+change.toFixed(1)+(k==='livingCosts'?' (higher = more pressure)':'');
 }).join(' · ');
}
