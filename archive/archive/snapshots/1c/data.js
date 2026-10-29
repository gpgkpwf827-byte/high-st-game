/* Milestone 1A: game definitions. No interface logic here. */
const PREMISES = [
  {id:1,name:'Flour & Fold',type:'Bakery',icon:'🥐',occupied:true,side:'north',colour:'#d98e58',description:'A neighbourhood bakery serving bread, pastries and morning regulars.',finance:{transactions:1800,averageSale:7,rent:1500,wages:5200,otherCosts:3100,monthlyBusinessRates:650,cash:17000}},
  {id:2,name:'The Daily Grind',type:'Café',icon:'☕',occupied:true,side:'north',colour:'#bd7b79',description:'A small independent café hoping for more lunchtime trade.',finance:{transactions:1400,averageSale:9,rent:1600,wages:5800,otherCosts:3000,monthlyBusinessRates:550,cash:13000}},
  {id:3,name:'Corner Market',type:'Convenience store',icon:'🛒',occupied:true,side:'north',colour:'#68a29a',description:'An essential local shop for groceries and everyday supplies.',finance:{transactions:2300,averageSale:8,rent:1900,wages:6800,otherCosts:7000,monthlyBusinessRates:750,cash:24000}},
  {id:4,name:'Wellfield Pharmacy',type:'Pharmacy',icon:'💊',occupied:true,side:'north',colour:'#739cb1',description:'A community pharmacy providing prescriptions and healthcare essentials.',finance:{transactions:1450,averageSale:12,rent:1700,wages:6100,otherCosts:6300,monthlyBusinessRates:620,cash:19500}},
  {id:5,name:'Second Chance',type:'Charity shop',icon:'💚',occupied:true,side:'north',colour:'#9e9ac3',description:'A volunteer-supported charity shop with donated stock.',finance:{transactions:1000,averageSale:6,rent:900,wages:1200,otherCosts:3200,monthlyBusinessRates:0,cash:7000}},
  {id:6,name:'The Cutting Room',type:'Hairdresser',icon:'✂️',occupied:true,side:'south',colour:'#b58aa7',description:'A familiar salon with a loyal base of returning customers.',finance:{transactions:420,averageSale:32,rent:1200,wages:5000,otherCosts:3000,monthlyBusinessRates:430,cash:13000}},
  {id:7,name:'Paper Trail',type:'Independent bookshop',icon:'📚',occupied:true,side:'south',colour:'#b1845d',description:'An independent bookshop working to attract new readers.',finance:{transactions:460,averageSale:17,rent:1100,wages:2200,otherCosts:3200,monthlyBusinessRates:380,cash:9000}},
  {id:8,name:'Unit 8',type:'Vacant premise',icon:'🔑',occupied:false,side:'south',colour:'#9fa7a0',description:'An empty unit with potential for a new business.'},
  {id:9,name:'Unit 9',type:'Vacant premise',icon:'🔑',occupied:false,side:'south',colour:'#9fa7a0',description:'The shutters are down. A future tenant could bring new activity.'},
  {id:10,name:'Unit 10',type:'Vacant premise',icon:'🔑',occupied:false,side:'south',colour:'#9fa7a0',description:'A vacant shopfront waiting for its next chapter.'}
];
const GAME_CONFIG = {town:'High Street',startingBudget:250000,startingMonth:1};
