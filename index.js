const Entities = require('html-entities').AllHtmlEntities;

const Html = new Entities();

// Map of Lunr ref to document
const documentsStore = {};

module.exports = {
    book: {
        assets: './assets',
        js: [
            'jquery.mark.min.js',
            'search.js'
        ],
        css: [
            'search.css'
        ]
    },

    hooks: {
        // Index each page
        'page': function (page) {
            if (this.output.name !== 'website' || page.search === false) {
                return page;
            }

            this.log.debug.ln('index page', page.path);

            console.log(page);

            let text = page.content;

            // strip HTML tags
            text = text.replace(/<[^>]+>/g, '');

            // shrink whitespaces to one space
            text = text.replace(/[\n \x7f]+/g, ' ');

            // unescape HTML
            text = Html.decode(text);

            this.log.debug.ln('stored content', text);

            let keywords = []
            if (page.search) {
                keywords = page.search.keywords || [];
            }

            console.log("search text:" +  text);

            // Add to index
            const doc = {
                url: this.output.toURL(page.path),
                title: page.title,
                summary: page.description,
                keywords: keywords.join(' '),
                body: text
            };

            documentsStore[doc.url] = doc;

            return page;
        },

        // Write index to disk
        'finish': function () {
            if (this.output.name !== 'website')
                return;

            this.log.debug.ln('write search index');
            return this.output.writeFile('search_plus_index.json', JSON.stringify(documentsStore));
        }
    }
}
