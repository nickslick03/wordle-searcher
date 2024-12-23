const all_wordle_words = [];
let all_wordle_words_set = new Set();

let selected_container = 0;
const search_letters = [[]];
const search_colors = [[]];
const color_map = ['absent', 'present', 'correct'];

let is_result_in_viewport 

(async () => {
    const res = await fetch('https://raw.githubusercontent.com/tabatkins/wordle-list/main/words');
    const text = await res.text();
    all_wordle_words.push(...text.split('\n'));
    all_wordle_words_set = new Set(all_wordle_words);
})();

[...$('.search-display-container > div')].slice(1).forEach(div => {
    div.style.display = 'none';
    $('#search .remove')[0].setAttribute('disabled', '');
});

$('#search .add').on('click', function (e) {
    if (search_letters.length === 5) return;
    if (search_letters.length === 4) {
        this.setAttribute('disabled', '');
    } else if (search_letters.length === 1) {
        $('#search .remove')[0].removeAttribute('disabled');    
    }
    $('#search .search-display-container > div')[search_letters.length].style.display = 'flex';
    search_letters.push([]);
    search_colors.push([]);
    select_display(search_letters.length - 1);
});

$('#search .remove').on('click', function (e) {
    if (search_letters.length === 1) return;
    if (search_letters.length === 2) {
        this.setAttribute('disabled', '');
    } else if (search_letters.length === 5) {
        $('#search .add')[0].removeAttribute('disabled');    
    }
    $('#search .search-display-container > div')[search_letters.length - 1].style.display = 'none';
    [...$('.wordle-search-display')[search_letters.length - 1].children].forEach(div => {
        div.textContent = '';
        div.classList.remove(...color_map);
    });
    if (selected_container === search_letters.length - 1) {
        select_display(selected_container - 1);
    }
    search_letters.pop();
    search_colors.pop();
});

function select_display(index) {
    if (index < 0 || index > 5) {
        throw new Error(`index ${index} is out of bounds`);
    };
    $('.wordle-search-display')[selected_container].classList.remove('selected');
    $('.wordle-search-display')[index].classList.add('selected');
    $('#wordle-search')[0].value = search_letters[index].join('');
    selected_container = index;
}

function is_valid_input(key) {
    return !(key === 'Backspace' && search_letters[selected_container].length === 0 ||
        key !== 'Backspace' && search_letters[selected_container].length === 5 ||
        (key.length > 1 && key !== 'Backspace') || !/[A-z]/.test(key));
}

$('#wordle-search').on('keydown', function (e) {
    e.preventDefault();
    const key = e.key;
    if (!is_valid_input(key)) return;

    if (key === 'Backspace') {
        search_letters[selected_container].pop();
        search_colors[selected_container].pop();
    } else {
        search_letters[selected_container].push(key.toUpperCase());
        search_colors[selected_container].push(0);
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

    $('#search .error')[0].style.visibility = 'hidden';

    if (key === 'Backspace') {
        search_letters[selected_container].pop();
        search_colors[selected_container].pop();
    } else {
        search_letters[selected_container].push(key.toUpperCase());
        search_colors[selected_container].push(0);
    }
    render_wordle_search();
});

$('.wordle-search-display').on('click', function (e) {
    $('.wordle-search-display')[selected_container].classList.remove('selected');
    this.classList.add('selected');
    const old_selected = selected_container;
    selected_container = $('.search-display-container > div').index(this);
    $('#wordle-search')[0].value = search_letters[selected_container].join('');
    if (old_selected !== selected_container) return;

    const cell = e.target;
    if (cell.textContent === '') return;
    
    const index = $(this).find('div').index(cell);
    const color_index = (Math.max(color_map.indexOf(cell.className), 0) + 1) % 3;
    search_colors[selected_container][index] = color_index;
    render_wordle_search();
});

function render_wordle_search() {
    $('#wordle-search')[0].value = search_letters[selected_container].join('');

    for (let i = 0; i < search_letters[selected_container].length; i++) {
        const div = $('.wordle-search-display')[selected_container].children[i];
        div.textContent = search_letters[selected_container][i];
        div.className = color_map[search_colors[selected_container][i]];
    }

    for (let i = search_letters[selected_container].length; i < 5; i++) {
        const div = $('.wordle-search-display')[selected_container].children[i];
        div.textContent = '';
        div.className = '';
    }
}

$('#search').on('submit', function (e) {
    e.preventDefault();

    if (search_letters.some(letters => letters.length !== 5)) {
        $(this).find('.error')[0].style.visibility = 'visible';
        $(this).find('.error').text('Each word row must have 5 letters.');
        return;
    } else {
        $(this).find('.error')[0].style.visibility = 'hidden';
    }

    const search_words = search_letters.map(letters => letters.join('').toLowerCase());
    for (let search_word of search_words) {
        if (!all_wordle_words_set.has(search_word)) {
            $(this).find('.error')[0].style.visibility = 'visible';
            $(this).find('.error').text(`${search_word} is not a valid worldle word.`);
            return;
        }
    }

    let filtered_words = [...all_wordle_words];
    for (let i = 0; i < search_letters.length; i ++) {
        filtered_words = word_filter(filtered_words, search_words[i], search_colors[i]);
    }
    $('#results')[0].style.visibility = 'visible';
    $('#results h2').text(`${filtered_words.length} Result${filtered_words.length === 1 ? '' : 's'}`);
    $('#results ul').text('');
    filtered_words.forEach(word => {
        const li = document.createElement('li');
        li.textContent = word;
        $('#results ul').append(li);
    });

    if (window.outerWidth <= 500) {
        $('.results-header')[0].scrollIntoView({ behavior: "smooth", block: 'center' });
    }
});

$('#about').on('click', function (e) {
    $('#modal-container')[0].style.display = 'flex';
});

$('#modal-container').on('click', function (e) {
    if (e.target === this || e.target.className === 'close-modal') 
        this.style.display = 'none';
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

    return [...word_list].filter(word => {
        for (let i of search_list) {
            const letter = search_word.charAt(i);
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
                    const index = [...word].findIndex((l, idx) => l === letter && i === idx);
                    if (index === -1) return false;
                    const word_list = word.split('');
                    word_list[i] = ' ';
                    word = word_list.join('');
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