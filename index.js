// requires Node 14 and higher
import parseChordSign from './chord_sign.js'
import transposedChord from './transpose.js'
import parse_lyrics from './text_parser.js'


const text = `@předehra: [Cmaj][D]
1. Ahoj, [C]Dobře to [Am]šlape, nám to
taky hezky pěkně [F]takhle šlape[G][%][%].

2. Ahoj, [%]Dobře to [%]šlape, nám to
taky hezky pěkně [%]takhle šlape.

#comment
R: Tohle je refrén silný jak [D]hovado`


const parts = parse_lyrics(text)


console.log(JSON.stringify(parts))
// console.log(JSON.stringify(parts.map(p => p.lines.flatMap(l => l.chunks.filter(ch => ch.chordSign).map(ch => ch.chordSign)))))