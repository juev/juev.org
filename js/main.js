var OptionsMixin = {
    options: {},
    requiredOptions: [],

    setOptions: function(options) {
        var i, key;

        for (i = 0; i < this.requiredOptions.length; i++) {
            key = this.requiredOptions[i];
            if (!(key in options))
                throw Error(key + ' is required option');
        }

        for (key in options)
            this.options[key] = options[key];
    }
}

var Service = Class.$extend({
    __include__: [OptionsMixin],
    requiredOptions: ['selector', 'url'],

    __init__: function(options) {
        this.setOptions(options);
        this.element = $(this.options.selector);
    },

    queryString: function() { return '?'; },
    getText: function() { return ''; },
    getUser: function() { return ''; },
    getTime: function() { return ''; },
    parseResponse: function() { },
    render: function() { },

    makeRequest: function() {
        var self = this;
        $.getJSON(this.options.apiurl + this.queryString() + '&callback=?',
                  function(data) {
                      self.parseResponse(data);
                  });
    },

    renderComments: function(comments) {
        var self = this;
        if (!comments)
            return;

        var list = $('<ul>');
        $.each(comments, function(i, item) {
            var li = ['<li><p>', self.getText(item), ' &mdash; ', self.getUser(item),
                      ' at ', self.getTime(item), '</p></li>'].join('');
            list.append(li);
        });
        this.element.append(list);
    }
});

var Twitter = Service.$extend({
    options: {
        apiurl: 'http://search.twitter.com/search.json',
    },

    queryString: function() {
        return '?' + $.param({
            q: this.options.url,
        });
    },

    getText: function(item) {
        return item.text;
    },

    getUser: function(item) {
        return ['<a href="http://twitter.com/', item.from_user, '">@',
                item.from_user, '</a>'].join('');
    },

    getTime: function(item) {
        return ['<a href="http://twitter.com/', item.from_user,
                '/status/', item.id_str, '">', item.created_at,
                '</a>'].join('');
    },

    parseResponse: function(response) {
        this.render(response.results);
    },

    render: function(tweets) {
        this.element.children().remove();
        if (!tweets.length)
            return;

        this.element.html('<h2>Mentions in Twitter</h2>');

        this.renderComments(tweets);
    },
});

var FriendFeed = Service.$extend({
    options: {
        apiurl: 'http://friendfeed-api.com/v2/url',
    },

    queryString: function() {
        return '?' + $.param({
            url: this.options.url
        });
    },

    getText: function(item) {
        return item.body;
    },

    getUser: function(item) {
        return ['<a href="http://friendfeed.com/', item.from.id, '">',
                item.from.id, '</a>'].join('');
    },

    getTime: function(item) {
        return ['<time datetime="', item.date, '">',
                (new Date(item.date)).toDateString(), '</time>'].join('');
    },

    parseResponse: function(response) {
        var self = this;
        $.each(response.entries, function(i, item) {
            if (item.via.url == "http://piranha.org.ua/")
                self.render(item);
        });
    },

    render: function(data) {
        this.element.children().remove();
        if (!data.comments)
            return;

        this.element.html('<h2>Comments on FriendFeed</h2>');

        this.renderComments(data.comments);
    }
});

Date.toISOString = function () {
    function pad(n) { return n < 10 ? '0' + n : n};
    return this.getUTCFullYear()      + '-'
        + pad(this.getUTCMonth() + 1) + '-'
        + pad(this.getUTCDate())      + 'T'
        + pad(this.getUTCHours())     + ':'
        + pad(this.getUTCMinutes())   + ':'
        + pad(this.getUTCSeconds())   + 'Z';
};
