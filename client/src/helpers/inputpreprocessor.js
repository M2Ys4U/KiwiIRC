define('helpers/inputpreprocessor', function () {
    return function InputPreProcessor() {
        this.recursive_depth = 3;

        this.aliases = {};
        this.vars = {version: 1};

        // Current recursive depth
        var depth = 0;


        // Takes an array of words to process!
        this.processInput = function (input) {
            var words = input || [],
                alias = this.aliases[words[0]],
                alias_len,
                current_alias_word = '',
                compiled = [];

            // If an alias wasn't found, return the original input
            if (!alias) {
                return input;
            }

            // Split the alias up into useable words
            alias = alias.split(' ');
            alias_len = alias.length;

            // Iterate over each word and pop them into the final compiled array.
            // Any $ words are processed with the result ending into the compiled array.
            for (var i=0; i<alias_len; i++) {
                current_alias_word = alias[i];

                // Non $ word
                if (current_alias_word[0] !== '$') {
                    compiled.push(current_alias_word);
                    continue;
                }

                // Refering to an input word ($N)
                if (!isNaN(current_alias_word[1])) {
                    var num = current_alias_word.match(/\$(\d+)(\+)?(\d+)?/);

                    // Did we find anything or does the word it refers to non-existant?
                    if (!num || !words[num[1]]) {
                        continue;
                    }

                    if (num[2] === '+' && num[3]) {
                        // Add X number of words
                        compiled = compiled.concat(words.slice(parseInt(num[1], 10), parseInt(num[1], 10) + parseInt(num[3], 10)));
                    } else if (num[2] === '+') {
                        // Add the remaining of the words
                        compiled = compiled.concat(words.slice(parseInt(num[1], 10)));
                    } else {
                        // Add a single word
                        compiled.push(words[parseInt(num[1], 10)]);
                    }

                    continue;
                }


                // Refering to a variable
                if (typeof this.vars[current_alias_word.substr(1)] !== 'undefined') {

                    // Get the variable
                    compiled.push(this.vars[current_alias_word.substr(1)]);

                    continue;
                }

            }

            return compiled;
        };


        this.process = function (input) {
            input = input || '';

            var words = input.split(' ');

            depth++;
            if (depth >= this.recursive_depth) {
                depth--;
                return input;
            }

            if (this.aliases[words[0]]) {
                words = this.processInput(words);

                if (this.aliases[words[0]]) {
                    words = this.process(words.join(' ')).split(' ');
                }

            }

            depth--;
            return words.join(' ');
        };
    };
});
