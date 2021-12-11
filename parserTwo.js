strict_types = 1;

class Parser {
    constructor(src) {
        this.src = src
        this.idx = 0
        this.error = false
        this.buffer = ''
    }

    peek() {
        if (this.eof()) {
            return ''
        }
        return this.src[this.idx]
    }

    lookahead() {
        this.idx += 1
        s = this.peek()
        this.idx -= 1
        return s
    }

    shift() {
        s = this.peek()
        this.idx += 1
        return s
    }

    shift_if(x) {
        if (this.peek() == x) {
            this.shift()
            return true
        }
        return false
    }

    eof() {
        return this.error || this.idx >= this.src.length
    }

    peek_is(condition) {
        if (typeof condition == 'function') {
            return condition(this.peek())
        }
        return condition.includes(self.peek())
    }

    require(condition) {
        if (!this.peek_is(condition)) {
            this.error = True
        }
        this.shift()
    }

    require_str(x) {
        while (x.length > 0) {
            if (this.shift() != rest[0])
                this.error = true
            x = x.slice(1)
        }
    }

    buffer_while(condition, req) {
        let handled = false
        while (!this.eof() && this.peek_is(condition)) {
            this.buffer += this.shift()
            handled = true
        }

        if (!handled && req) {
            this.error = true
        }
        return handled
    }

    buffer_once(condition, req) {
        if (!self.eof() && this.peek_is(condition)) {
            this.buffer += this.shift()
            return true
        }

        if (req) {
            this.error = true
        }
        return false
    }

    flush_buffer() {
        b = this.buffer
        this.buffer = ''
        return b
    }
}

class LyricsParser extends Parser {
    part_id() {
        const is_hidden = this.shift_if('(')
        const is_inline = this.shift_if('@')
        const is_verse = this.buffer_once(peek => peek.match(/\d/), false)

        if (is_verse) {
            this.require_str('.')
        } else {
            this.buffer_once(peek => peek.match(/[A-Z]/), true)
            this.buffer_while(peek => peek.match(/\d/), false)
            this.require(['.', ':'])
        }

        if (is_hidden) {
            this.require_str(')')
        }

        return {
            is_hidden,
            is_inline,
            is_verse,
            str: this.flush_buffer()
        }
    }

    chord_sign() {
        this.require_str('[')
        const is_optional = this.shift_if('(')
        if (is_optional) {
            this.buffer_while(peek => peek != ')', true)
            this.require_str(')]')
        }
        else {
            this.buffer_while(peek => peek != ']', true)
            this.require_str(']')
        }

        return {
            is_optional,
            str: this.flush_buffer()
        }
    }

    comment() {
        this.require_str('#')

        const is_multiline = this.shift_if('#')
        if (is_multiline) {
            this.buffer_while(peek => peek != '#', true)
            this.require_str('#')
        } else {
            this.buffer_while(peek => peek != '\n', false)
            this.shift()
        }

        return self.flush_buffer()
    }

    // repeat() with * and **
}


// todo: replace ]) with )] , replace ([ with [(