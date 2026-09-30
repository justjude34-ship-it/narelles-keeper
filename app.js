!function(){var N=14,loaded=0,failed=0;
function fail(msg){if(failed)return;failed=1;var e=document.createElement("p");e.style.cssText="color:#b9e4ff;padding:1.25rem;font-size:1.15rem";e.textContent=msg;document.body&&document.body.appendChild(e)}
function d(s){var n=atob(s),u=new Uint8Array(n.length);for(var i=0;i<n.length;i++)u[i]=n.charCodeAt(i);return u}
function run(){var a=self.__NK_B||[],s="";for(var i=0;i<N;i++){if(typeof a[i]!=="string"){fail("Keeper failed to load. Please refresh.");return}s+=a[i]}
if(typeof DecompressionStream==="undefined"){fail("Please open Keeper in Chrome or Edge for this update.");return}
new Response(new Blob([d(s)]).stream().pipeThrough(new DecompressionStream("gzip"))).text().then(function(c){(0,eval)(c)}).catch(function(){fail("Keeper failed to load. Please refresh.")})}
for(var i=0;i<N;i++){(function(i){var s=document.createElement("script");s.src="nk/b"+i+".js";s.async=false;s.onload=function(){loaded++;if(loaded===N)run()};s.onerror=function(){fail("Keeper failed to load. Please refresh.")};document.head.appendChild(s)})(i)}}();
