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
