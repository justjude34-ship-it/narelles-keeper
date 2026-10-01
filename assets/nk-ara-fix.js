!function(){function muteSpeak(){if(!window.speechSynthesis)return;try{window.speechSynthesis.cancel()}catch(e){}var syn=window.speechSynthesis;if(syn.__araTextOnly)return;syn.__araTextOnly=1;syn.speak=function(){try{syn.cancel()}catch(e){}}}
try{localStorage.setItem("nk.araVoice.v1","off")}catch(e){}
muteSpeak();
function hideVoiceBtn(){var btn=document.getElementById("btn-ara-voice");if(btn){btn.hidden=!0;btn.setAttribute("aria-hidden","true");btn.style.display="none";try{btn.remove()}catch(e){}}}
function hint(){var st=document.getElementById("ara-listen-status");if(st&&!st.__araTextOnly){st.__araTextOnly=1;if(!st.textContent||/Tap Talk to Ara/.test(st.textContent)||/Ara voice/.test(st.textContent)||/Ara text/.test(st.textContent)){st.textContent="Tap Talk to Ara, then speak. Ara answers in text on screen."}}}
function wire(){muteSpeak();hideVoiceBtn();hint()}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",wire);else wire();
setTimeout(wire,0);setTimeout(wire,400);setTimeout(muteSpeak,800);
}();
