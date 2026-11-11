const{contextBridge,ipcRenderer:r}=require('electron'),i=(c,...a)=>r.invoke(c,...a);
contextBridge.exposeInMainWorld('ps',{cfg:()=>i('cfg'),open:u=>i('open',u),
 db:{list:()=>i('db:list'),save:c=>i('db:save',c),remove:id=>i('db:remove',id),pick:()=>i('db:pick'),test:c=>i('db:test',c),schema:c=>i('db:schema',c),preview:(c,t)=>i('db:preview',c,t),fetch:(c,t)=>i('db:fetch',c,t)}});
