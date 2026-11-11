const crypto=require('crypto'),B='https://api.paystack.co';
const H=()=>({Authorization:'Bearer '+process.env.PAYSTACK_SECRET_KEY,'Content-Type':'application/json'});
exports.init=async p=>{const r=await fetch(B+'/transaction/initialize',{method:'POST',headers:H(),body:JSON.stringify(p)});const j=await r.json();if(!j.status)throw new Error(j.message);return j.data;};
exports.verify=async ref=>{const r=await fetch(B+'/transaction/verify/'+encodeURIComponent(ref),{headers:H()});const j=await r.json();if(!j.status)throw new Error(j.message);return j.data;};
exports.validSig=(raw,sig)=>{if(!sig)return false;const h=crypto.createHmac('sha512',process.env.PAYSTACK_SECRET_KEY).update(raw).digest('hex');
 return h.length===sig.length&&crypto.timingSafeEqual(Buffer.from(h),Buffer.from(sig));};
