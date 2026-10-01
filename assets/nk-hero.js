(function(){
  var img=document.getElementById("hero-still");
  if(img && !img.getAttribute("src")) img.src="assets/hero-lotus-cool.jpg";
  var v=document.querySelector(".hero-video"); if(v) v.remove();
  var b=document.querySelector(".hero-sound-btn"); if(b) b.remove();
})();