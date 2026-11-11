const jwt=require('jsonwebtoken'),{Sub}=require('./models');
const day=864e5,now=()=>new Date();
exports.stateOf=(s,user)=>{
 if(user&&user.suspended)return{state:'suspended',until:null};
 const t=now(),g=+(process.env.GRACE_DAYS||3)*day;
 if(s?.paidUntil&&s.paidUntil>t)return{state:s.cancelled?'cancelled':'paid_active',until:s.paidUntil};
 if(s?.trialEnd&&s.trialEnd>t&&!s.paidUntil)return{state:'trial_active',until:s.trialEnd};
 if(s?.paidUntil&&+s.paidUntil+g>+t)return{state:'grace',until:new Date(+s.paidUntil+g)};
 if(s?.pending)return{state:'payment_pending',until:null};
 if(s?.trialUsed||s?.paidUntil)return{state:'expired',until:null};
 return{state:'registered',until:null};
};
exports.entitled=st=>['trial_active','paid_active','cancelled','grace'].includes(st);
exports.token=(id,st,until)=>jwt.sign({sub:String(id),st,until},process.env.ENTITLEMENT_SECRET,{expiresIn:'24h'});
exports.extend=async(userId)=>{const s=await Sub.findOne({userId}),base=s.paidUntil&&s.paidUntil>now()?s.paidUntil:now();
 s.paidUntil=new Date(+base+ +(process.env.PLAN_DAYS||30)*day);s.pending=false;s.cancelled=false;await s.save();return s;};
