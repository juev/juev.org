<?xml version="1.0" encoding="utf-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
<xsl:output method="html" version="1.0" encoding="UTF-8" indent="yes"/>
<xsl:template match="/">
<html xmlns="http://www.w3.org/1999/xhtml" lang="ru">
<head>
	<title>RSS-лента - <xsl:value-of select="/rss/channel/title"/></title>
	<meta charset="utf-8"/>
	<meta name="viewport" content="width=device-width, initial-scale=1"/>
	<meta name="theme-color" content="#BC5007"/>
	<style type="text/css">
		html, body {
			height: 100%;
			font-family: arial, serif;
			margin: 0;
			padding: 0;
		}
		
		@media (min-width: 1000px) {
			html, body {
				font-family: 'Open Sans', arial, serif;
			}
		}
		
		body {
			border-top: 3px solid #BC5007;
			font-size: 16px;
			line-height: 1.6;
			color: #333;
			background: #fff;
		}
		
		.width-fix {
			margin-right: auto;
			margin-left: auto;
			max-width: 685px;
		}
		
		.navigation {
			height: 108px;
			background-color: rgb(25, 30, 34);
			color: #fff;
			vertical-align: middle;
			font-size: 15px;
		}
		
		.navigation .width-fix {
			padding-top: 36px;
		}
		
		.navigation a {
			color: #f7f6ee;
			text-decoration: none;
			text-transform: uppercase;
			font-family: Helvetica, sans-serif;
			font-weight: normal;
		}
		
		.navigation a:hover {
			color: #BC5007;
			text-decoration: none;
		}
		
		.primary-content {
			padding: 20px;
			border-bottom: 7px solid #7f808a;
			background: #fff;
		}
		
		h1 {
			font-family: Arial, Verdana, sans-serif;
			font-weight: bold;
			font-size: 28px;
			line-height: 28px;
			color: #444;
			margin: 15px 0;
		}
		
		h2 {
			font-family: Arial, Verdana, sans-serif;
			font-weight: bold;
			font-size: 24px;
			line-height: 30px;
			color: #444;
			margin: 15px 0;
		}
		
		.rss-info {
			background: #f9f9f9;
			border: 1px solid #ddd;
			padding: 20px;
			margin: 20px 0;
		}
		
		.rss-info h2 {
			color: #444;
			margin-top: 0;
		}
		
		.rss-info p {
			margin: 10px 0;
			margin-top: 1em;
			margin-bottom: 1em;
		}
		
		.rss-info code {
			font-family: monospace;
			color: #EC4899;
			background: #F6F6F6;
			padding: 2px 5px;
		}
		
		.rss-info code:before,
		.rss-info code:after {
			content: "`";
			display: inline;
		}
		
		.feed-description {
			margin: 20px 0;
			font-size: 1.1em;
			color: #666;
		}
		
		.items h2 {
			color: #444;
			margin: 15px 0;
			font-family: Arial, Verdana, sans-serif;
			font-weight: bold;
			font-size: 24px;
			line-height: 30px;
		}
		
		.item {
			margin: 20px 0;
			padding: 15px 0;
			border-bottom: 1px solid #eee;
		}
		
		.item:last-child {
			border-bottom: none;
		}
		
		.item h3 {
			font-family: Arial, Verdana, sans-serif;
			font-weight: bold;
			font-size: 28px;
			line-height: 28px;
			margin: 15px 0;
		}
		
		.item h3 a {
			color: #444;
			text-decoration: none;
			border-bottom: none;
		}
		
		.item h3 a:hover {
			color: #d04000;
			border-color: rgba(208, 64, 0, 0.15);
			text-decoration: none;
		}
		
		.item-date {
			color: #555;
			font-size: 8pt;
			font-weight: bold;
			font-family: Verdana, Helvetica, Arial, sans-serif;
			margin-bottom: 10px;
		}
		
		.item-description {
			color: #333;
			line-height: 1.6;
			margin-top: 1em;
			margin-bottom: 1em;
		}
		
		.item-description a {
			color: #4078C0;
			text-decoration: none;
			border-bottom: 1px solid rgba(0, 0, 160, 0.15);
		}
		
		.item-description a:hover {
			color: #d04000;
			border-color: rgba(208, 64, 0, 0.15);
		}
		
		/* Стили для подзаголовков внутри контента */
		.item-description h2,
		.item-description h3 {
			color: #4078C0;
			font-family: Arial, Verdana, sans-serif;
			font-weight: bold;
			margin: 15px 0;
		}

		.item-description h2 {
			font-size: 24px;
			line-height: 30px;
		}

		.item-description h3 {
			font-size: 18px;
			line-height: 20px;
		}
		
		.footer {
			padding: 5px;
			height: 95px;
			color: #bbb;
			position: relative;
			background-color: rgb(25, 30, 34);
		}
		
		.footer .width-fix {
			padding-top: 15px;
		}
		
		.footer p {
			margin: 15px 0 5px;
			text-transform: uppercase;
			letter-spacing: 1px;
			font: 11px/1.5 Helvetica, sans-serif;
			text-align: center;
		}
		
		.footer a {
			color: #eee;
			text-decoration: none;
		}
		
		.footer a:hover {
			color: #BC5007;
			text-decoration: none;
		}
		
		@media (max-width: 480px) {
			h1 {
				font-size: 24px;
			}
			
			.width-fix {
				padding: 0 20px;
			}
			
			.navigation .width-fix {
				padding: 36px 20px 0;
			}
			
			.rss-info {
				padding: 15px;
			}
		}
	</style>
</head>
<body>
	<div class="navigation">
		<div class="width-fix">
			<a href="{/rss/channel/link}">← Вернуться на сайт</a>
		</div>
	</div>
	
	<div class="primary-content">
		<div class="width-fix">
			<h1><xsl:value-of select="/rss/channel/title"/></h1>
			
			<div class="feed-description">
				<xsl:value-of select="/rss/channel/description"/>
			</div>
			
			<div class="rss-info">
				<h2>🔗 RSS-лента</h2>
				<p>Это RSS-лента блога. RSS позволяет подписаться на обновления и читать новые статьи в удобной RSS-читалке.</p>
				<p><strong>URL ленты:</strong> <code><xsl:value-of select="/rss/channel/link"/>atom.xml</code></p>
				<p>Для подписки скопируйте этот URL и добавьте его в вашу RSS-читалку (например, Feedly, Inoreader, или другой).</p>
			</div>
			
			<div class="items">
				<h2>📰 Последние статьи</h2>
				<xsl:for-each select="/rss/channel/item">
					<div class="item">
						<h3><a href="{link}" target="_blank"><xsl:value-of select="title"/></a></h3>
						<div class="item-date">
							<xsl:value-of select="pubDate"/>
						</div>
						<div class="item-description">
							<xsl:value-of select="description" disable-output-escaping="yes"/>
						</div>
					</div>
				</xsl:for-each>
			</div>
		</div>
	</div>
	
	<div class="footer">
		<div class="width-fix">
			<p>© Denis Evsyukov • <a href="{/rss/channel/link}">www.juev.org</a></p>
		</div>
	</div>
</body>
</html>
</xsl:template>
</xsl:stylesheet>