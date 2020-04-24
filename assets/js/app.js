Shadowbox.init();
var links = document.getElementsByTagName('a');
for(var i=0;i<links.length;i++)
{
  if (links[i].href.match(/(gif|png|jpg|jpeg)$/))
  {
    links[i].setAttribute('rel', 'shadowbox');
  }
}
