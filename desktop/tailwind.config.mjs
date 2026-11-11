export default {content:['./index.html','./src/**/*.{js,jsx}'],theme:{extend:{colors:{brand:{50:'#ecfdf5',100:'#d1fae5',400:'#34d399',500:'#10b981',600:'#059669',700:'#047857'},ink:'#0b1220'},fontFamily:{sans:['Inter','Segoe UI','system-ui','sans-serif']},
keyframes:{fadeUp:{'0%':{opacity:0,transform:'translateY(12px)'},'100%':{opacity:1,transform:'none'}},shimmer:{'100%':{transform:'translateX(100%)'}},pop:{'0%':{opacity:0,transform:'scale(.95)'},'100%':{opacity:1,transform:'none'}}},
animation:{'fade-up':'fadeUp .5s ease both',pop:'pop .2s ease both'}}}};
