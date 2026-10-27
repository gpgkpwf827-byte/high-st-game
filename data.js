/* Milestone 1A: game definitions. No interface logic here. */
const PREMISES = [
  {id:1,name:'Flour & Fold',type:'Bakery',icon:'🥐',occupied:true,side:'north',colour:'#d98e58',description:'A neighbourhood bakery serving bread, pastries and morning regulars.'},
  {id:2,name:'The Daily Grind',type:'Café',icon:'☕',occupied:true,side:'north',colour:'#bd7b79',description:'A small independent café hoping for more lunchtime trade.'},
  {id:3,name:'Corner Market',type:'Convenience store',icon:'🛒',occupied:true,side:'north',colour:'#68a29a',description:'An essential local shop for groceries and everyday supplies.'},
  {id:4,name:'Wellfield Pharmacy',type:'Pharmacy',icon:'💊',occupied:true,side:'north',colour:'#739cb1',description:'A community pharmacy providing prescriptions and healthcare essentials.'},
  {id:5,name:'Second Chance',type:'Charity shop',icon:'💚',occupied:true,side:'north',colour:'#9e9ac3',description:'A volunteer-supported charity shop with donated stock.'},
  {id:6,name:'The Cutting Room',type:'Hairdresser',icon:'✂️',occupied:true,side:'south',colour:'#b58aa7',description:'A familiar salon with a loyal base of returning customers.'},
  {id:7,name:'Paper Trail',type:'Independent bookshop',icon:'📚',occupied:true,side:'south',colour:'#b1845d',description:'An independent bookshop working to attract new readers.'},
  {id:8,name:'Unit 8',type:'Vacant premise',icon:'🔑',occupied:false,side:'south',colour:'#9fa7a0',description:'An empty unit with potential for a new business.'},
  {id:9,name:'Unit 9',type:'Vacant premise',icon:'🔑',occupied:false,side:'south',colour:'#9fa7a0',description:'The shutters are down. A future tenant could bring new activity.'},
  {id:10,name:'Unit 10',type:'Vacant premise',icon:'🔑',occupied:false,side:'south',colour:'#9fa7a0',description:'A vacant shopfront waiting for its next chapter.'}
];
const GAME_CONFIG = {town:'High Street',startingBudget:250000,startingMonth:1};
