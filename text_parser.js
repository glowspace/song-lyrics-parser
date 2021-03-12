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
    if (chunk_obj.text[0] === '\n') {
        return {
            ...chunk_obj,
            text: chunk_obj.text.substring(1, chunk_obj.text.length),
            line_start: true
        }
    }

    return chunk_obj
}


function processInline(chunk_obj) {
    if (chunk_obj.text[0] == '@') {
        return {
            ...chunk_obj,
            text: chunk_obj.text.substring(1, chunk_obj.text.length),
            inline_start: true
        }
    }

    return chunk_obj;
}

// depends on processInline
function createProcessPartAliases(aliases = {
    'předehra': 'P',
    'mezihra': 'M',
    'dohra': 'D'
}) {
    return function(chunk_obj) {
        for (const alias of Object.keys(aliases)) {
            if (chunk_obj.text.startsWith(alias)) {
                return {
                    ...chunk_obj,
                    text: chunk_obj.text.replace(alias, aliases[alias])
                }
            }
        }
    
        return chunk_obj;
    }
}

function processComment(chunk_obj) {
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
    const matches_hidden = chunk_obj.text.match(/^\s*\(([A-Z]\d{0,2}):\)\s*/)
    if (matches_hidden) {
        return {
            ...chunk_obj,
            text: chunk_obj.text.replace(matches_hidden[0], ''),
            song_part: {
                type: matches_hidden[1],
                is_hidden: true
            }
        }
    }

    const matches = chunk_obj.text.match(/^\s*([A-Z]\d{0,2}):\s*/)
    if (matches) {
        return {
            ...chunk_obj,
            text: chunk_obj.text.replace(matches[0], ''),
            song_part: {
                type: matches[1]
            }
        }
    }

    const matches_verse = chunk_obj.text.match(/^\s*(\d)\.\s*/)
    if (matches_verse) {
        return {
            ...chunk_obj,
            text: chunk_obj.text.replace(matches_verse[0], ''),
            song_part: {
                type: matches_verse[1],
                is_hidden: true
            }
        }
    }

    return chunk_obj;
}

function* partChordsIterator(part) {
    const chordSigns = part.chunks.filter(chunk => chunk.chordSign && chunk.chordSign !== '%').map(chunk => chunk.chordSign)

    let lastPartType;

    for (let i = 0; true; i = (i + 1) % chordSigns.length) {
        let newPartType = yield chordSigns[i]
        if (lastPartType && lastPartType !== newPartType) i = -1
        lastPartType = newPartType
    }
}

function processMirrorChords(parts) {
    // todo: mirror refrain (and all possible Xs or X1s)

    const isVerse = part => /\d/.test(part.type)
    const isFirstVerse = part => part.type === '1'
    const isReplaceChord = chunk => chunk.chordSign === "%"

    const firstVerse = parts.filter(isFirstVerse)[0];

    // the transforming function
    const partMirroredChords = (part, iterator) => ({
        ...part,
        chunks: part.chunks.map(chunk => !isReplaceChord(chunk) ? chunk :
        {
            ...chunk,
            chordSign: iterator.next(part.type).value
        })
    })

    if (firstVerse !== undefined) {
        const iterator = partChordsIterator(firstVerse)
        return parts.map(p => !isVerse(p) ? p : partMirroredChords(p, iterator))
    }

    return parts;
}

// helper function
// [obj], (obj -> obj), obj -> [obj]
function modifiedLast(arr, lastModifier, orDefault={}) {
    const lastOrDefault = arr[arr.length - 1] || orDefault
    return [
        ...arr.splice(0, arr.length - 1),
        lastModifier(lastOrDefault)
    ]
}

function chunksToParts(chunks) { 
    return chunks.reduce((parts, chunk) => chunk.song_part ?
        // chunk is a start of a new part
        [...parts, {
            chunks: (chunk.text.length || chunk.inline_start) ? [chunk] : [],
            type: chunk.song_part.type,
            is_hidden: chunk.song_part.is_hidden === true
        }]
        // add chunk to the last part
        : modifiedLast(parts, lastPart => ({...lastPart, chunks: [...lastPart.chunks, chunk]}), {chunks:[]})
    , [])
}


function partChunksToLines(chunks) {
    return chunks.reduce((lines, chunk) => chunk.line_start ?
        // chunk is a start of a new line, append a new entry to `lines`
        [...lines, {
            is_comment: chunk.comment_start,
            is_inline: chunk.inline_start === true,
            chunks: [chunk]
        }]
        // ELSE modify the last line .. add the current chunk to its chunks
        : modifiedLast(lines, lastLine => ({...lastLine, chunks: [...lastLine.chunks, chunk]}), {chunks: []})
    , [])
}

// OK, not a functional immutable approach, but way simpler
function moveLastLineCommentsToNextPart(parts_lines) {
    // do not move anything from the last part
    for (let i = 0; i < parts_lines.length - 1; i++) {
        let part = parts_lines[i]
        let nextPart = parts_lines[i + 1]

        let k = part.lines.length - 1
        let commentsBuffer = []

        // go from the end and push all the comments to buffer
        while (k > 0 && part.lines[k].is_comment) {
            commentsBuffer.push(part.lines[k])
            k--
        }

        if (commentsBuffer.length) {
            part.lines = part.lines.slice(0, k + 1)

            nextPart.lines = [
                ...commentsBuffer.reverse(),
                nextPart.lines
            ]
        }
    }
}


// todo: review
export default function(text) {
    const chunks = [...textChunkIterator(text)].map(chunk => processSongPart(processComment(processNewLine(chunkToObj(chunk)))))
    
    const parts = processMirrorChords(chunksToParts(chunks)).map(p => ({
        type: p.type,
        lines: partChunksToLines(p.chunks)
    }))

    return parts
}

const lyrics = `@předehra: [C][D][Em]
1. Ahoj, [C]Dobře to [Am]šlape
to je jízda, že jo.
# to je komentář

# multiline comment
# vstup
2. [%][%][%][%]

R:

(R:)

#komentar na konec`

// tests

const chunks = [...textChunkIterator(lyrics)]
console.log(chunks)

const chunkObjs = chunks.map(chunkToObj)
console.log(chunkObjs)

const withNewlines = chunkObjs.map(processNewLine)
console.log(withNewlines)

// fix missing line_start at the very start
withNewlines[0].line_start = true;

const withInlines = withNewlines.map(processInline)
console.log(withInlines)

const processPartAliases = createProcessPartAliases()

const withAliases = withInlines.map(processPartAliases)
console.log(withAliases)

const withComments = withAliases.map(processComment)
console.log(withComments)

const withSongParts = withComments.map(processSongPart)
console.log(withSongParts)

console.log('----- end of chunks ------')

const parts = chunksToParts(withSongParts)
console.log(parts)

const mirror = processMirrorChords(parts)
console.log(mirror.map(p => p.chunks).map(chunks => chunks.map(ch => ch.chordSign).filter(sign => sign)))

const partsLines = mirror.map(p => ({
    ...p,
    chunks: undefined,
    lines: partChunksToLines(p.chunks)
}))

console.log(partsLines.map(p => ({
    ...p,
    lines: p.lines.map(ch => JSON.stringify(ch))
})))

moveLastLineCommentsToNextPart(partsLines)

console.log(partsLines.map(p => ({
    ...p,
    lines: p.lines.map(ch => JSON.stringify(ch))
})))