const Entities = require('html-entities').AllHtmlEntities;

const Html = new Entities();

// Map of Lunr ref to document
const documentsStore = [];
let maxDepth = 0;

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

            // Update maxDepth
            const depth = levelToDepth(page.level);
            if (depth > maxDepth) {
                maxDepth = depth;
            }

            let text = page.content;

            // Strip HTML tags
            text = text.replace(/<[^>]+>/g, '');
            // Shrink whitespaces to one space, \x7f will be used as a marker for highlighting
            text = text.replace(/[\n \x7f]+/g, ' ');
            // Unescape HTML
            text = Html.decode(text);

            let keywords = []
            if (page.search) {
                keywords = page.search.keywords || [];
            }

            // Add to index
            const doc = {
                url: this.output.toURL(page.path),
                title: page.title,
                level: page.level,
                summary: page.description,
                keywords: keywords.join(' '),
                body: text
            };

            documentsStore.push(doc);

            return page;
        },

        // Write index to disk
        'finish': function () {
            if (this.output.name !== 'website') {
                return;

            }
            this.log.debug('maxDepth: ', maxDepth, '\n');

            // Sort index by level
            documentsStore.sort((p1, p2) => levelToOrder(p1.level) - levelToOrder(p2.level));
            for (const page of documentsStore) {
                this.log.debug('index[' + levelToOrder(page.level) + ']', page.level, page.title, '\n');
            }

            this.log.debug.ln('write search index');
            return this.output.writeFile('search_plus_index.json', JSON.stringify(documentsStore));
        }
    }
}

function levelToDepth(levelString) {
    const array = levelString.split('.');
    return array.length;
}

// Level string to number
// ** each level number should be within 0 and 99
function levelToOrder(levelString) {
    let str = levelString;
    for (let i = 0; i < maxDepth; i++) {
        str += '.0';
    }
    const array = str.split('.').slice(0, maxDepth);
    return array.reduce((a, e) => a * 100 + Number(e));
}
