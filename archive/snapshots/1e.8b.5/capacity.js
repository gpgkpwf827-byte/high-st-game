/* Stage 6B: capacity is an independent council constraint, distinct from money. */
const MONTHLY_ACTION_CAPACITY = 3;
function actionsUsed(state){return state.capacityMonth===state.month ? (state.actionsUsed||0) : 0;}
function actionsRemaining(state){return Math.max(0,MONTHLY_ACTION_CAPACITY-actionsUsed(state));}
function requireCapacity(state,cost){
 if(!Number.isInteger(cost)||cost<0)throw Error('Invalid action cost.');
 if(actionsRemaining(state)<cost)throw Error('Not enough Council Action Points. Advance to the next month to replenish capacity.');
}
function spendCapacity(state,cost){requireCapacity(state,cost);return {...state,capacityMonth:state.month,actionsUsed:actionsUsed(state)+cost};}
function awardCapacityGrant(state,premise){requireCapacity(state,1);return spendCapacity(awardImprovementGrant(state,premise),1);}
function openCapacityTenant(state,id,applicantIndex){requireCapacity(state,1);return spendCapacity(openTenant(state,id,applicantIndex),1);}
function chooseCapacityTransport(state,choice){requireCapacity(state,2);return spendCapacity(chooseTransport(state,choice),2);}
function startCapacityMarketing(state){requireCapacity(state,1);return spendCapacity(startMarketing(state),1);}
