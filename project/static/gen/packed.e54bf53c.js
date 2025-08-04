let current=0;let max=0;function toggleText(){const prev=current-1>=0?current-1:(max-1);document.getElementById(prev).classList.remove("remove");document.getElementById(current).classList.add("remove");document.getElementById(current).classList.remove("active");current=(current+1)%max;document.getElementById(current).classList.add("active");}
function indexInit(){nav=document.getElementById("nav");max=document.querySelectorAll("h1 span").length;setInterval(()=>toggleText(),1800);document.addEventListener("scroll",scrollEvent);}
if(document.readyState!=='loading'){indexInit();}else{document.addEventListener('DOMContentLoaded',function(){indexInit();});}
let nav;let isActive=false;function scrollEvent(){const active=window.scrollY>75;if(isActive==active)return;nav.classList.toggle("active",active)
isActive=active;}
function getCookie(name){const cookieString=document.cookie;const cookies=cookieString.split(';');for(const cookie of cookies){const[cookieName,cookieValue]=cookie.trim().split('=');if(cookieName===name)return cookieValue;}
return null;}
function toggleModal(id){document.body.classList.toggle("no-scroll");document.getElementById("dark-overlay").classList.toggle("active");document.getElementById(id+"-modal").classList.toggle("active");}
function continueEmail(){const input=document.getElementById("auth-email-input");if(!input.value)return input.focus();window.location.href="/login/email?email="+input.value;}