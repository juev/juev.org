/* 	Twitter Trackbacks Widget v1.0
	Blog : http://www.moretechtips.net
	Project: http://code.google.com/p/twitter-trackbacks-widget/
	Copyright 2009 [Mike @ moretechtips.net] 
	Licensed under the Apache License, Version 2.0 
	(the "License"); you may not use this file except in compliance with the License. 
	You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0 
*/

(function($){ 
$.fn.twitterTrackbacks = function(allOptions) {  
	// This default options will apply on all matched elements unless element has his own options
	var defaults = {
		debug:0
		,url:''
		,url_querystring:0
		,n:10
		,show_n:0
		,inf_only:0
		,inf_tip:0
		,stay_time:5000
		,enter_time:200
		,exit_time:200
		,animate:'opacity'
		,show_avatar:1
		,show_author:0
		,show_date:1
		,image_width:32
		,reply:'reply'
		,retweet:'retweet'
		,topsy_author_url:0
		,header:'<h2>Twitter trackback</h2>'
		,info:''
	};
	allOptions = $.extend({}, defaults, allOptions);
		
	return this.each(function() {  
		var div = $(this);
		var count=0, ul=null,vp=-1,startI=-1,endI=-1;
		var op = allOptions;
		var effectParams = new Object;
		var topsyURL = '';
		
		//JSON is loaded
		var requested = function(json){
			// Errors!
			if(!json.response.list) {
				if(op.debug) div.html('<b style="color:red">Error: '+(json.response.errors? json.response.errors.join(','):'unkown') +'</b>');
				return; //exit
			}
			var rs = json.response.list;
			count = rs.length;
			if(count==0) return; //no results
			topsyURL = json.response.topsy_trackback_url;
			
			//Start output
			ul = $('<ul class="ttw-inner"></ul>').appendTo(div.html(op.header));
			
			//append tweets 
			for(var i=0; i<count; i++) addLI(rs[i]);
			
			//start fade cycle if show_n > 0
			if(op.show_n>0) fadeIn();
		};
		// append tweet li 
		var addLI = function(x) {
			//author username
			var uname = x.author.url.replace('http://twitter.com/','');
			//tweet id
			var id ='';
			//permalink_url can be missing when it is Topsy Top Story trackback
			// also set Topsy image url cause, the returned one is 404
			if(x.permalink_url) id= x.permalink_url.replace('http://twitter.com/'+uname+'/status/','');
			else x.author.photo_url = 'http://cdn2.topsy.com/asset/master.16412.82c193e596/img/twitter_user.png';
			
			if(!x.author.influence_level) x.author.influence_level = 0;
			//Init style as display:none if transition is enabled
			var li = $('<li'+ (op.show_n>0?' style="display:none"':'' ) +' class="ttw-inf-'+x.author.influence_level+'">'
				+ (op.show_avatar? '<span class="ttw-author-img">'
									+'<a href="'+ (op.topsy_author_url? x.author.topsy_author_url: x.author.url) +'"'
									+' title="'+ x.author.name 
									+(op.inf_tip?' [influence level: '+ x.author.influence_level +'/10]':'') +'">'
										+'<img src="'+ x.author.photo_url +'" height="'+op.image_width
										+'" width="'+op.image_width+'" border="0"/>'
									+'</a>'
									+'</span>' :'')
				+'<span class="ttw-body">'
					+ (op.show_author? '<strong>'
						+'<a href="'+ (op.topsy_author_url? x.author.topsy_author_url: x.author.url) +'">'
							+x.author.name
						+'</a>'
					+'</strong>' :'')
					+'<span class="ttw-content">'+ x.content +'</span>'
					+'<span class="ttw-meta">'
						+ (op.show_date? '<a class="ttw-date" href="'+ (x.permalink_url? x.permalink_url: topsyURL) +'">'+ x.date_alpha +'</a>' :'')
						+ (op.reply && id? ' - <a class="ttw-reply" href="http://twitter.com/home?status=@'
										+ uname +'%20&in_reply_to_status_id='+ id 
										+'&in_reply_to='+uname+'">'+ op.reply +'</a>' :'')
						+ (op.retweet? ' - <a class="ttw-retweet" href="http://twitter.com/home?status=' 
										+ encodeURIComponent('RT @'+uname+' '+ x.content) +'">'
										+ op.retweet +'</a>' :'')
						+ (op.info? ' - '+ op.info  :'')
					+'</span>'
				+'</span>'
			+'</li>').appendTo(ul);
			var cont = $('span.ttw-content',li);
			cont.html(linkify(cont.html()));
		};
		
		// Fade out the current tweet
		var fadeOut = function(){
			$('li',ul).eq(startI).fadeOut(op.exit_time,fadeIn);
			if (op.show_n>1) $('li',ul).slice(startI+1, endI).fadeOut(op.exit_time);
		};
		
		// Fade in the next tweet
		var fadeIn = function(){
			//Incremnet visible page index
			vp++;
			if (vp*op.show_n>=count) vp=0;
			
			startI = vp*op.show_n;
			endI = (vp+1)*op.show_n;
			
			$('li',ul).eq(startI).animate(effectParams,op.enter_time,"linear", fadeStill);
			if (op.show_n>1) $('li',ul).slice(startI+1, endI).animate(effectParams,op.enter_time,"linear");
		};
		// Dummy fade in effect to hold current tweet b4 fading it out
		var fadeStill = function(){
			ul.animate({opacity:1},op.stay_time,"linear", fadeOut);
		};
		
		//parse links, user id's, hashtags
		var linkify= function(d){
			return d.replace(/\bhttps?\:\/\/\S+/gi, function(b){
				var c='';
				b= b.replace(/(\.*|\?*|\!*)$/,function(m,a){
					c=a;
					return ''
				});
				return '<a class="ttw-link" href="'+b+'">'+((b.length>25)?b.substr(0,24)+'...':b)+'</a>'+c;
			})
			.replace(/\B\@([A-Z0-9_]{1,15})/gi,'@<a class="ttw-at" href="http://twitter.com/$1">$1</a>')
			.replace(/\B\#([A-Z0-9_]+)/gi,'<a class="ttw-hashtag" href="http://search.twitter.com/search?q=%23$1">#$1</a>')
		};

		//request JSON
		var request = function() {
			var data = {url:op.url,infonly:op.inf_only,perpage:op.n};
			$.ajax({url:'http://otter.topsy.com/trackbacks.js',data:data,success:requested,dataType:'jsonp'});
		};
		// init url, options, call request
		var init = function(){
			//override passed options by element embedded options if any
			if (div.attr('options')){
				try { 
					op = eval('('+div.attr('options')+')'); 
				} catch(e) { 
					div.html('<b style="color:red">'+e+'</b>');
					return;
				}
				op = $.extend({}, defaults, op);
			};	
			//create effect param and set it to 'show'
			effectParams[op.animate] = 'show';
			
			//Set URL if wasn't, by default query string are not added
			if(!op.url) op.url =location.protocol+'//'+location.host+location.pathname
								+ (op.url_querystring? location.search:'');
			//request
			request();
		};
		init();
	});  
}
})(jQuery);  

//auto load div with class set to twitter-trackbacks
jQuery(document).ready(function(){
	jQuery('div.twitter-trackbacks').twitterTrackbacks();
});
