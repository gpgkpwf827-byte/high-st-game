/* 1E Stage 2: twelve premises, seven vulnerable independent businesses. Illustrative economics. */
const PREMISES=[
{id:1,name:'Flour & Fold',type:'Bakery',icon:'🥐',occupied:true,side:'north',colour:'#d98e58',description:'A neighbourhood bakery struggling with reduced morning trade.',finance:{transactions:1400,averageSale:7,rent:1500,wages:5200,otherCosts:3100,monthlyBusinessRates:650,cash:5800}},
{id:2,name:'The Daily Grind',type:'Café',icon:'☕',occupied:true,side:'north',colour:'#bd7b79',description:'A café with dangerously low reserves and weaker lunchtime custom.',finance:{transactions:1000,averageSale:9,rent:1600,wages:5800,otherCosts:3000,monthlyBusinessRates:550,cash:3600}},
{id:3,name:'Corner Market',type:'Convenience store',icon:'🛒',occupied:true,side:'north',colour:'#68a29a',description:'An essential local shop retaining many regular customers.',finance:{transactions:2100,averageSale:8,rent:1900,wages:6800,otherCosts:7000,monthlyBusinessRates:750,cash:11500}},
{id:4,name:'Wellfield Pharmacy',type:'Pharmacy',icon:'💊',occupied:true,side:'north',colour:'#739cb1',description:'A relatively stable pharmacy serving the town.',finance:{transactions:1400,averageSale:12,rent:1700,wages:6100,otherCosts:6300,monthlyBusinessRates:620,cash:12500}},
{id:5,name:'Second Chance',type:'Charity shop',icon:'💚',occupied:true,side:'north',colour:'#9e9ac3',description:'A charity shop coping with lower donations and fewer customers.',finance:{transactions:800,averageSale:6,rent:900,wages:1200,otherCosts:3200,monthlyBusinessRates:0,cash:2700}},
{id:6,name:'The Cutting Room',type:'Hairdresser',icon:'✂️',occupied:true,side:'north',colour:'#b58aa7',description:'A salon holding onto loyal regulars but losing profitability.',finance:{transactions:300,averageSale:32,rent:1200,wages:5000,otherCosts:3000,monthlyBusinessRates:430,cash:4900}},
{id:7,name:'Paper Trail',type:'Independent bookshop',icon:'📚',occupied:true,side:'south',colour:'#b1845d',description:'A much-loved bookshop at serious risk without more trade.',finance:{transactions:330,averageSale:17,rent:1100,wages:2200,otherCosts:3200,monthlyBusinessRates:380,cash:2400}},
{id:8,name:'Unit 8',type:'Vacant premise',icon:'🔑',occupied:false,side:'south',colour:'#9fa7a0',description:'A vacant high street property awaiting investment.'},
{id:9,name:'Unit 9',type:'Vacant premise',icon:'🔑',occupied:false,side:'south',colour:'#9fa7a0',description:'A vacant shopfront looking for a new use.'},
{id:10,name:'Unit 10',type:'Vacant premise',icon:'🔑',occupied:false,side:'south',colour:'#9fa7a0',description:'An empty property waiting for a new tenant.'},
{id:11,name:'Unit 11',type:'Vacant premise',icon:'🔑',occupied:false,side:'south',colour:'#9fa7a0',description:'A long-quiet storefront needing regeneration.'},
{id:12,name:'Unit 12',type:'Vacant premise',icon:'🔑',occupied:false,side:'south',colour:'#9fa7a0',description:'Another unused high street unit.'}
];
const GAME_CONFIG={town:'High Street',startingBudget:250000,startingMonth:1};
