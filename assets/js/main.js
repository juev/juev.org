if(!/android|iphone|ipod|ipad/i.test(navigator.userAgent)){$(document).ready(function(){$('a[href$=".png"],a[href$=".jpg"],a[href$=".jpeg"],a[href$=".gif"]').fancybox();});}

$.getScript("//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit", function(){
  function googleTranslateElementInit() {
    new google.translate.TranslateElement({
      pageLanguage: 'ru',
      multilanguagePage: true
    });
  }
});

$.getScript("//platform.twitter.com/widgets.js", function(){
});

document.getElementById("year").firstChild.data = (new Date).getFullYear();

(function() {
  var po = document.createElement('script'); po.type = 'text/javascript'; po.async = true;
  po.src = 'https://apis.google.com/js/plusone.js';
  var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(po, s);
})();

//<![CDATA[
var campisi = document.createElement('g:plusone'); 
campisi.setAttribute("align","left");
campisi.setAttribute("size","medium");
campisi.setAttribute("annotation","none");
document.getElementById("gplusone").appendChild(campisi);
//]]>