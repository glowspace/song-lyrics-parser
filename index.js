// requires Node 14 and higher
import parseChordSign from './chord_sign.js'
import transposedChord from './transpose.js'

function* textChunkIterator(text, max_words = 3)
{
    let begin = 0;
    let space_counter = 0;

    for (let i = 0; i < text.length; i += 1) {
        if (text[i] === ' ')
            space_counter += 1

        const maxWordsFilled = max_words && space_counter === max_words
        const textEnds = i === text.length - 1
        const nextChordStarts = text[i] === '[' && i > 0
        const lineEnds = text[i] === '\n'

        if (maxWordsFilled || textEnds || lineEnds || nextChordStarts) {
            if (maxWordsFilled || textEnds ) i += 1 // add trailing space

            yield text.substring(begin, i)
            space_counter = 0
            begin = i
        }
    }
}

function chunkToObj(chunk) {
    if (chunk.length && chunk[0] === '[') {
        const chord_end = chunk.indexOf(']')
        if (chord_end === -1) {
            throw 'Missing closing chord bracket at ' + chunk
        }

        return {
            chordSign: chunk.substring(1, chord_end),
            text: chunk.substring(chord_end + 1)
        }
    } else return {
        text: chunk
    }
}

function processNewLine(chunk_obj) {
    if (!chunk_obj.text.length) {
        return chunk_obj
    }

    if (chunk_obj.text[0] === '\n') {
        return {
            ...chunk_obj,
            text: chunk_obj.text.substring(1, chunk_obj.text.length),
            line_start: true
        }
    }

    return chunk_obj
}

function processComment(chunk_obj) {
    if (!chunk_obj.text.length) {
        return chunk_obj
    }

    if (chunk_obj.text[0] == '#') {
        return {
            ...chunk_obj,
            text: chunk_obj.text.substring(1, chunk_obj.text.length),
            comment_start: true
        }
    }

    return chunk_obj;
}

function processSongPart(chunk_obj) {
    const matches_at = chunk_obj.text.match(/^\s*@([\u0000-\u0019\u0021-\uFFFF]+):\s*/u)
    if (matches_at) {
        const types = {
            'předehra': 'P',
            'mezihra': 'M',
            'dohra': 'D'
        }

        return {
            text: chunk_obj.text.replace(matches_at[0], ''),
            song_part: {
                type: types[matches_at[1]] || matches_at[1],
            }
        }
    }
    
    const matches_hidden = chunk_obj.text.match(/^\s*\(([RBC]\d?):\)\s*/)
    if (matches_hidden) {
        return {
            text: chunk_obj.text.replace(matches_hidden[0], ''),
            song_part: {
                type: matches_hidden[1],
                is_hidden: true
            }
        }
    }

    const matches = chunk_obj.text.match(/^\s*([RBC]\d?):\s*/)
    if (matches) {
        return {
            text: chunk_obj.text.replace(matches[0], ''),
            song_part: {
                type: matches[1]
            }
        }
    }

    const matches_verse = chunk_obj.text.match(/^\s*(\d)\.\s*/)
    if (matches_verse) {
        return {
            text: chunk_obj.text.replace(matches_verse[0], ''),
            song_part: {
                type: matches_verse[1]
            }
        }
    }

    return chunk_obj;
}

const text = `@předehra: [Cmaj][D]
1. Ahoj, [C}Dobře to [D]šlape, nám to
taky hezky pěkně [E]takhle šlape.

#comment
R: Tohle je refrén silný jak [D]hovado`

console.log([...textChunkIterator(text)])


const chunks = [...textChunkIterator(text)].map(chunk => processSongPart(processComment(processNewLine(chunkToObj(chunk)))))

const parts = chunks.reduce((parts, chunk) => {
    if (chunk.song_part) {
        return [...parts, {
            chunks: chunk.text.length ? [chunk] : [],
            type: chunk.song_part.type
        }]
    } else {
        const last = parts[parts.length - 1] || {chunks: []};
        return [
            ...parts.splice(0, parts.length - 1),
            {
                ...last,
                chunks: [...last.chunks, chunk]
            }
        ]
    }
}, [])

// console.log(parts.map(p => p.chunks))

// for (const part of parts) {
//     console.log(processSongPart(processNewLine(chunkToObj(chunk))))
// }


// const t2 = `1. sloka 1

// 2. sloka 2

// R: refrén [C]kua`

// function songPartIterator(lyrics, regexprs = {
//     // prelude: /@předehra:/u,
//     // interlude: /@mezihra:/u,
//     // postlude: /@dohra:/u,
//     // verse: 
// }) {

//     let sp_lines = []

//     for (const line of lyrics.split('\n')) {
//         if (separators.some(reg => reg.test(line))) {
//             // start of a new part

//             yield sp_lines
//         }
//     }
// }

// for (const part of songPartIterator(t2)) {
//     console.log(part)
// }


// console.log(/@předehra:/u.test('@předehra:'))

// const t = 'one word hello there okay fine'

// console.log(getNextISpaces(t, 0, 6))

// console.log(transposedChord(parseChordSign('C#7maj'), 2))
// console.log(parseTextPart(text))