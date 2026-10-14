// ==UserScript==
// @name         网页链接二维码生成器 (可移动/手机端适配)
// @namespace    https://github.com/qingshanh/userscripts
// @version      1.0.2
// @description  在网页侧面生成可自由拖拽的悬浮二维码小图标，点击后展开高清二维码，再次点击二维码立即收起并恢复小图标。完美适配手机端与PC端浏览器，支持拖拽定位、位置记忆、SPA无刷新链接动态更新、一键复制链接。
// @author       Lance
// @match        *://*/*
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_registerMenuCommand
// @run-at       document-idle
// @homepageURL  https://github.com/qingshanh/userscripts
// @supportURL   https://github.com/qingshanh/userscripts/issues
// @updateURL    https://raw.githubusercontent.com/qingshanh/userscripts/main/url-to-qrcode.user.js
// @downloadURL  https://raw.githubusercontent.com/qingshanh/userscripts/main/url-to-qrcode.user.js
// ==/UserScript==

(function () {
  'use strict';

  // 1. 防重载与跨域子 iframe 过滤
  if (window.top !== window.self) return;
  if (document.getElementById('__url_to_qrcode_host__')) return;

  // 2. 嵌入轻量级 QRCode 核心库 (自包含，零外部 CDN 依赖，完全离线可用)
var QRCode;!function(){function a(a){this.mode=c.MODE_8BIT_BYTE,this.data=a,this.parsedData=[];for(var b=[],d=0,e=this.data.length;e>d;d++){var f=this.data.charCodeAt(d);f>65536?(b[0]=240|(1835008&f)>>>18,b[1]=128|(258048&f)>>>12,b[2]=128|(4032&f)>>>6,b[3]=128|63&f):f>2048?(b[0]=224|(61440&f)>>>12,b[1]=128|(4032&f)>>>6,b[2]=128|63&f):f>128?(b[0]=192|(1984&f)>>>6,b[1]=128|63&f):b[0]=f,this.parsedData=this.parsedData.concat(b)}this.parsedData.length!=this.data.length&&(this.parsedData.unshift(191),this.parsedData.unshift(187),this.parsedData.unshift(239))}function b(a,b){this.typeNumber=a,this.errorCorrectLevel=b,this.modules=null,this.moduleCount=0,this.dataCache=null,this.dataList=[]}function i(a,b){if(void 0==a.length)throw new Error(a.length+"/"+b);for(var c=0;c<a.length&&0==a[c];)c++;this.num=new Array(a.length-c+b);for(var d=0;d<a.length-c;d++)this.num[d]=a[d+c]}function j(a,b){this.totalCount=a,this.dataCount=b}function k(){this.buffer=[],this.length=0}function m(){return"undefined"!=typeof CanvasRenderingContext2D}function n(){var a=!1,b=navigator.userAgent,aMat;return/android/i.test(b)&&(a=!0,aMat=b.toString().match(/android ([0-9]\.[0-9])/i),aMat&&aMat[1]&&(a=parseFloat(aMat[1]))),a}function r(a,b){for(var c=1,e=s(a),f=0,g=l.length;g>=f;f++){var h=0;switch(b){case d.L:h=l[f][0];break;case d.M:h=l[f][1];break;case d.Q:h=l[f][2];break;case d.H:h=l[f][3]}if(h>=e)break;c++}if(c>l.length)throw new Error("Too long data");return c}function s(a){var b=encodeURI(a).toString().replace(/\%[0-9a-fA-F]{2}/g,"a");return b.length+(b.length!=a?3:0)}a.prototype={getLength:function(){return this.parsedData.length},write:function(a){for(var b=0,c=this.parsedData.length;c>b;b++)a.put(this.parsedData[b],8)}},b.prototype={addData:function(b){var c=new a(b);this.dataList.push(c),this.dataCache=null},isDark:function(a,b){if(0>a||this.moduleCount<=a||0>b||this.moduleCount<=b)throw new Error(a+","+b);return this.modules[a][b]},getModuleCount:function(){return this.moduleCount},make:function(){this.makeImpl(!1,this.getBestMaskPattern())},makeImpl:function(a,c){this.moduleCount=4*this.typeNumber+17,this.modules=new Array(this.moduleCount);for(var d=0;d<this.moduleCount;d++){this.modules[d]=new Array(this.moduleCount);for(var e=0;e<this.moduleCount;e++)this.modules[d][e]=null}this.setupPositionProbePattern(0,0),this.setupPositionProbePattern(this.moduleCount-7,0),this.setupPositionProbePattern(0,this.moduleCount-7),this.setupPositionAdjustPattern(),this.setupTimingPattern(),this.setupTypeInfo(a,c),this.typeNumber>=7&&this.setupTypeNumber(a),null==this.dataCache&&(this.dataCache=b.createData(this.typeNumber,this.errorCorrectLevel,this.dataList)),this.mapData(this.dataCache,c)},setupPositionProbePattern:function(a,b){for(var c=-1;7>=c;c++)if(!(-1>=a+c||this.moduleCount<=a+c))for(var d=-1;7>=d;d++)-1>=b+d||this.moduleCount<=b+d||(this.modules[a+c][b+d]=c>=0&&6>=c&&(0==d||6==d)||d>=0&&6>=d&&(0==c||6==c)||c>=2&&4>=c&&d>=2&&4>=d?!0:!1)},getBestMaskPattern:function(){for(var a=0,b=0,c=0;8>c;c++){this.makeImpl(!0,c);var d=f.getLostPoint(this);(0==c||a>d)&&(a=d,b=c)}return b},createMovieClip:function(a,b,c){var d=a.createEmptyMovieClip(b,c),e=1;this.make();for(var f=0;f<this.modules.length;f++)for(var g=f*e,h=0;h<this.modules[f].length;h++){var i=h*e,j=this.modules[f][h];j&&(d.beginFill(0,100),d.moveTo(i,g),d.lineTo(i+e,g),d.lineTo(i+e,g+e),d.lineTo(i,g+e),d.endFill())}return d},setupTimingPattern:function(){for(var a=8;a<this.moduleCount-8;a++)null==this.modules[a][6]&&(this.modules[a][6]=0==a%2);for(var b=8;b<this.moduleCount-8;b++)null==this.modules[6][b]&&(this.modules[6][b]=0==b%2)},setupPositionAdjustPattern:function(){for(var a=f.getPatternPosition(this.typeNumber),b=0;b<a.length;b++)for(var c=0;c<a.length;c++){var d=a[b],e=a[c];if(null==this.modules[d][e])for(var g=-2;2>=g;g++)for(var h=-2;2>=h;h++)this.modules[d+g][e+h]=-2==g||2==g||-2==h||2==h||0==g&&0==h?!0:!1}},setupTypeNumber:function(a){for(var b=f.getBCHTypeNumber(this.typeNumber),c=0;18>c;c++){var d=!a&&1==(1&b>>c);this.modules[Math.floor(c/3)][c%3+this.moduleCount-8-3]=d}for(var c=0;18>c;c++){var d=!a&&1==(1&b>>c);this.modules[c%3+this.moduleCount-8-3][Math.floor(c/3)]=d}},setupTypeInfo:function(a,b){for(var c=this.errorCorrectLevel<<3|b,d=f.getBCHTypeInfo(c),e=0;15>e;e++){var g=!a&&1==(1&d>>e);6>e?this.modules[e][8]=g:8>e?this.modules[e+1][8]=g:this.modules[this.moduleCount-15+e][8]=g}for(var e=0;15>e;e++){var g=!a&&1==(1&d>>e);8>e?this.modules[8][this.moduleCount-e-1]=g:9>e?this.modules[8][15-e-1+1]=g:this.modules[8][15-e-1]=g}this.modules[this.moduleCount-8][8]=!a},mapData:function(a,b){for(var c=-1,d=this.moduleCount-1,e=7,g=0,h=this.moduleCount-1;h>0;h-=2)for(6==h&&h--;;){for(var i=0;2>i;i++)if(null==this.modules[d][h-i]){var j=!1;g<a.length&&(j=1==(1&a[g]>>>e));var k=f.getMask(b,d,h-i);k&&(j=!j),this.modules[d][h-i]=j,e--,-1==e&&(g++,e=7)}if(d+=c,0>d||this.moduleCount<=d){d-=c,c=-c;break}}}},b.PAD0=236,b.PAD1=17,b.createData=function(a,c,d){for(var e=j.getRSBlocks(a,c),g=new k,h=0;h<d.length;h++){var i=d[h];g.put(i.mode,4),g.put(i.getLength(),f.getLengthInBits(i.mode,a)),i.write(g)}for(var l=0,h=0;h<e.length;h++)l+=e[h].dataCount;if(g.getLengthInBits()>8*l)throw new Error("code length overflow. ("+g.getLengthInBits()+">"+8*l+")");for(g.getLengthInBits()+4<=8*l&&g.put(0,4);0!=g.getLengthInBits()%8;)g.putBit(!1);for(;;){if(g.getLengthInBits()>=8*l)break;if(g.put(b.PAD0,8),g.getLengthInBits()>=8*l)break;g.put(b.PAD1,8)}return b.createBytes(g,e)},b.createBytes=function(a,b){for(var c=0,d=0,e=0,g=new Array(b.length),h=new Array(b.length),j=0;j<b.length;j++){var k=b[j].dataCount,l=b[j].totalCount-k;d=Math.max(d,k),e=Math.max(e,l),g[j]=new Array(k);for(var m=0;m<g[j].length;m++)g[j][m]=255&a.buffer[m+c];c+=k;var n=f.getErrorCorrectPolynomial(l),o=new i(g[j],n.getLength()-1),p=o.mod(n);h[j]=new Array(n.getLength()-1);for(var m=0;m<h[j].length;m++){var q=m+p.getLength()-h[j].length;h[j][m]=q>=0?p.get(q):0}}for(var r=0,m=0;m<b.length;m++)r+=b[m].totalCount;for(var s=new Array(r),t=0,m=0;d>m;m++)for(var j=0;j<b.length;j++)m<g[j].length&&(s[t++]=g[j][m]);for(var m=0;e>m;m++)for(var j=0;j<b.length;j++)m<h[j].length&&(s[t++]=h[j][m]);return s};for(var c={MODE_NUMBER:1,MODE_ALPHA_NUM:2,MODE_8BIT_BYTE:4,MODE_KANJI:8},d={L:1,M:0,Q:3,H:2},e={PATTERN000:0,PATTERN001:1,PATTERN010:2,PATTERN011:3,PATTERN100:4,PATTERN101:5,PATTERN110:6,PATTERN111:7},f={PATTERN_POSITION_TABLE:[[],[6,18],[6,22],[6,26],[6,30],[6,34],[6,22,38],[6,24,42],[6,26,46],[6,28,50],[6,30,54],[6,32,58],[6,34,62],[6,26,46,66],[6,26,48,70],[6,26,50,74],[6,30,54,78],[6,30,56,82],[6,30,58,86],[6,34,62,90],[6,28,50,72,94],[6,26,50,74,98],[6,30,54,78,102],[6,28,54,80,106],[6,32,58,84,110],[6,30,58,86,114],[6,34,62,90,118],[6,26,50,74,98,122],[6,30,54,78,102,126],[6,26,52,78,104,130],[6,30,56,82,108,134],[6,34,60,86,112,138],[6,30,58,86,114,142],[6,34,62,90,118,146],[6,30,54,78,102,126,150],[6,24,50,76,102,128,154],[6,28,54,80,106,132,158],[6,32,58,84,110,136,162],[6,26,54,82,110,138,166],[6,30,58,86,114,142,170]],G15:1335,G18:7973,G15_MASK:21522,getBCHTypeInfo:function(a){for(var b=a<<10;f.getBCHDigit(b)-f.getBCHDigit(f.G15)>=0;)b^=f.G15<<f.getBCHDigit(b)-f.getBCHDigit(f.G15);return(a<<10|b)^f.G15_MASK},getBCHTypeNumber:function(a){for(var b=a<<12;f.getBCHDigit(b)-f.getBCHDigit(f.G18)>=0;)b^=f.G18<<f.getBCHDigit(b)-f.getBCHDigit(f.G18);return a<<12|b},getBCHDigit:function(a){for(var b=0;0!=a;)b++,a>>>=1;return b},getPatternPosition:function(a){return f.PATTERN_POSITION_TABLE[a-1]},getMask:function(a,b,c){switch(a){case e.PATTERN000:return 0==(b+c)%2;case e.PATTERN001:return 0==b%2;case e.PATTERN010:return 0==c%3;case e.PATTERN011:return 0==(b+c)%3;case e.PATTERN100:return 0==(Math.floor(b/2)+Math.floor(c/3))%2;case e.PATTERN101:return 0==b*c%2+b*c%3;case e.PATTERN110:return 0==(b*c%2+b*c%3)%2;case e.PATTERN111:return 0==(b*c%3+(b+c)%2)%2;default:throw new Error("bad maskPattern:"+a)}},getErrorCorrectPolynomial:function(a){for(var b=new i([1],0),c=0;a>c;c++)b=b.multiply(new i([1,g.gexp(c)],0));return b},getLengthInBits:function(a,b){if(b>=1&&10>b)switch(a){case c.MODE_NUMBER:return 10;case c.MODE_ALPHA_NUM:return 9;case c.MODE_8BIT_BYTE:return 8;case c.MODE_KANJI:return 8;default:throw new Error("mode:"+a)}else if(27>b)switch(a){case c.MODE_NUMBER:return 12;case c.MODE_ALPHA_NUM:return 11;case c.MODE_8BIT_BYTE:return 16;case c.MODE_KANJI:return 10;default:throw new Error("mode:"+a)}else{if(!(41>b))throw new Error("type:"+b);switch(a){case c.MODE_NUMBER:return 14;case c.MODE_ALPHA_NUM:return 13;case c.MODE_8BIT_BYTE:return 16;case c.MODE_KANJI:return 12;default:throw new Error("mode:"+a)}}},getLostPoint:function(a){for(var b=a.getModuleCount(),c=0,d=0;b>d;d++)for(var e=0;b>e;e++){for(var f=0,g=a.isDark(d,e),h=-1;1>=h;h++)if(!(0>d+h||d+h>=b))for(var i=-1;1>=i;i++)0>e+i||e+i>=b||(0!=h||0!=i)&&g==a.isDark(d+h,e+i)&&f++;f>5&&(c+=3+f-5)}for(var d=0;b-1>d;d++)for(var e=0;b-1>e;e++){var j=0;a.isDark(d,e)&&j++,a.isDark(d+1,e)&&j++,a.isDark(d,e+1)&&j++,a.isDark(d+1,e+1)&&j++,(0==j||4==j)&&(c+=3)}for(var d=0;b>d;d++)for(var e=0;b-6>e;e++)a.isDark(d,e)&&!a.isDark(d,e+1)&&a.isDark(d,e+2)&&a.isDark(d,e+3)&&a.isDark(d,e+4)&&!a.isDark(d,e+5)&&a.isDark(d,e+6)&&(c+=40);for(var e=0;b>e;e++)for(var d=0;b-6>d;d++)a.isDark(d,e)&&!a.isDark(d+1,e)&&a.isDark(d+2,e)&&a.isDark(d+3,e)&&a.isDark(d+4,e)&&!a.isDark(d+5,e)&&a.isDark(d+6,e)&&(c+=40);for(var k=0,e=0;b>e;e++)for(var d=0;b>d;d++)a.isDark(d,e)&&k++;var l=Math.abs(100*k/b/b-50)/5;return c+=10*l}},g={glog:function(a){if(1>a)throw new Error("glog("+a+")");return g.LOG_TABLE[a]},gexp:function(a){for(;0>a;)a+=255;for(;a>=256;)a-=255;return g.EXP_TABLE[a]},EXP_TABLE:new Array(256),LOG_TABLE:new Array(256)},h=0;8>h;h++)g.EXP_TABLE[h]=1<<h;for(var h=8;256>h;h++)g.EXP_TABLE[h]=g.EXP_TABLE[h-4]^g.EXP_TABLE[h-5]^g.EXP_TABLE[h-6]^g.EXP_TABLE[h-8];for(var h=0;255>h;h++)g.LOG_TABLE[g.EXP_TABLE[h]]=h;i.prototype={get:function(a){return this.num[a]},getLength:function(){return this.num.length},multiply:function(a){for(var b=new Array(this.getLength()+a.getLength()-1),c=0;c<this.getLength();c++)for(var d=0;d<a.getLength();d++)b[c+d]^=g.gexp(g.glog(this.get(c))+g.glog(a.get(d)));return new i(b,0)},mod:function(a){if(this.getLength()-a.getLength()<0)return this;for(var b=g.glog(this.get(0))-g.glog(a.get(0)),c=new Array(this.getLength()),d=0;d<this.getLength();d++)c[d]=this.get(d);for(var d=0;d<a.getLength();d++)c[d]^=g.gexp(g.glog(a.get(d))+b);return new i(c,0).mod(a)}},j.RS_BLOCK_TABLE=[[1,26,19],[1,26,16],[1,26,13],[1,26,9],[1,44,34],[1,44,28],[1,44,22],[1,44,16],[1,70,55],[1,70,44],[2,35,17],[2,35,13],[1,100,80],[2,50,32],[2,50,24],[4,25,9],[1,134,108],[2,67,43],[2,33,15,2,34,16],[2,33,11,2,34,12],[2,86,68],[4,43,27],[4,43,19],[4,43,15],[2,98,78],[4,49,31],[2,32,14,4,33,15],[4,39,13,1,40,14],[2,121,97],[2,60,38,2,61,39],[4,40,18,2,41,19],[4,40,14,2,41,15],[2,146,116],[3,58,36,2,59,37],[4,36,16,4,37,17],[4,36,12,4,37,13],[2,86,68,2,87,69],[4,69,43,1,70,44],[6,43,19,2,44,20],[6,43,15,2,44,16],[4,101,81],[1,80,50,4,81,51],[4,50,22,4,51,23],[3,36,12,8,37,13],[2,116,92,2,117,93],[6,58,36,2,59,37],[4,46,20,6,47,21],[7,42,14,4,43,15],[4,133,107],[8,59,37,1,60,38],[8,44,20,4,45,21],[12,33,11,4,34,12],[3,145,115,1,146,116],[4,64,40,5,65,41],[11,36,16,5,37,17],[11,36,12,5,37,13],[5,109,87,1,110,88],[5,65,41,5,66,42],[5,54,24,7,55,25],[11,36,12],[5,122,98,1,123,99],[7,73,45,3,74,46],[15,43,19,2,44,20],[3,45,15,13,46,16],[1,135,107,5,136,108],[10,74,46,1,75,47],[1,50,22,15,51,23],[2,42,14,17,43,15],[5,150,120,1,151,121],[9,69,43,4,70,44],[17,50,22,1,51,23],[2,42,14,19,43,15],[3,141,113,4,142,114],[3,70,44,11,71,45],[17,47,21,4,48,22],[9,39,13,16,40,14],[3,135,107,5,136,108],[3,67,41,13,68,42],[15,54,24,5,55,25],[15,43,15,10,44,16],[4,144,116,4,145,117],[17,68,42],[17,50,22,6,51,23],[19,46,16,6,47,17],[2,139,111,7,140,112],[17,74,46],[7,54,24,16,55,25],[34,37,13],[4,151,121,5,152,122],[4,75,47,14,76,48],[11,54,24,14,55,25],[16,45,15,14,46,16],[6,147,117,4,148,118],[6,73,45,14,74,46],[11,54,24,16,55,25],[30,46,16,2,47,17],[8,132,106,4,133,107],[8,75,47,13,76,48],[7,54,24,22,55,25],[22,45,15,13,46,16],[10,142,114,2,143,115],[19,74,46,4,75,47],[28,50,22,6,51,23],[33,46,16,4,47,17],[8,152,122,4,153,123],[22,73,45,3,74,46],[8,53,23,26,54,24],[12,45,15,28,46,16],[3,147,117,10,148,118],[3,73,45,23,74,46],[4,54,24,31,55,25],[11,45,15,31,46,16],[7,146,116,7,147,117],[21,73,45,7,74,46],[1,53,23,37,54,24],[19,45,15,26,46,16],[5,145,115,10,146,116],[19,75,47,10,76,48],[15,54,24,25,55,25],[23,45,15,25,46,16],[13,145,115,3,146,116],[2,74,46,29,75,47],[42,54,24,1,55,25],[23,45,15,28,46,16],[17,145,115],[10,74,46,23,75,47],[10,54,24,35,55,25],[19,45,15,35,46,16],[17,145,115,1,146,116],[14,74,46,21,75,47],[29,54,24,19,55,25],[11,45,15,46,46,16],[13,145,115,6,146,116],[14,74,46,23,75,47],[44,54,24,7,55,25],[59,46,16,1,47,17],[12,151,121,7,152,122],[12,75,47,26,76,48],[39,54,24,14,55,25],[22,45,15,41,46,16],[6,151,121,14,152,122],[6,75,47,34,76,48],[46,54,24,10,55,25],[2,45,15,64,46,16],[17,152,122,4,153,123],[29,74,46,14,75,47],[49,54,24,10,55,25],[24,45,15,46,46,16],[4,152,122,18,153,123],[13,74,46,32,75,47],[48,54,24,14,55,25],[42,45,15,32,46,16],[20,147,117,4,148,118],[40,75,47,7,76,48],[43,54,24,22,55,25],[10,45,15,67,46,16],[19,148,118,6,149,119],[18,75,47,31,76,48],[34,54,24,34,55,25],[20,45,15,61,46,16]],j.getRSBlocks=function(a,b){var c=j.getRsBlockTable(a,b);if(void 0==c)throw new Error("bad rs block @ typeNumber:"+a+"/errorCorrectLevel:"+b);for(var d=c.length/3,e=[],f=0;d>f;f++)for(var g=c[3*f+0],h=c[3*f+1],i=c[3*f+2],k=0;g>k;k++)e.push(new j(h,i));return e},j.getRsBlockTable=function(a,b){switch(b){case d.L:return j.RS_BLOCK_TABLE[4*(a-1)+0];case d.M:return j.RS_BLOCK_TABLE[4*(a-1)+1];case d.Q:return j.RS_BLOCK_TABLE[4*(a-1)+2];case d.H:return j.RS_BLOCK_TABLE[4*(a-1)+3];default:return void 0}},k.prototype={get:function(a){var b=Math.floor(a/8);return 1==(1&this.buffer[b]>>>7-a%8)},put:function(a,b){for(var c=0;b>c;c++)this.putBit(1==(1&a>>>b-c-1))},getLengthInBits:function(){return this.length},putBit:function(a){var b=Math.floor(this.length/8);this.buffer.length<=b&&this.buffer.push(0),a&&(this.buffer[b]|=128>>>this.length%8),this.length++}};var l=[[17,14,11,7],[32,26,20,14],[53,42,32,24],[78,62,46,34],[106,84,60,44],[134,106,74,58],[154,122,86,64],[192,152,108,84],[230,180,130,98],[271,213,151,119],[321,251,177,137],[367,287,203,155],[425,331,241,177],[458,362,258,194],[520,412,292,220],[586,450,322,250],[644,504,364,280],[718,560,394,310],[792,624,442,338],[858,666,482,382],[929,711,509,403],[1003,779,565,439],[1091,857,611,461],[1171,911,661,511],[1273,997,715,535],[1367,1059,751,593],[1465,1125,805,625],[1528,1190,868,658],[1628,1264,908,698],[1732,1370,982,742],[1840,1452,1030,790],[1952,1538,1112,842],[2068,1628,1168,898],[2188,1722,1228,958],[2303,1809,1283,983],[2431,1911,1351,1051],[2563,1989,1423,1093],[2699,2099,1499,1139],[2809,2213,1579,1219],[2953,2331,1663,1273]],o=function(){var a=function(a,b){this._el=a,this._htOption=b};return a.prototype.draw=function(a){function g(a,b){var c=document.createElementNS("http://www.w3.org/2000/svg",a);for(var d in b)b.hasOwnProperty(d)&&c.setAttribute(d,b[d]);return c}var b=this._htOption,c=this._el,d=a.getModuleCount();Math.floor(b.width/d),Math.floor(b.height/d),this.clear();var h=g("svg",{viewBox:"0 0 "+String(d)+" "+String(d),width:"100%",height:"100%",fill:b.colorLight});h.setAttributeNS("http://www.w3.org/2000/xmlns/","xmlns:xlink","http://www.w3.org/1999/xlink"),c.appendChild(h),h.appendChild(g("rect",{fill:b.colorDark,width:"1",height:"1",id:"template"}));for(var i=0;d>i;i++)for(var j=0;d>j;j++)if(a.isDark(i,j)){var k=g("use",{x:String(i),y:String(j)});k.setAttributeNS("http://www.w3.org/1999/xlink","href","#template"),h.appendChild(k)}},a.prototype.clear=function(){for(;this._el.hasChildNodes();)this._el.removeChild(this._el.lastChild)},a}(),p="svg"===document.documentElement.tagName.toLowerCase(),q=p?o:m()?function(){function a(){this._elImage.src=this._elCanvas.toDataURL("image/png"),this._elImage.style.display="block",this._elCanvas.style.display="none"}function d(a,b){var c=this;if(c._fFail=b,c._fSuccess=a,null===c._bSupportDataURI){var d=document.createElement("img"),e=function(){c._bSupportDataURI=!1,c._fFail&&_fFail.call(c)},f=function(){c._bSupportDataURI=!0,c._fSuccess&&c._fSuccess.call(c)};return d.onabort=e,d.onerror=e,d.onload=f,d.src="data:image/gif;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg==",void 0}c._bSupportDataURI===!0&&c._fSuccess?c._fSuccess.call(c):c._bSupportDataURI===!1&&c._fFail&&c._fFail.call(c)}if(false){var b=1/window.devicePixelRatio,c=CanvasRenderingContext2D.prototype.drawImage;CanvasRenderingContext2D.prototype.drawImage=function(a,d,e,f,g,h,i,j){if("nodeName"in a&&/img/i.test(a.nodeName))for(var l=arguments.length-1;l>=1;l--)arguments[l]=arguments[l]*b;else"undefined"==typeof j&&(arguments[1]*=b,arguments[2]*=b,arguments[3]*=b,arguments[4]*=b);c.apply(this,arguments)}}var e=function(a,b){this._bIsPainted=!1,this._android=n(),this._htOption=b,this._elCanvas=document.createElement("canvas"),this._elCanvas.width=b.width,this._elCanvas.height=b.height,a.appendChild(this._elCanvas),this._el=a,this._oContext=this._elCanvas.getContext("2d"),this._bIsPainted=!1,this._elImage=document.createElement("img"),this._elImage.style.display="none",this._el.appendChild(this._elImage),this._bSupportDataURI=!0};return e.prototype.draw=function(a){var b=this._elImage,c=this._oContext,d=this._htOption,e=a.getModuleCount(),f=d.width/e,g=d.height/e,h=Math.round(f),i=Math.round(g);b.style.display="none",this.clear();for(var j=0;e>j;j++)for(var k=0;e>k;k++){var l=a.isDark(j,k),m=k*f,n=j*g;c.strokeStyle=l?d.colorDark:d.colorLight,c.lineWidth=1,c.fillStyle=l?d.colorDark:d.colorLight,c.fillRect(m,n,f,g),c.strokeRect(Math.floor(m)+.5,Math.floor(n)+.5,h,i),c.strokeRect(Math.ceil(m)-.5,Math.ceil(n)-.5,h,i)}this._bIsPainted=!0},e.prototype.makeImage=function(){this._bIsPainted&&d.call(this,a)},e.prototype.isPainted=function(){return this._bIsPainted},e.prototype.clear=function(){this._oContext.clearRect(0,0,this._elCanvas.width,this._elCanvas.height),this._bIsPainted=!1},e.prototype.round=function(a){return a?Math.floor(1e3*a)/1e3:a},e}():function(){var a=function(a,b){this._el=a,this._htOption=b};return a.prototype.draw=function(a){for(var b=this._htOption,c=this._el,d=a.getModuleCount(),e=Math.floor(b.width/d),f=Math.floor(b.height/d),g=['<table style="border:0;border-collapse:collapse;">'],h=0;d>h;h++){g.push("<tr>");for(var i=0;d>i;i++)g.push('<td style="border:0;border-collapse:collapse;padding:0;margin:0;width:'+e+"px;height:"+f+"px;background-color:"+(a.isDark(h,i)?b.colorDark:b.colorLight)+';"></td>');g.push("</tr>")}g.push("</table>"),c.innerHTML=g.join("");var j=c.childNodes[0],k=(b.width-j.offsetWidth)/2,l=(b.height-j.offsetHeight)/2;k>0&&l>0&&(j.style.margin=l+"px "+k+"px")},a.prototype.clear=function(){this._el.innerHTML=""},a}();QRCode=function(a,b){if(this._htOption={width:256,height:256,typeNumber:4,colorDark:"#000000",colorLight:"#ffffff",correctLevel:d.H},"string"==typeof b&&(b={text:b}),b)for(var c in b)this._htOption[c]=b[c];"string"==typeof a&&(a=document.getElementById(a)),this._android=n(),this._el=a,this._oQRCode=null,this._oDrawing=new q(this._el,this._htOption),this._htOption.text&&this.makeCode(this._htOption.text)},QRCode.prototype.makeCode=function(a){this._oQRCode=new b(r(a,this._htOption.correctLevel),this._htOption.correctLevel),this._oQRCode.addData(a),this._oQRCode.make(),this._el.title=a,this._oDrawing.draw(this._oQRCode),this.makeImage()},QRCode.prototype.makeImage=function(){"function"==typeof this._oDrawing.makeImage&&(!this._android||this._android>=3)&&this._oDrawing.makeImage()},QRCode.prototype.clear=function(){this._oDrawing.clear()},QRCode.CorrectLevel=d}();


  // 3. 样式表 (Shadow DOM 内部样式隔离，杜绝目标网页样式污染)
  const CSS_TEXT = `
    :host {
      all: initial !important;
      position: static !important;
    }

    *, *::before, *::after {
      box-sizing: border-box !important;
      margin: 0 !important;
      padding: 0 !important;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif !important;
      -webkit-font-smoothing: antialiased !important;
      -moz-osx-font-smoothing: grayscale !important;
    }

    /* 悬浮小图标 (FAB) */
    .qr-fab {
      position: fixed !important;
      z-index: 2147483647 !important;
      width: 44px !important;
      height: 44px !important;
      border-radius: 50% !important;
      background: linear-gradient(135deg, #2563eb, #1d4ed8) !important;
      color: #ffffff !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      cursor: grab !important;
      box-shadow: 0 4px 14px rgba(37, 99, 235, 0.45), 0 2px 6px rgba(0, 0, 0, 0.15) !important;
      border: 1.5px solid rgba(255, 255, 255, 0.35) !important;
      touch-action: none !important;
      user-select: none !important;
      -webkit-user-select: none !important;
      -webkit-touch-callout: none !important;
      transition: transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s ease, opacity 0.2s ease !important;
    }

    .qr-fab:hover {
      transform: scale(1.08) !important;
      box-shadow: 0 6px 18px rgba(37, 99, 235, 0.55), 0 3px 8px rgba(0, 0, 0, 0.2) !important;
    }

    .qr-fab:active, .qr-fab.dragging {
      cursor: grabbing !important;
      transform: scale(1.12) !important;
      box-shadow: 0 8px 24px rgba(37, 99, 235, 0.65) !important;
    }

    .qr-fab.hidden {
      opacity: 0 !important;
      pointer-events: none !important;
      transform: scale(0.55) !important;
    }

    .qr-fab svg {
      width: 22px !important;
      height: 22px !important;
      stroke: #ffffff !important;
      stroke-width: 2 !important;
      fill: none !important;
      pointer-events: none !important;
    }

    /* 遮罩背景 (轻量半透明，点击快速收起) */
    .qr-backdrop {
      position: fixed !important;
      top: 0 !important;
      left: 0 !important;
      width: 100vw !important;
      height: 100vh !important;
      background: rgba(15, 23, 42, 0.38) !important;
      backdrop-filter: blur(2px) !important;
      -webkit-backdrop-filter: blur(2px) !important;
      z-index: 2147483645 !important;
      opacity: 0 !important;
      pointer-events: none !important;
      transition: opacity 0.22s ease !important;
    }

    .qr-backdrop.active {
      opacity: 1 !important;
      pointer-events: auto !important;
    }

    /* 展开卡片 */
    .qr-card {
      position: fixed !important;
      z-index: 2147483647 !important;
      width: 276px !important;
      max-width: calc(100vw - 32px) !important;
      background: #ffffff !important;
      border-radius: 18px !important;
      box-shadow: 0 20px 48px -6px rgba(15, 23, 42, 0.22), 0 8px 20px -4px rgba(15, 23, 42, 0.1) !important;
      border: 1px solid #f1f5f9 !important;
      padding: 16px !important;
      display: flex !important;
      flex-direction: column !important;
      align-items: center !important;
      opacity: 0 !important;
      transform: scale(0.88) !important;
      pointer-events: none !important;
      transition: opacity 0.22s cubic-bezier(0.16, 1, 0.3, 1), transform 0.22s cubic-bezier(0.16, 1, 0.3, 1) !important;
    }

    .qr-card.active {
      opacity: 1 !important;
      transform: scale(1) !important;
      pointer-events: auto !important;
    }

    /* 卡片顶部标题栏 */
    .qr-card-header {
      width: 100% !important;
      display: flex !important;
      align-items: center !important;
      justify-content: space-between !important;
      margin-bottom: 12px !important;
    }

    .qr-card-title-group {
      display: flex !important;
      align-items: center !important;
      gap: 6px !important;
    }

    .qr-card-badge {
      background: #eff6ff !important;
      color: #2563eb !important;
      font-size: 10px !important;
      font-weight: 700 !important;
      padding: 2px 6px !important;
      border-radius: 4px !important;
      letter-spacing: 0.5px !important;
    }

    .qr-card-title {
      font-size: 14px !important;
      font-weight: 600 !important;
      color: #1e293b !important;
    }

    .qr-close-btn {
      background: transparent !important;
      border: none !important;
      cursor: pointer !important;
      color: #94a3b8 !important;
      width: 28px !important;
      height: 28px !important;
      border-radius: 50% !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      transition: background 0.15s ease, color 0.15s ease !important;
    }

    .qr-close-btn:hover {
      background: #f1f5f9 !important;
      color: #475569 !important;
    }

    /* 二维码展示区 (核心可点击区域：再次点击二维码立即收起) */
    .qr-code-box {
      width: 100% !important;
      max-width: 100% !important;
      overflow: hidden !important;
      background: #ffffff !important;
      border: 1.5px solid #e2e8f0 !important;
      border-radius: 14px !important;
      padding: 12px 10px 10px 10px !important;
      display: flex !important;
      flex-direction: column !important;
      align-items: center !important;
      justify-content: center !important;
      cursor: pointer !important;
      position: relative !important;
      transition: border-color 0.2s ease, transform 0.15s ease, box-shadow 0.2s ease !important;
      user-select: none !important;
      -webkit-user-select: none !important;
    }

    .qr-code-box:hover {
      border-color: #3b82f6 !important;
      box-shadow: 0 4px 14px rgba(59, 130, 246, 0.14) !important;
    }

    .qr-code-box:active {
      transform: scale(0.985) !important;
    }

    .qr-code-target {
      width: 195px !important;
      height: 195px !important;
      max-width: 100% !important;
      position: relative !important;
      overflow: hidden !important;
      margin: 0 auto !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      background: #ffffff !important;
      cursor: pointer !important;
    }

    /* 必须隐藏底层绘图的 canvas 缓存，只显示最终生成的 img，避免双图并排撑爆容器 */
    .qr-code-target canvas {
      display: none !important;
      width: 0 !important;
      height: 0 !important;
      visibility: hidden !important;
    }

    .qr-code-target img {
      display: block !important;
      width: 195px !important;
      height: 195px !important;
      max-width: 100% !important;
      max-height: 100% !important;
      object-fit: contain !important;
      border-radius: 4px !important;
      cursor: pointer !important;
      margin: 0 auto !important;
    }

    /* 提示文案：再次点击二维码即可收起 */
    .qr-tap-hint {
      margin-top: 8px !important;
      display: flex !important;
      align-items: center !important;
      gap: 4px !important;
      font-size: 11px !important;
      color: #64748b !important;
      pointer-events: none !important;
    }

    .qr-tap-hint svg {
      color: #3b82f6 !important;
      width: 13px !important;
      height: 13px !important;
    }

    /* 底部链接与操作栏 */
    .qr-info-section {
      width: 100% !important;
      margin-top: 12px !important;
      display: flex !important;
      flex-direction: column !important;
      gap: 8px !important;
    }

    .qr-url-wrapper {
      width: 100% !important;
      background: #f8fafc !important;
      border: 1px solid #f1f5f9 !important;
      border-radius: 8px !important;
      padding: 6px 10px !important;
      overflow: hidden !important;
      white-space: nowrap !important;
      text-overflow: ellipsis !important;
      font-size: 11px !important;
      color: #64748b !important;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace !important;
    }

    .qr-action-row {
      width: 100% !important;
      display: flex !important;
      align-items: center !important;
      gap: 8px !important;
    }

    .qr-action-btn {
      border: none !important;
      outline: none !important;
      cursor: pointer !important;
      border-radius: 8px !important;
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      gap: 5px !important;
      font-size: 12px !important;
      font-weight: 500 !important;
      transition: all 0.15s ease !important;
      padding: 7px 12px !important;
    }

    .qr-copy-btn {
      flex: 1 !important;
      background: #f1f5f9 !important;
      color: #334155 !important;
    }

    .qr-copy-btn:hover {
      background: #e2e8f0 !important;
      color: #0f172a !important;
    }

    .qr-copy-btn.copied {
      background: #dcfce7 !important;
      color: #15803d !important;
    }

    .qr-refresh-btn {
      background: #f1f5f9 !important;
      color: #64748b !important;
      padding: 7px 10px !important;
    }

    .qr-refresh-btn:hover {
      background: #e2e8f0 !important;
      color: #1e293b !important;
    }

    /* 手机端界面精调 (屏幕宽度 <= 640px) */
    @media (max-width: 640px) {
      .qr-fab {
        width: 46px !important;
        height: 46px !important;
      }
      .qr-fab svg {
        width: 23px !important;
        height: 23px !important;
      }
      .qr-card {
        left: 50% !important;
        top: 50% !important;
        width: calc(100vw - 32px) !important;
        max-width: 290px !important;
        padding: 14px !important;
        transform: translate(-50%, -50%) scale(0.88) !important;
      }
      .qr-card.active {
        transform: translate(-50%, -50%) scale(1) !important;
      }
      .qr-code-target {
        width: 185px !important;
        height: 185px !important;
      }
      .qr-code-target img {
        width: 185px !important;
        height: 185px !important;
        max-width: 185px !important;
        max-height: 185px !important;
      }
    }
  `;

  // 4. 构建 Shadow DOM 宿主
  const host = document.createElement('div');
  host.id = '__url_to_qrcode_host__';
  const shadow = host.attachShadow({ mode: 'open' });

  // 注入样式
  const styleEl = document.createElement('style');
  styleEl.textContent = CSS_TEXT;
  shadow.appendChild(styleEl);

  // 注入 DOM 节点
  const container = document.createElement('div');
  container.innerHTML = `
    <div id="qr-fab" class="qr-fab" title="点击展开网页二维码 (按住可拖动位置)">
      <svg viewBox="0 0 24 24">
        <rect x="3" y="3" width="7" height="7" rx="1.5"></rect>
        <rect x="14" y="3" width="7" height="7" rx="1.5"></rect>
        <rect x="14" y="14" width="7" height="7" rx="1.5"></rect>
        <rect x="3" y="14" width="7" height="7" rx="1.5"></rect>
        <rect x="6" y="6" width="1" height="1" fill="#fff"></rect>
        <rect x="17" y="6" width="1" height="1" fill="#fff"></rect>
        <rect x="6" y="17" width="1" height="1" fill="#fff"></rect>
        <rect x="17" y="17" width="1" height="1" fill="#fff"></rect>
      </svg>
    </div>

    <div id="qr-backdrop" class="qr-backdrop"></div>

    <div id="qr-card" class="qr-card" role="dialog" aria-modal="true" aria-label="网页二维码">
      <div class="qr-card-header">
        <div class="qr-card-title-group">
          <span class="qr-card-badge">QR</span>
          <span class="qr-card-title">扫码访问当前网页</span>
        </div>
        <button id="qr-close-btn" class="qr-close-btn" type="button" title="收起" aria-label="关闭">
          <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2.2" fill="none" stroke-linecap="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      <div id="qr-code-box" class="qr-code-box" title="再次点击二维码立即收起">
        <div id="qr-code-target" class="qr-code-target"></div>
        <div class="qr-tap-hint">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
            <path d="M15 15l5-5-5-5"></path>
            <path d="M4 20v-7a4 4 0 0 1 4-4h12"></path>
          </svg>
          <span>再次点击二维码即可收起</span>
        </div>
      </div>

      <div class="qr-info-section">
        <div class="qr-url-wrapper" id="qr-url-wrapper" title="当前网页链接">
          <span id="qr-url-text" class="qr-url-text"></span>
        </div>
        <div class="qr-action-row">
          <button id="qr-copy-btn" class="qr-action-btn qr-copy-btn" type="button">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
            <span id="qr-copy-label">复制链接</span>
          </button>
          <button id="qr-refresh-btn" class="qr-action-btn qr-refresh-btn" type="button" title="重新获取当前最新链接">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M23 4v6h-6"></path>
              <path d="M1 20v-6h6"></path>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
            </svg>
          </button>
        </div>
      </div>
    </div>
  `;
  shadow.appendChild(container);

  // 挂载到根节点
  (document.body || document.documentElement).appendChild(host);

  // 5. 元素句柄获取
  const fab = shadow.getElementById('qr-fab') || shadow.querySelector('#qr-fab');
  const backdrop = shadow.getElementById('qr-backdrop') || shadow.querySelector('#qr-backdrop');
  const card = shadow.getElementById('qr-card') || shadow.querySelector('#qr-card');
  const codeBox = shadow.getElementById('qr-code-box') || shadow.querySelector('#qr-code-box');
  const codeTarget = shadow.getElementById('qr-code-target') || shadow.querySelector('#qr-code-target');
  const closeBtn = shadow.getElementById('qr-close-btn') || shadow.querySelector('#qr-close-btn');
  const urlText = shadow.getElementById('qr-url-text') || shadow.querySelector('#qr-url-text');
  const copyBtn = shadow.getElementById('qr-copy-btn') || shadow.querySelector('#qr-copy-btn');
  const copyLabel = shadow.getElementById('qr-copy-label') || shadow.querySelector('#qr-copy-label');
  const refreshBtn = shadow.getElementById('qr-refresh-btn') || shadow.querySelector('#qr-refresh-btn');

  // 6. 状态变量
  let isOpen = false;
  let lastUrl = '';
  let justDragged = false;
  let dragTimer = null;

  // 存储键名
  const STORAGE_KEY = '__url_to_qrcode_fab_pos__';

  function getStoredPosition() {
    try {
      if (typeof GM_getValue === 'function') {
        const val = GM_getValue('fab_pos', null);
        if (val) return typeof val === 'string' ? JSON.parse(val) : val;
      }
      const lsVal = localStorage.getItem(STORAGE_KEY);
      if (lsVal) return JSON.parse(lsVal);
    } catch (e) {}
    return null;
  }

  function savePosition(x, y) {
    const data = { x: Math.round(x), y: Math.round(y) };
    try {
      if (typeof GM_setValue === 'function') {
        GM_setValue('fab_pos', JSON.stringify(data));
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {}
  }

  // 边界约束与初始化定位
  function clampAndSetFabPosition(x, y, save = false) {
    const fabSize = 44;
    const padding = 8;
    const maxX = Math.max(padding, window.innerWidth - fabSize - padding);
    const maxY = Math.max(padding, window.innerHeight - fabSize - padding);

    const clampedX = Math.max(padding, Math.min(maxX, x));
    const clampedY = Math.max(padding, Math.min(maxY, y));

    fab.style.left = clampedX + 'px';
    fab.style.top = clampedY + 'px';

    if (save) {
      savePosition(clampedX, clampedY);
    }
    return { x: clampedX, y: clampedY };
  }

  function initFabPosition() {
    const saved = getStoredPosition();
    const fabSize = 44;
    if (saved && typeof saved.x === 'number' && typeof saved.y === 'number') {
      clampAndSetFabPosition(saved.x, saved.y, false);
    } else {
      // 默认靠右下侧停靠 (距右边缘 12px，垂直约屏幕 65% 高度)
      const defX = window.innerWidth - fabSize - 12;
      const defY = Math.max(80, Math.min(window.innerHeight - fabSize - 80, Math.round(window.innerHeight * 0.65)));
      clampAndSetFabPosition(defX, defY, false);
    }
  }

  initFabPosition();

  // 窗口尺寸变化重新吸附边界
  window.addEventListener('resize', () => {
    const rect = fab.getBoundingClientRect();
    clampAndSetFabPosition(rect.left, rect.top, true);
    if (isOpen) {
      positionCard();
    }
  });

  // 7. 拖拽逻辑 (同时支持 Mouse、Pointer 与 Touch 事件，区分点击与拖动)
  let isPointerDown = false;
  let isDragging = false;
  let startPointerX = 0;
  let startPointerY = 0;
  let startFabLeft = 0;
  let startFabTop = 0;

  function onPointerDown(e) {
    // 仅响应鼠标左键或触控
    if (e.button && e.button !== 0) return;

    isPointerDown = true;
    isDragging = false;
    startPointerX = e.clientX || (e.touches && e.touches[0].clientX) || 0;
    startPointerY = e.clientY || (e.touches && e.touches[0].clientY) || 0;

    const rect = fab.getBoundingClientRect();
    startFabLeft = rect.left;
    startFabTop = rect.top;

    if (e.pointerId && typeof fab.setPointerCapture === 'function') {
      try {
        fab.setPointerCapture(e.pointerId);
      } catch (err) {}
    }
  }

  function onPointerMove(e) {
    if (!isPointerDown) return;

    const curX = e.clientX || (e.touches && e.touches[0].clientX) || 0;
    const curY = e.clientY || (e.touches && e.touches[0].clientY) || 0;
    const dx = curX - startPointerX;
    const dy = curY - startPointerY;

    // 移动距离大于 6px 判定为拖拽行为，避免普通点击抖动被误判
    if (!isDragging && Math.hypot(dx, dy) > 6) {
      isDragging = true;
      fab.classList.add('dragging');
    }

    if (isDragging) {
      e.preventDefault();
      clampAndSetFabPosition(startFabLeft + dx, startFabTop + dy, false);
    }
  }

  function onPointerUp(e) {
    if (!isPointerDown) return;
    isPointerDown = false;

    if (e.pointerId && typeof fab.releasePointerCapture === 'function') {
      try {
        fab.releasePointerCapture(e.pointerId);
      } catch (err) {}
    }

    if (isDragging) {
      isDragging = false;
      fab.classList.remove('dragging');

      const rect = fab.getBoundingClientRect();
      clampAndSetFabPosition(rect.left, rect.top, true);

      // 设置防误触标记，避免拖拽结束瞬间触发点击展开
      justDragged = true;
      clearTimeout(dragTimer);
      dragTimer = setTimeout(() => {
        justDragged = false;
      }, 120);
    }
  }

  // 绑定 Pointer Events (桌面端 + 现代移动端主流)
  fab.addEventListener('pointerdown', onPointerDown, { passive: false });
  window.addEventListener('pointermove', onPointerMove, { passive: false });
  window.addEventListener('pointerup', onPointerUp, { passive: false });
  window.addEventListener('pointercancel', onPointerUp, { passive: false });

  // 触控兜底 (兼容部分旧版安卓 WebView 或 X浏览器)
  fab.addEventListener('touchstart', onPointerDown, { passive: false });
  window.addEventListener('touchmove', onPointerMove, { passive: false });
  window.addEventListener('touchend', onPointerUp, { passive: false });
  window.addEventListener('touchcancel', onPointerUp, { passive: false });

  // 8. 卡片定位算法
  function positionCard() {
    if (window.innerWidth <= 640) {
      // 手机端由 CSS media query 居中展示
      card.style.left = '';
      card.style.top = '';
      return;
    }

    // 桌面端紧邻悬浮小图标侧边展开
    const fabRect = fab.getBoundingClientRect();
    const cardWidth = 276;
    const cardHeight = 350;
    const margin = 12;

    // 默认优先靠左侧展开，若左边放不下则靠右展开
    let left = fabRect.left - cardWidth - margin;
    if (left < 16) {
      left = fabRect.right + margin;
    }
    if (left + cardWidth > window.innerWidth - 16) {
      left = window.innerWidth - cardWidth - 16;
    }
    left = Math.max(16, left);

    let top = fabRect.top;
    if (top + cardHeight > window.innerHeight - 16) {
      top = window.innerHeight - cardHeight - 16;
    }
    top = Math.max(16, top);

    card.style.left = left + 'px';
    card.style.top = top + 'px';
  }

  // 9. 二维码生成核心
  function generateQRCode(url) {
    codeTarget.innerHTML = '';
    const size = window.innerWidth <= 640 ? 185 : 195;

    try {
      new QRCode(codeTarget, {
        text: url,
        width: size,
        height: size,
        colorDark: '#000000',
        colorLight: '#ffffff',
        correctLevel: QRCode.CorrectLevel.M
      });
    } catch (err) {
      console.warn('[QR Generator] Error generating QR with Level M, falling back to Level L:', err);
      try {
        new QRCode(codeTarget, {
          text: url,
          width: size,
          height: size,
          colorDark: '#000000',
          colorLight: '#ffffff',
          correctLevel: QRCode.CorrectLevel.L
        });
      } catch (err2) {
        console.error('[QR Generator] Error generating QR:', err2);
        codeTarget.innerHTML = `<div style="color:#ef4444;font-size:12px;padding:20px;text-align:center;">二维码生成失败<br><span style="font-size:10px;color:#94a3b8;">${err2 && err2.message ? err2.message : '数据异常'}</span></div>`;
      }
    }

    // 防御性处理：确保隐藏底层的 canvas 缓冲层，只保留单一的 img 元素
    const canvas = codeTarget.querySelector('canvas');
    if (canvas) {
      canvas.style.display = 'none';
      canvas.style.width = '0px';
      canvas.style.height = '0px';
      canvas.style.visibility = 'hidden';
    }
  }

  // 10. 展开与收起交互 (核心需求：点击展开，再次点击二维码收起恢复小图标)
  function openQR() {
    if (isOpen) return;
    const currentUrl = window.location.href;

    // 动态判断是否需要重新渲染二维码 (支持 SPA 单页路由无刷新切换)
    if (currentUrl !== lastUrl || !codeTarget.querySelector('img')) {
      generateQRCode(currentUrl);
      lastUrl = currentUrl;
      urlText.textContent = currentUrl;
    }

    positionCard();
    isOpen = true;

    backdrop.classList.add('active');
    card.classList.add('active');
    fab.classList.add('hidden'); // 展开时收起小图标，视觉更沉浸
  }

  function closeQR() {
    if (!isOpen) return;
    isOpen = false;

    backdrop.classList.remove('active');
    card.classList.remove('active');
    fab.classList.remove('hidden'); // 恢复原始小图标
  }

  function toggleQR() {
    if (justDragged) return;
    if (isOpen) {
      closeQR();
    } else {
      openQR();
    }
  }

  // 悬浮小图标点击事件
  fab.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleQR();
  });

  // 核心：点击二维码区域，立即收起并恢复小图标！
  codeBox.addEventListener('click', (e) => {
    e.stopPropagation();
    closeQR();
  });

  // 点击关闭按钮收起
  closeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    closeQR();
  });

  // 点击遮罩背景收起
  backdrop.addEventListener('click', () => {
    closeQR();
  });

  // ESC 快捷键收起
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isOpen) {
      closeQR();
    }
  });

  // 11. 辅助功能：复制链接
  copyBtn.addEventListener('click', async (e) => {
    e.stopPropagation();
    const currentUrl = window.location.href;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(currentUrl);
      } else {
        // 传统 fallback
        const input = document.createElement('textarea');
        input.value = currentUrl;
        input.style.position = 'fixed';
        input.style.opacity = '0';
        document.body.appendChild(input);
        input.focus();
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
      }

      copyLabel.textContent = '已复制!';
      copyBtn.classList.add('copied');
      setTimeout(() => {
        copyLabel.textContent = '复制链接';
        copyBtn.classList.remove('copied');
      }, 1500);
    } catch (err) {
      copyLabel.textContent = '复制失败';
      setTimeout(() => {
        copyLabel.textContent = '复制链接';
      }, 1500);
    }
  });

  // 刷新当前链接 (针对 SPA 网页路由变更后手动重取)
  refreshBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const currentUrl = window.location.href;
    generateQRCode(currentUrl);
    lastUrl = currentUrl;
    urlText.textContent = currentUrl;

    refreshBtn.style.transform = 'rotate(360deg)';
    refreshBtn.style.transition = 'transform 0.4s ease';
    setTimeout(() => {
      refreshBtn.style.transform = 'none';
      refreshBtn.style.transition = 'none';
    }, 450);
  });

  // 12. 注册油猴菜单命令
  if (typeof GM_registerMenuCommand === 'function') {
    GM_registerMenuCommand('生成当前网页二维码', () => {
      openQR();
    });
    GM_registerMenuCommand('重置悬浮图标位置', () => {
      const fabSize = 44;
      const defX = window.innerWidth - fabSize - 12;
      const defY = Math.max(80, Math.min(window.innerHeight - fabSize - 80, Math.round(window.innerHeight * 0.65)));
      clampAndSetFabPosition(defX, defY, true);
    });
  }
})();