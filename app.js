!function(){function fail(m){var e=document.createElement("p");e.style.cssText="color:#b9e4ff;padding:1.25rem;font-size:1.15rem;position:relative;z-index:50";e.textContent=m;document.body&&document.body.appendChild(e)}
var urls=["assets/nk-p0.js","assets/nk-p1.js","assets/nk-p2.js","assets/nk-p3.js","assets/nk-ara-text.js"],parts=[],i=0;
function next(){if(i>=urls.length){try{(0,eval)(parts.join(""))}catch(e){fail("Keeper failed to load. Please refresh.")}return}
var url=urls[i++],opt=url.indexOf("nk-ara-text")!==-1;
fetch(url,{cache:"no-cache"}).then(function(r){if(!r.ok){if(opt)return null;throw 0}return r.text()}).then(function(t){if(t!=null)parts.push(t);next()}).catch(function(){if(opt){next();return}fail("Keeper failed to load. Please refresh.")})}
next()}();
