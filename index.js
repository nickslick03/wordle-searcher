const all_wordle_words = [];

const search_letters = [];
const search_colors = [];
const color_map = ['absent', 'present', 'correct'];

const pos = document.documentElement.scrollTop;
const calcHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
const scrollValue = Math.round( pos * 100 / calcHeight);

let is_results_in_viewport = isNaN(scrollValue);

(async () => {
    const res = await fetch('https://raw.githubusercontent.com/tabatkins/wordle-list/main/words');
    const text = await res.text();
    all_wordle_words.push(...text.split('\n'));
})();

function is_valid_input(key) {
    return !(key === 'Backspace' && search_letters.length === 0 ||
        key !== 'Backspace' && search_letters.length === 5 ||
        (key.length > 1 && key !== 'Backspace') || !/[A-z]/.test(key));
}

$('#wordle-search').on('keydown', function (e) {
    e.preventDefault();
    const key = e.key;
    if (!is_valid_input(key)) return;

    if (key === 'Backspace') {
        search_letters.pop();
        search_colors.pop();
    } else {
        search_letters.push(key.toUpperCase());
        search_colors.push(0);
    }
    render_wordle_search();
});

$(document).on('keydown', function (e) {
    const key = e.originalEvent.key;

    if (window.innerWidth < 500) return;
    if (key === 'Enter') {
        $('#search button[type="submit"]')[0].click();
        return;
    }
    if (!is_valid_input(key)) return;

    // $('#search .error')[0].style.visibility = 'hidden';

    if (key === 'Backspace') {
        search_letters.pop();
        search_colors.pop();
    } else {
        search_letters.push(key.toUpperCase());
        search_colors.push(0);
    }
    render_wordle_search();
});

$('.wordle-search-display > div').on('click', function () {
    if (this.textContent === '') return;

    const index = $(this).index('.wordle-search-display > div');
    const color_index = (Math.max(color_map.indexOf(this.className), 0) + 1) % 3;
    search_colors[index] = color_index;
    render_wordle_search();
});

function render_wordle_search() {
    $('#wordle-search')[0].value = search_letters.join('');
    for (let i = 0; i < search_letters.length; i++) {
        const div = $('.wordle-search-display > div')[i];
        div.textContent = search_letters[i];
        div.className = color_map[search_colors[i]];
    }
    for (let i = search_letters.length; i < 5; i++) {
        const div = $('.wordle-search-display > div')[i];
        div.textContent = '';
        div.className = '';
    }
}

$('#search').on('submit', function (e) {
    e.preventDefault();

    if (search_letters.length !== 5) {
        $(this).find('.error')[0].style.visibility = 'visible';
        return;
    } else {
        $(this).find('.error')[0].style.visibility = 'hidden';
    }

    const search_word = search_letters.join('').toLowerCase();
    const filtered_words = word_filter(all_wordle_words, search_word, search_colors);

    $('#results')[0].style.visibility = 'visible';
    $('#results h2').text(`${filtered_words.length} Result${filtered_words.length === 1 ? '' : 's'}`);
    $('#results ul').text('');
    filtered_words.forEach(word => {
        const li = document.createElement('li');
        li.textContent = word;
        $('#results ul').append(li);
    });

    if (!is_results_in_viewport) {
        $('#results')[0].scrollIntoView({ behavior: "smooth" });
    }
});

$('#about').on('click', function (e) {
    $('#modal-container')[0].style.display = 'flex';
});

$('#modal-container').on('click', function (e) {
    if (e.target === this) this.style.display = 'none';
});

/**
 * Returns all the valid wordle words in the word_list given the search_word and the respective colors for each letter.
 * @param {string[]} word_list 
 * @param {string} search_word 
 * @param {number[]} colors 
 */
function word_filter(word_list, search_word, colors) {
    const search_list = colors
        .map((color, index) => ({ color, index }))
        .sort((a, b) => b.color - a.color)
        .map(o => o.index);

    return word_list.filter(word => {
        for (let i of search_list) {
            const letter = search_word[i];
            switch (color_map[colors[i]]) {
                case 'absent':
                    if (word.includes(letter)) return false;
                    break;
                case 'present':
                    const search_word_num = create_binary_rep(search_word, letter);
                    const word_num = create_binary_rep(word, letter);
                    if ((word_num === 0) || ((search_word_num & word_num) > 0))
                        return false;
                    word = word.replace(search_word[i], ' ');
                    break;
                case 'correct':
                    if (word.indexOf(letter) !== i) return false;
                    word = word.replace(search_word[i], ' ');
                    break;
            }
        }
        return true;
    });
}

/**
 * Converts the word into a number where, in binary, each numbers place is a 1 if that letter is the letter parameter and 0 otherwise.
 * @param {string} word 
 * @param {string} letter 
 */
function create_binary_rep(word, letter) {
    return [...word]
        .map(l => l === letter ? 1 : 0)
        .reduce((sum, bit, i) => sum + (Math.pow(2, word.length - i - 1) * bit), 0);
}