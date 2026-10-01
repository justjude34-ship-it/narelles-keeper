!function(){function fail(m){var e=document.createElement("p");e.style.cssText="color:#b9e4ff;padding:1.25rem;font-size:1.15rem";e.textContent=m;document.body&&document.body.appendChild(e)}
var urls=["assets/nk-p0.js","assets/nk-p1.js","assets/nk-p2.js","assets/nk-p3.js","assets/nk-ara-voice.js"],parts=[],i=0;
function next(){if(i>=urls.length){try{(0,eval)(parts.join(""))}catch(e){fail("Keeper failed to load. Please refresh.")}return}
fetch(urls[i++],{cache:"no-cache"}).then(function(r){if(!r.ok)throw 0;return r.text()}).then(function(t){parts.push(t);next()}).catch(function(){fail("Keeper failed to load. Please refresh.")})}
next()}();
