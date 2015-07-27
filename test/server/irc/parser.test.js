var stream = require('stream'),
    proxyquire = require('proxyquire');

describe('server/irc/parser.js', function () {
    var Parser, winstonSpy, iconvSpy;

    beforeEach(function () {
        winstonSpy = jasmine.createSpyObj('winston', ['warn']);
        winstonSpy['@noCallThru'] = true;

        iconvSpy = jasmine.createSpyObj('iconv', ['decode']);
        iconvSpy['@noCallThru'] = true;

        iconvSpy.decode.and.callFake(function (input) {
            return input.toString();
        });

        Parser = proxyquire('../../../server/irc/parser.js', {
            'iconv-lite': iconvSpy,
            'winston': winstonSpy
        });

        global = {
            config: {}
        }
    });

    describe('Parser', function () {

        it('should be a Transform stream', function () {
            var parser = new Parser();

            expect(parser instanceof stream.Transform);
        });

        it('should emit an error event if the internal buffer gets too large', function (done) {
            var parser = new Parser({
                max_buffer_size: 11
            });

            parser.on('error', function (err) {
                if (err === 'Message buffer too large') {
                    done();
                }
            });

            parser.write('12characters');
            parser.end();
        });

        it('should buffer incomplete commands', function (done) {
            var parser = new Parser();

            parser.on('data', function (msg_obj) {
                expect(parser.held_data.toString()).toEqual('PRIVMSG #test :This is incomplete');

                done();
            });

            parser.write('PING :test\r\nPRIVMSG #test :This is incomplete');
            parser.end();
        });

    });

    describe('message parsing', function () {
        var parser, outputSpy, expectOutputCalledWith;

        beforeEach(function () {
            parser = new Parser();
            outputSpy = jasmine.createSpy('output');
            parser.on('data', outputSpy);

            expectOutputCalledWith = function (expectations, done) {
                setImmediate(function () {
                    expect(outputSpy).toHaveBeenCalledWith(jasmine.objectContaining(expectations));
                    done && done();
                });
            }
        });

        afterEach(function () {
            parser.removeAllListeners();
            parser.end();
        });

        it('should log a warning if the message is malformed', function (done) {
            parser.on('data', function (msg_obj) {
                expect(winstonSpy.warn).toHaveBeenCalledWith('Malformed IRC line: %s', ':foo');
                done();
            });

            parser.write(':foo\r\n');
            parser.write('TEST :test\r\n');
        });

        it('should parse a command by itself', function (done) {
            parser.write('TEST\r\n');

            expectOutputCalledWith({
                command: 'TEST'
            }, done);
        });

        describe('parameters', function () {

            it('should parse a command with a single parameter', function (done) {
                parser.write('TEST foo\r\n');

                expectOutputCalledWith({
                    command: 'TEST',
                    params: ['foo']
                }, done);
            });

            it('should parse a command with a single "trailing" parameter', function (done) {
                parser.write('TEST :foo\r\n');

                expectOutputCalledWith({
                    command: 'TEST',
                    params: ['foo']
                }, done);
            });

            it('should parse a command with an empty "trailing" parameter', function (done) {
                parser.write('TEST :\r\n');

                expectOutputCalledWith({
                    command: 'TEST',
                    params: ['']
                }, done);
            });

            it('should parse a command with a multiple parameters', function (done) {
                parser.write('TEST foo bar\r\n');

                expectOutputCalledWith({
                    command: 'TEST',
                    params: ['foo', 'bar']
                }, done);
            });

            it('should parse a command with a multiple parameters, one of which is "trailing"', function (done) {
                parser.write('TEST foo :bar\r\n');

                expectOutputCalledWith({
                    command: 'TEST',
                    params: ['foo', 'bar']
                }, done);
            });

            it('should parse a command with a "trailing" parameter that contains spaces', function (done) {
                parser.write('TEST :hello world\r\n');

                expectOutputCalledWith({
                    command: 'TEST',
                    params: ['hello world']
                }, done);
            });

        });

        describe('prefixes', function () {

            it('should parse a message that has a hostname as a prefix', function (done) {
                parser.write(':irc.example.org TEST\r\n');

                expectOutputCalledWith({
                    prefix: 'irc.example.org',
                    command: 'TEST'
                }, done);
            });

            it('should parse a message that has nick@hostname as a prefix', function (done) {
                parser.write(':nick@irc.example.org TEST\r\n');

                expectOutputCalledWith({
                    nick: 'nick',
                    hostname: 'irc.example.org',
                    command: 'TEST'
                }, done);
            });

            it('should parse a message that has nick!ident@hostname as a prefix', function (done) {
                parser.write(':nick!ident@irc.example.org TEST\r\n');

                expectOutputCalledWith({
                    nick: 'nick',
                    ident: 'ident',
                    hostname: 'irc.example.org',
                    command: 'TEST'
                }, done);
            });

        });

        describe('parameters + prefix', function () {

            it('should parse a command with a single parameter and a hostname prefix', function (done) {
                parser.write(':irc.example.org TEST foo\r\n');

                expectOutputCalledWith({
                    prefix: 'irc.example.org',
                    command: 'TEST',
                    params: ['foo'],
                }, done);
            });

            it('should parse a command with a single parameter and a nick@hostname prefix', function (done) {
                parser.write(':nick@example.org TEST foo\r\n');

                expectOutputCalledWith({
                    nick: 'nick',
                    hostname: 'example.org',
                    command: 'TEST',
                    params: ['foo'],
                }, done);
            });

            it('should parse a command with a single "trailing" parameter and a nick!ident@hostname prefix', function (done) {
                parser.write(':nick!ident@example.org TEST :foo\r\n');

                expectOutputCalledWith({
                    nick: 'nick',
                    ident: 'ident',
                    hostname: 'example.org',
                    command: 'TEST',
                    params: ['foo'],
                }, done);
            });

            it('should parse a command with a single "trailing" parameter and a hostname prefix', function (done) {
                parser.write(':irc.example.org TEST :foo\r\n');

                expectOutputCalledWith({
                    prefix: 'irc.example.org',
                    command: 'TEST',
                    params: ['foo'],
                }, done);
            });

            it('should parse a command with a single "trailing" parameter and a nick@hostname prefix', function (done) {
                parser.write(':nick@example.org TEST :foo\r\n');

                expectOutputCalledWith({
                    nick: 'nick',
                    hostname: 'example.org',
                    command: 'TEST',
                    params: ['foo'],
                }, done);
            });

            it('should parse a command with a single "trailing" parameter and a nick!ident@hostname prefix', function (done) {
                parser.write(':nick!ident@example.org TEST :foo\r\n');

                expectOutputCalledWith({
                    nick: 'nick',
                    ident: 'ident',
                    hostname: 'example.org',
                    command: 'TEST',
                    params: ['foo'],
                }, done);
            });

            it('should parse a command with a multiple parameters and a hostname prefix', function (done) {
                parser.write(':irc.example.org TEST foo bar\r\n');

                expectOutputCalledWith({
                    prefix: 'irc.example.org',
                    command: 'TEST',
                    params: ['foo', 'bar']
                }, done);
            });

            it('should parse a command with a multiple parameters and a nick@hostname prefix', function (done) {
                parser.write(':nick@example.org TEST foo bar\r\n');

                expectOutputCalledWith({
                    nick: 'nick',
                    hostname: 'example.org',
                    command: 'TEST',
                    params: ['foo', 'bar']
                }, done);
            });

            it('should parse a command with a multiple parameters and a nick!ident@hostname prefix', function (done) {
                parser.write(':nick!ident@example.org TEST foo bar\r\n');

                expectOutputCalledWith({
                    nick: 'nick',
                    ident: 'ident',
                    hostname: 'example.org',
                    command: 'TEST',
                    params: ['foo', 'bar']
                }, done);
            });

            it('should parse a command with a multiple parameters, one of which is "trailing", and a hostname prefix', function (done) {
                parser.write(':irc.example.org TEST foo :bar\r\n');

                expectOutputCalledWith({
                    prefix: 'irc.example.org',
                    command: 'TEST',
                    params: ['foo', 'bar']
                }, done);
            });

            it('should parse a command with a multiple parameters, one of which is "trailing", and a nick@hostname prefix', function (done) {
                parser.write(':nick@example.org TEST foo :bar\r\n');

                expectOutputCalledWith({
                    nick: 'nick',
                    hostname: 'example.org',
                    command: 'TEST',
                    params: ['foo', 'bar']
                }, done);
            });

            it('should parse a command with a multiple parameters, one of which is "trailing", and a nick!ident@hostname prefix', function (done) {
                parser.write(':nick!ident@example.org TEST foo :bar\r\n');

                expectOutputCalledWith({
                    nick: 'nick',
                    ident: 'ident',
                    hostname: 'example.org',
                    command: 'TEST',
                    params: ['foo', 'bar']
                }, done);
            });

            it('should parse a command with a "trailing" parameter that contains spaces and a hostname prefix', function (done) {
                parser.write(':irc.example.org TEST :hello world\r\n');

                expectOutputCalledWith({
                    prefix: 'irc.example.org',
                    command: 'TEST',
                    params: ['hello world']
                }, done);
            });

            it('should parse a command with a "trailing" parameter that contains spaces and a nick@hostname prefix', function (done) {
                parser.write(':nick@example.org TEST :hello world\r\n');

                expectOutputCalledWith({
                    nick: 'nick',
                    hostname: 'example.org',
                    command: 'TEST',
                    params: ['hello world']
                }, done);
            });

            it('should parse a command with a "trailing" parameter that contains spaces and a nick!ident@hostname prefix', function (done) {
                parser.write(':nick!ident@example.org TEST :hello world\r\n');

                expectOutputCalledWith({
                    nick: 'nick',
                    ident: 'ident',
                    hostname: 'example.org',
                    command: 'TEST',
                    params: ['hello world']
                }, done);
            });

        });

        describe('tags', function () {

            it('should parse a message that has a tag with no value', function (done) {
                parser.write('@foo TEST\r\n');

                expectOutputCalledWith({
                    tags: [{
                        tag: 'foo',
                        value: undefined
                    }],
                    command: 'TEST'
                }, done);
            });

            it('should parse a message that has a tag with a value', function (done) {
                parser.write('@foo=bar TEST\r\n');

                expectOutputCalledWith({
                    tags: [{
                        tag: 'foo',
                        value: 'bar'
                    }],
                    command: 'TEST'
                }, done);
            });

            it('should parse a message that has multiple tags with no value', function (done) {
                parser.write('@foo;bar TEST\r\n');

                expectOutputCalledWith({
                    tags: [
                        {
                            tag: 'foo',
                            value: undefined
                        },
                        {
                            tag: 'bar',
                            value: undefined
                        }
                    ],
                    command: 'TEST'
                }, done);
            });

            it('should parse a message that has multiple tags where one has a value and one does not', function (done) {
                parser.write('@foo=bar;baz TEST\r\n');

                expectOutputCalledWith({
                    tags: [
                        {
                            tag: 'foo',
                            value: 'bar'
                        },
                        {
                            tag: 'baz',
                            value: undefined
                        }
                    ],
                    command: 'TEST'
                }, done);
            });

        });

        describe('tags + prefixes', function () {

            it('should parse a message that has a tag with no value and a hostname prefix', function (done) {
                parser.write('@foo :irc.example.org TEST\r\n');

                expectOutputCalledWith({
                    tags: [{
                        tag: 'foo',
                        value: undefined
                    }],
                    command: 'TEST',
                    prefix: 'irc.example.org'
                }, done);
            });

            it('should parse a message that has a tag with no value and a nick@hostname prefix', function (done) {
                parser.write('@foo :nick@example.org TEST\r\n');

                expectOutputCalledWith({
                    tags: [{
                        tag: 'foo',
                        value: undefined
                    }],
                    command: 'TEST',
                    nick: 'nick',
                    hostname: 'example.org'
                }, done);
            });

            it('should parse a message that has a tag with no value and a nick!ident@hostname prefix', function (done) {
                parser.write('@foo :nick!ident@example.org TEST\r\n');

                expectOutputCalledWith({
                    tags: [{
                        tag: 'foo',
                        value: undefined
                    }],
                    command: 'TEST',
                    nick: 'nick',
                    ident: 'ident',
                    hostname: 'example.org'
                }, done);
            });

            it('should parse a message that has a tag with a value and a hostname prefix', function (done) {
                parser.write('@foo=bar :irc.example.org TEST\r\n');

                expectOutputCalledWith({
                    tags: [{
                        tag: 'foo',
                        value: 'bar'
                    }],
                    command: 'TEST',
                    prefix: 'irc.example.org'
                }, done);
            });

            it('should parse a message that has a tag with a value and a nick@hostname prefix', function (done) {
                parser.write('@foo=bar :nick@example.org TEST\r\n');

                expectOutputCalledWith({
                    tags: [{
                        tag: 'foo',
                        value: 'bar'
                    }],
                    command: 'TEST',
                    nick: 'nick',
                    hostname: 'example.org'
                }, done);
            });

            it('should parse a message that has a tag with a value and a nick@hostname prefix', function (done) {
                parser.write('@foo=bar :nick@example.org TEST\r\n');

                expectOutputCalledWith({
                    tags: [{
                        tag: 'foo',
                        value: 'bar'
                    }],
                    command: 'TEST',
                    nick: 'nick',
                    hostname: 'example.org'
                }, done);
            });

            it('should parse a message that has multiple tags with no value and a hostname prefix', function (done) {
                parser.write('@foo;bar :irc.example.org TEST\r\n');

                expectOutputCalledWith({
                    tags: [
                        {
                            tag: 'foo',
                            value: undefined
                        },
                        {
                            tag: 'bar',
                            value: undefined
                        }
                    ],
                    command: 'TEST',
                    prefix: 'irc.example.org'
                }, done);
            });

            it('should parse a message that has multiple tags with no value and a nick@hostname prefix', function (done) {
                parser.write('@foo;bar :nick@example.org TEST\r\n');

                expectOutputCalledWith({
                    tags: [
                        {
                            tag: 'foo',
                            value: undefined
                        },
                        {
                            tag: 'bar',
                            value: undefined
                        }
                    ],
                    command: 'TEST',
                    nick: 'nick',
                    hostname: 'example.org'
                }, done);
            });

            it('should parse a message that has multiple tags with no value and a nick!ident@hostname prefix', function (done) {
                parser.write('@foo;bar :nick!ident@example.org TEST\r\n');

                expectOutputCalledWith({
                    tags: [
                        {
                            tag: 'foo',
                            value: undefined
                        },
                        {
                            tag: 'bar',
                            value: undefined
                        }
                    ],
                    command: 'TEST',
                    nick: 'nick',
                    ident: 'ident',
                    hostname: 'example.org'
                }, done);
            });

            it('should parse a message that has multiple tags where one has a value and one does not and a hostname prefix', function (done) {
                parser.write('@foo=bar;baz :irc.example.org TEST\r\n');

                expectOutputCalledWith({
                    tags: [
                        {
                            tag: 'foo',
                            value: 'bar'
                        },
                        {
                            tag: 'baz',
                            value: undefined
                        }
                    ],
                    command: 'TEST',
                    prefix: 'irc.example.org'
                }, done);
            });

            it('should parse a message that has multiple tags where one has a value and one does not and a nick@hostname prefix', function (done) {
                parser.write('@foo=bar;baz :nick@example.org TEST\r\n');

                expectOutputCalledWith({
                    tags: [
                        {
                            tag: 'foo',
                            value: 'bar'
                        },
                        {
                            tag: 'baz',
                            value: undefined
                        }
                    ],
                    command: 'TEST',
                    nick: 'nick',
                    hostname: 'example.org'
                }, done);
            });

            it('should parse a message that has multiple tags where one has a value and one does not and a nick!ident@hostname prefix', function (done) {
                parser.write('@foo=bar;baz :nick!ident@example.org TEST\r\n');

                expectOutputCalledWith({
                    tags: [
                        {
                            tag: 'foo',
                            value: 'bar'
                        },
                        {
                            tag: 'baz',
                            value: undefined
                        }
                    ],
                    command: 'TEST',
                    nick: 'nick',
                    ident: 'ident',
                    hostname: 'example.org'
                }, done);
            });

        });

        describe('tags + parameters + prefix', function () {

            it('should parse a message that has a tag with no value, a single parameter and a hostname prefix', function (done) {
                parser.write('@foo :irc.example.org TEST bar\r\n');

                expectOutputCalledWith({
                    tags: [{
                        tag: 'foo',
                        value: undefined
                    }],
                    command: 'TEST',
                    prefix: 'irc.example.org',
                    params: ['bar']
                }, done);
            });

            it('should parse a message that has a tag with no value, a single parameter and a hostname prefix', function (done) {
                parser.write('@foo :irc.example.org TEST bar\r\n');

                expectOutputCalledWith({
                    tags: [{
                        tag: 'foo',
                        value: undefined
                    }],
                    command: 'TEST',
                    prefix: 'irc.example.org',
                    params: ['bar']
                }, done);
            });

            it('should parse a message that has a tag with no value, a single "trailing" parameter and a hostname prefix', function (done) {
                parser.write('@foo :irc.example.org TEST :bar\r\n');

                expectOutputCalledWith({
                    tags: [{
                        tag: 'foo',
                        value: undefined
                    }],
                    command: 'TEST',
                    prefix: 'irc.example.org',
                    params: ['bar']
                }, done);
            });

            it('should parse a message that has a tag with no value, a single empty "trailing" parameter and a hostname prefix', function (done) {
                parser.write('@foo :irc.example.org TEST :\r\n');

                expectOutputCalledWith({
                    tags: [{
                        tag: 'foo',
                        value: undefined
                    }],
                    command: 'TEST',
                    prefix: 'irc.example.org',
                    params: ['']
                }, done);
            });

            it('should parse a message that has a tag with no value, multiple parameters and a hostname prefix', function (done) {
                parser.write('@foo :irc.example.org TEST bar baz\r\n');

                expectOutputCalledWith({
                    tags: [{
                        tag: 'foo',
                        value: undefined
                    }],
                    command: 'TEST',
                    prefix: 'irc.example.org',
                    params: ['bar', 'baz']
                }, done);
            });

            it('should parse a message that has a tag with no value, multiple parameters (one of which is "trailing") and a hostname prefix', function (done) {
                parser.write('@foo :irc.example.org TEST bar :baz\r\n');

                expectOutputCalledWith({
                    tags: [{
                        tag: 'foo',
                        value: undefined
                    }],
                    command: 'TEST',
                    prefix: 'irc.example.org',
                    params: ['bar', 'baz']
                }, done);
            });

            it('should parse a message that has a tag with no value, a "trailing" parameter that has spaces and a hostname prefix', function (done) {
                parser.write('@foo :irc.example.org TEST :hello world\r\n');

                expectOutputCalledWith({
                    tags: [{
                        tag: 'foo',
                        value: undefined
                    }],
                    command: 'TEST',
                    prefix: 'irc.example.org',
                    params: ['hello world']
                }, done);
            });

            it('should parse a message that has a tag with no value, a single parameter and a nick@hostname prefix', function (done) {
                parser.write('@foo :nick@example.org TEST bar\r\n');

                expectOutputCalledWith({
                    tags: [{
                        tag: 'foo',
                        value: undefined
                    }],
                    command: 'TEST',
                    nick: 'nick',
                    hostname: 'example.org',
                    params: ['bar']
                }, done);
            });

            it('should parse a message that has a tag with no value, a single parameter and a nick@hostname prefix', function (done) {
                parser.write('@foo :nick@example.org TEST bar\r\n');

                expectOutputCalledWith({
                    tags: [{
                        tag: 'foo',
                        value: undefined
                    }],
                    command: 'TEST',
                    nick: 'nick',
                    hostname: 'example.org',
                    params: ['bar']
                }, done);
            });

            it('should parse a message that has a tag with no value, a single "trailing" parameter and a nick@hostname prefix', function (done) {
                parser.write('@foo :nick@example.org TEST :bar\r\n');

                expectOutputCalledWith({
                    tags: [{
                        tag: 'foo',
                        value: undefined
                    }],
                    command: 'TEST',
                    nick: 'nick',
                    hostname: 'example.org',
                    params: ['bar']
                }, done);
            });

            it('should parse a message that has a tag with no value, a single empty "trailing" parameter and a nick@hostname prefix', function (done) {
                parser.write('@foo :nick@example.org TEST :\r\n');

                expectOutputCalledWith({
                    tags: [{
                        tag: 'foo',
                        value: undefined
                    }],
                    command: 'TEST',
                    nick: 'nick',
                    hostname: 'example.org',
                    params: ['']
                }, done);
            });

            it('should parse a message that has a tag with no value, multiple parameters and a nick@hostname prefix', function (done) {
                parser.write('@foo :nick@example.org TEST bar baz\r\n');

                expectOutputCalledWith({
                    tags: [{
                        tag: 'foo',
                        value: undefined
                    }],
                    command: 'TEST',
                    nick: 'nick',
                    hostname: 'example.org',
                    params: ['bar', 'baz']
                }, done);
            });

            it('should parse a message that has a tag with no value, multiple parameters (one of which is "trailing") and a nick@hostname prefix', function (done) {
                parser.write('@foo :nick@example.org TEST bar :baz\r\n');

                expectOutputCalledWith({
                    tags: [{
                        tag: 'foo',
                        value: undefined
                    }],
                    command: 'TEST',
                    nick: 'nick',
                    hostname: 'example.org',
                    params: ['bar', 'baz']
                }, done);
            });
            
            it('should parse a message that has a tag with no value, a "trailing" parameter that has spaces and a nick@hostname prefix', function (done) {
                parser.write('@foo :nick@example.org TEST :hello world\r\n');

                expectOutputCalledWith({
                    tags: [{
                        tag: 'foo',
                        value: undefined
                    }],
                    command: 'TEST',
                    nick: 'nick',
                    hostname: 'example.org',
                    params: ['hello world']
                }, done);
            });

            it('should parse a message that has a tag with no value, a single parameter and a nick!ident@hostname prefix', function (done) {
                parser.write('@foo :nick!ident@example.org TEST bar\r\n');

                expectOutputCalledWith({
                    tags: [{
                        tag: 'foo',
                        value: undefined
                    }],
                    command: 'TEST',
                    nick: 'nick',
                    ident: 'ident',
                    hostname: 'example.org',
                    params: ['bar']
                }, done);
            });

            it('should parse a message that has a tag with no value, a single parameter and a nick!ident@hostname prefix', function (done) {
                parser.write('@foo :nick!ident@example.org TEST bar\r\n');

                expectOutputCalledWith({
                    tags: [{
                        tag: 'foo',
                        value: undefined
                    }],
                    command: 'TEST',
                    nick: 'nick',
                    ident: 'ident',
                    hostname: 'example.org',
                    params: ['bar']
                }, done);
            });

            it('should parse a message that has a tag with no value, a single "trailing" parameter and a nick!ident@hostname prefix', function (done) {
                parser.write('@foo :nick!ident@example.org TEST :bar\r\n');

                expectOutputCalledWith({
                    tags: [{
                        tag: 'foo',
                        value: undefined
                    }],
                    command: 'TEST',
                    nick: 'nick',
                    ident: 'ident',
                    hostname: 'example.org',
                    params: ['bar']
                }, done);
            });

            it('should parse a message that has a tag with no value, a single empty "trailing" parameter and a nick@hostname prefix', function (done) {
                parser.write('@foo :nick!ident@example.org TEST :\r\n');

                expectOutputCalledWith({
                    tags: [{
                        tag: 'foo',
                        value: undefined
                    }],
                    command: 'TEST',
                    nick: 'nick',
                    ident: 'ident',
                    hostname: 'example.org',
                    params: ['']
                }, done);
            });

            it('should parse a message that has a tag with no value, multiple parameters and a nick!ident@hostname prefix', function (done) {
                parser.write('@foo :nick!ident@example.org TEST bar baz\r\n');

                expectOutputCalledWith({
                    tags: [{
                        tag: 'foo',
                        value: undefined
                    }],
                    command: 'TEST',
                    nick: 'nick',
                    ident: 'ident',
                    hostname: 'example.org',
                    params: ['bar', 'baz']
                }, done);
            });

            it('should parse a message that has a tag with no value, multiple parameters (one of which is "trailing") and a nick!ident@hostname prefix', function (done) {
                parser.write('@foo :nick!ident@example.org TEST bar :baz\r\n');

                expectOutputCalledWith({
                    tags: [{
                        tag: 'foo',
                        value: undefined
                    }],
                    command: 'TEST',
                    nick: 'nick',
                    ident: 'ident',
                    hostname: 'example.org',
                    params: ['bar', 'baz']
                }, done);
            });
            
            it('should parse a message that has a tag with no value, a "trailing" parameter that has spaces and a nick!ident@hostname prefix', function (done) {
                parser.write('@foo :nick!ident@example.org TEST :hello world\r\n');

                expectOutputCalledWith({
                    tags: [{
                        tag: 'foo',
                        value: undefined
                    }],
                    command: 'TEST',
                    nick: 'nick',
                    ident: 'ident',
                    hostname: 'example.org',
                    params: ['hello world']
                }, done);
            });

            it('should parse a message that has a tag with a value, a single parameter and a hostname prefix', function (done) {
                parser.write('@foo=testvalue :irc.example.org TEST bar\r\n');

                expectOutputCalledWith({
                    tags: [{
                        tag: 'foo',
                        value: 'testvalue'
                    }],
                    command: 'TEST',
                    prefix: 'irc.example.org',
                    params: ['bar']
                }, done);
            });

            it('should parse a message that has a tag with a value, a single parameter and a hostname prefix', function (done) {
                parser.write('@foo=testvalue :irc.example.org TEST bar\r\n');

                expectOutputCalledWith({
                    tags: [{
                        tag: 'foo',
                        value: 'testvalue'
                    }],
                    command: 'TEST',
                    prefix: 'irc.example.org',
                    params: ['bar']
                }, done);
            });

            it('should parse a message that has a tag with a value, a single "trailing" parameter and a hostname prefix', function (done) {
                parser.write('@foo=testvalue :irc.example.org TEST :bar\r\n');

                expectOutputCalledWith({
                    tags: [{
                        tag: 'foo',
                        value: 'testvalue'
                    }],
                    command: 'TEST',
                    prefix: 'irc.example.org',
                    params: ['bar']
                }, done);
            });

            it('should parse a message that has a tag with a value, a single empty "trailing" parameter and a hostname prefix', function (done) {
                parser.write('@foo=testvalue :irc.example.org TEST :\r\n');

                expectOutputCalledWith({
                    tags: [{
                        tag: 'foo',
                        value: 'testvalue'
                    }],
                    command: 'TEST',
                    prefix: 'irc.example.org',
                    params: ['']
                }, done);
            });

            it('should parse a message that has a tag with a value, multiple parameters and a hostname prefix', function (done) {
                parser.write('@foo=testvalue :irc.example.org TEST bar baz\r\n');

                expectOutputCalledWith({
                    tags: [{
                        tag: 'foo',
                        value: 'testvalue'
                    }],
                    command: 'TEST',
                    prefix: 'irc.example.org',
                    params: ['bar', 'baz']
                }, done);
            });

            it('should parse a message that has a tag with a value, multiple parameters (one of which is "trailing") and a hostname prefix', function (done) {
                parser.write('@foo=testvalue :irc.example.org TEST bar :baz\r\n');

                expectOutputCalledWith({
                    tags: [{
                        tag: 'foo',
                        value: 'testvalue'
                    }],
                    command: 'TEST',
                    prefix: 'irc.example.org',
                    params: ['bar', 'baz']
                }, done);
            });

            it('should parse a message that has a tag with a value, a "trailing" parameter that has spaces and a hostname prefix', function (done) {
                parser.write('@foo=testvalue :irc.example.org TEST :hello world\r\n');

                expectOutputCalledWith({
                    tags: [{
                        tag: 'foo',
                        value: 'testvalue'
                    }],
                    command: 'TEST',
                    prefix: 'irc.example.org',
                    params: ['hello world']
                }, done);
            });

            it('should parse a message that has a tag with a value, a single parameter and a nick@hostname prefix', function (done) {
                parser.write('@foo=testvalue :nick@example.org TEST bar\r\n');

                expectOutputCalledWith({
                    tags: [{
                        tag: 'foo',
                        value: 'testvalue'
                    }],
                    command: 'TEST',
                    nick: 'nick',
                    hostname: 'example.org',
                    params: ['bar']
                }, done);
            });

            it('should parse a message that has a tag with a value, a single parameter and a nick@hostname prefix', function (done) {
                parser.write('@foo=testvalue :nick@example.org TEST bar\r\n');

                expectOutputCalledWith({
                    tags: [{
                        tag: 'foo',
                        value: 'testvalue'
                    }],
                    command: 'TEST',
                    nick: 'nick',
                    hostname: 'example.org',
                    params: ['bar']
                }, done);
            });

            it('should parse a message that has a tag with a value, a single "trailing" parameter and a nick@hostname prefix', function (done) {
                parser.write('@foo=testvalue :nick@example.org TEST :bar\r\n');

                expectOutputCalledWith({
                    tags: [{
                        tag: 'foo',
                        value: 'testvalue'
                    }],
                    command: 'TEST',
                    nick: 'nick',
                    hostname: 'example.org',
                    params: ['bar']
                }, done);
            });

            it('should parse a message that has a tag with a value, a single empty "trailing" parameter and a nick@hostname prefix', function (done) {
                parser.write('@foo=testvalue :nick@example.org TEST :\r\n');

                expectOutputCalledWith({
                    tags: [{
                        tag: 'foo',
                        value: 'testvalue'
                    }],
                    command: 'TEST',
                    nick: 'nick',
                    hostname: 'example.org',
                    params: ['']
                }, done);
            });

            it('should parse a message that has a tag with a value, multiple parameters and a nick@hostname prefix', function (done) {
                parser.write('@foo=testvalue :nick@example.org TEST bar baz\r\n');

                expectOutputCalledWith({
                    tags: [{
                        tag: 'foo',
                        value: 'testvalue'
                    }],
                    command: 'TEST',
                    nick: 'nick',
                    hostname: 'example.org',
                    params: ['bar', 'baz']
                }, done);
            });

            it('should parse a message that has a tag with a value, multiple parameters (one of which is "trailing") and a nick@hostname prefix', function (done) {
                parser.write('@foo=testvalue :nick@example.org TEST bar :baz\r\n');

                expectOutputCalledWith({
                    tags: [{
                        tag: 'foo',
                        value: 'testvalue'
                    }],
                    command: 'TEST',
                    nick: 'nick',
                    hostname: 'example.org',
                    params: ['bar', 'baz']
                }, done);
            });
            
            it('should parse a message that has a tag with a value, a "trailing" parameter that has spaces and a nick@hostname prefix', function (done) {
                parser.write('@foo=testvalue :nick@example.org TEST :hello world\r\n');

                expectOutputCalledWith({
                    tags: [{
                        tag: 'foo',
                        value: 'testvalue'
                    }],
                    command: 'TEST',
                    nick: 'nick',
                    hostname: 'example.org',
                    params: ['hello world']
                }, done);
            });

            it('should parse a message that has a tag with a value, a single parameter and a nick!ident@hostname prefix', function (done) {
                parser.write('@foo=testvalue :nick!ident@example.org TEST bar\r\n');

                expectOutputCalledWith({
                    tags: [{
                        tag: 'foo',
                        value: 'testvalue'
                    }],
                    command: 'TEST',
                    nick: 'nick',
                    ident: 'ident',
                    hostname: 'example.org',
                    params: ['bar']
                }, done);
            });

            it('should parse a message that has a tag with a value, a single parameter and a nick!ident@hostname prefix', function (done) {
                parser.write('@foo=testvalue :nick!ident@example.org TEST bar\r\n');

                expectOutputCalledWith({
                    tags: [{
                        tag: 'foo',
                        value: 'testvalue'
                    }],
                    command: 'TEST',
                    nick: 'nick',
                    ident: 'ident',
                    hostname: 'example.org',
                    params: ['bar']
                }, done);
            });

            it('should parse a message that has a tag with a value, a single "trailing" parameter and a nick!ident@hostname prefix', function (done) {
                parser.write('@foo=testvalue :nick!ident@example.org TEST :bar\r\n');

                expectOutputCalledWith({
                    tags: [{
                        tag: 'foo',
                        value: 'testvalue'
                    }],
                    command: 'TEST',
                    nick: 'nick',
                    ident: 'ident',
                    hostname: 'example.org',
                    params: ['bar']
                }, done);
            });

            it('should parse a message that has a tag with a value, a single empty "trailing" parameter and a nick@hostname prefix', function (done) {
                parser.write('@foo=testvalue :nick!ident@example.org TEST :\r\n');

                expectOutputCalledWith({
                    tags: [{
                        tag: 'foo',
                        value: 'testvalue'
                    }],
                    command: 'TEST',
                    nick: 'nick',
                    ident: 'ident',
                    hostname: 'example.org',
                    params: ['']
                }, done);
            });

            it('should parse a message that has a tag with a value, multiple parameters and a nick!ident@hostname prefix', function (done) {
                parser.write('@foo=testvalue :nick!ident@example.org TEST bar baz\r\n');

                expectOutputCalledWith({
                    tags: [{
                        tag: 'foo',
                        value: 'testvalue'
                    }],
                    command: 'TEST',
                    nick: 'nick',
                    ident: 'ident',
                    hostname: 'example.org',
                    params: ['bar', 'baz']
                }, done);
            });

            it('should parse a message that has a tag with a value, multiple parameters (one of which is "trailing") and a nick!ident@hostname prefix', function (done) {
                parser.write('@foo=testvalue :nick!ident@example.org TEST bar :baz\r\n');

                expectOutputCalledWith({
                    tags: [{
                        tag: 'foo',
                        value: 'testvalue'
                    }],
                    command: 'TEST',
                    nick: 'nick',
                    ident: 'ident',
                    hostname: 'example.org',
                    params: ['bar', 'baz']
                }, done);
            });
            
            it('should parse a message that has a tag with a value, a "trailing" parameter that has spaces and a nick!ident@hostname prefix', function (done) {
                parser.write('@foo=testvalue :nick!ident@example.org TEST :hello world\r\n');

                expectOutputCalledWith({
                    tags: [{
                        tag: 'foo',
                        value: 'testvalue'
                    }],
                    command: 'TEST',
                    nick: 'nick',
                    ident: 'ident',
                    hostname: 'example.org',
                    params: ['hello world']
                }, done);
            });

            it('should parse a message that has multiple tags with no values, a single parameter and a hostname prefix', function (done) {
                parser.write('@foo;bar :irc.example.org TEST bar\r\n');

                expectOutputCalledWith({
                    tags: [
                        {
                            tag: 'foo',
                            value: undefined
                        },
                        {
                            tag: 'bar',
                            value: undefined
                        }
                    ],
                    command: 'TEST',
                    prefix: 'irc.example.org',
                    params: ['bar']
                }, done);
            });

            it('should parse a message that has multiple tags with no values, a single parameter and a hostname prefix', function (done) {
                parser.write('@foo;bar :irc.example.org TEST bar\r\n');

                expectOutputCalledWith({
                    tags: [
                        {
                            tag: 'foo',
                            value: undefined
                        },
                        {
                            tag: 'bar',
                            value: undefined
                        }
                    ],
                    command: 'TEST',
                    prefix: 'irc.example.org',
                    params: ['bar']
                }, done);
            });

            it('should parse a message that has multiple tags with no values, a single "trailing" parameter and a hostname prefix', function (done) {
                parser.write('@foo;bar :irc.example.org TEST :bar\r\n');

                expectOutputCalledWith({
                    tags: [
                        {
                            tag: 'foo',
                            value: undefined
                        },
                        {
                            tag: 'bar',
                            value: undefined
                        }
                    ],
                    command: 'TEST',
                    prefix: 'irc.example.org',
                    params: ['bar']
                }, done);
            });

            it('should parse a message that has multiple tags with no values, a single empty "trailing" parameter and a hostname prefix', function (done) {
                parser.write('@foo;bar :irc.example.org TEST :\r\n');

                expectOutputCalledWith({
                    tags: [
                        {
                            tag: 'foo',
                            value: undefined
                        },
                        {
                            tag: 'bar',
                            value: undefined
                        }
                    ],
                    command: 'TEST',
                    prefix: 'irc.example.org',
                    params: ['']
                }, done);
            });

            it('should parse a message that has multiple tags with no values, multiple parameters and a hostname prefix', function (done) {
                parser.write('@foo;bar :irc.example.org TEST bar baz\r\n');

                expectOutputCalledWith({
                    tags: [
                        {
                            tag: 'foo',
                            value: undefined
                        },
                        {
                            tag: 'bar',
                            value: undefined
                        }
                    ],
                    command: 'TEST',
                    prefix: 'irc.example.org',
                    params: ['bar', 'baz']
                }, done);
            });

            it('should parse a message that has multiple tags with no values, multiple parameters (one of which is "trailing") and a hostname prefix', function (done) {
                parser.write('@foo;bar :irc.example.org TEST bar :baz\r\n');

                expectOutputCalledWith({
                    tags: [
                        {
                            tag: 'foo',
                            value: undefined
                        },
                        {
                            tag: 'bar',
                            value: undefined
                        }
                    ],
                    command: 'TEST',
                    prefix: 'irc.example.org',
                    params: ['bar', 'baz']
                }, done);
            });

            it('should parse a message that has multiple tags with no values, a "trailing" parameter that has spaces and a hostname prefix', function (done) {
                parser.write('@foo;bar :irc.example.org TEST :hello world\r\n');

                expectOutputCalledWith({
                    tags: [
                        {
                            tag: 'foo',
                            value: undefined
                        },
                        {
                            tag: 'bar',
                            value: undefined
                        }
                    ],
                    command: 'TEST',
                    prefix: 'irc.example.org',
                    params: ['hello world']
                }, done);
            });

            it('should parse a message that has multiple tags with no values, a single parameter and a nick@hostname prefix', function (done) {
                parser.write('@foo;bar :nick@example.org TEST bar\r\n');

                expectOutputCalledWith({
                    tags: [
                        {
                            tag: 'foo',
                            value: undefined
                        },
                        {
                            tag: 'bar',
                            value: undefined
                        }
                    ],
                    command: 'TEST',
                    nick: 'nick',
                    hostname: 'example.org',
                    params: ['bar']
                }, done);
            });

            it('should parse a message that has multiple tags with no values, a single parameter and a nick@hostname prefix', function (done) {
                parser.write('@foo;bar :nick@example.org TEST bar\r\n');

                expectOutputCalledWith({
                    tags: [
                        {
                            tag: 'foo',
                            value: undefined
                        },
                        {
                            tag: 'bar',
                            value: undefined
                        }
                    ],
                    command: 'TEST',
                    nick: 'nick',
                    hostname: 'example.org',
                    params: ['bar']
                }, done);
            });

            it('should parse a message that has multiple tags with no values, a single "trailing" parameter and a nick@hostname prefix', function (done) {
                parser.write('@foo;bar :nick@example.org TEST :bar\r\n');

                expectOutputCalledWith({
                    tags: [
                        {
                            tag: 'foo',
                            value: undefined
                        },
                        {
                            tag: 'bar',
                            value: undefined
                        }
                    ],
                    command: 'TEST',
                    nick: 'nick',
                    hostname: 'example.org',
                    params: ['bar']
                }, done);
            });

            it('should parse a message that has multiple tags with no values, a single empty "trailing" parameter and a nick@hostname prefix', function (done) {
                parser.write('@foo;bar :nick@example.org TEST :\r\n');

                expectOutputCalledWith({
                    tags: [
                        {
                            tag: 'foo',
                            value: undefined
                        },
                        {
                            tag: 'bar',
                            value: undefined
                        }
                    ],
                    command: 'TEST',
                    nick: 'nick',
                    hostname: 'example.org',
                    params: ['']
                }, done);
            });

            it('should parse a message that has multiple tags with no values, multiple parameters and a nick@hostname prefix', function (done) {
                parser.write('@foo;bar :nick@example.org TEST bar baz\r\n');

                expectOutputCalledWith({
                    tags: [
                        {
                            tag: 'foo',
                            value: undefined
                        },
                        {
                            tag: 'bar',
                            value: undefined
                        }
                    ],
                    command: 'TEST',
                    nick: 'nick',
                    hostname: 'example.org',
                    params: ['bar', 'baz']
                }, done);
            });

            it('should parse a message that has multiple tags with no values, multiple parameters (one of which is "trailing") and a nick@hostname prefix', function (done) {
                parser.write('@foo;bar :nick@example.org TEST bar :baz\r\n');

                expectOutputCalledWith({
                    tags: [
                        {
                            tag: 'foo',
                            value: undefined
                        },
                        {
                            tag: 'bar',
                            value: undefined
                        }
                    ],
                    command: 'TEST',
                    nick: 'nick',
                    hostname: 'example.org',
                    params: ['bar', 'baz']
                }, done);
            });
            
            it('should parse a message that has multiple tags with no values, a "trailing" parameter that has spaces and a nick@hostname prefix', function (done) {
                parser.write('@foo;bar :nick@example.org TEST :hello world\r\n');

                expectOutputCalledWith({
                    tags: [
                        {
                            tag: 'foo',
                            value: undefined
                        },
                        {
                            tag: 'bar',
                            value: undefined
                        }
                    ],
                    command: 'TEST',
                    nick: 'nick',
                    hostname: 'example.org',
                    params: ['hello world']
                }, done);
            });

            it('should parse a message that has multiple tags with no values, a single parameter and a nick!ident@hostname prefix', function (done) {
                parser.write('@foo;bar :nick!ident@example.org TEST bar\r\n');

                expectOutputCalledWith({
                    tags: [
                        {
                            tag: 'foo',
                            value: undefined
                        },
                        {
                            tag: 'bar',
                            value: undefined
                        }
                    ],
                    command: 'TEST',
                    nick: 'nick',
                    ident: 'ident',
                    hostname: 'example.org',
                    params: ['bar']
                }, done);
            });

            it('should parse a message that has multiple tags with no values, a single parameter and a nick!ident@hostname prefix', function (done) {
                parser.write('@foo;bar :nick!ident@example.org TEST bar\r\n');

                expectOutputCalledWith({
                    tags: [
                        {
                            tag: 'foo',
                            value: undefined
                        },
                        {
                            tag: 'bar',
                            value: undefined
                        }
                    ],
                    command: 'TEST',
                    nick: 'nick',
                    ident: 'ident',
                    hostname: 'example.org',
                    params: ['bar']
                }, done);
            });

            it('should parse a message that has multiple tags with no values, a single "trailing" parameter and a nick!ident@hostname prefix', function (done) {
                parser.write('@foo;bar :nick!ident@example.org TEST :bar\r\n');

                expectOutputCalledWith({
                    tags: [
                        {
                            tag: 'foo',
                            value: undefined
                        },
                        {
                            tag: 'bar',
                            value: undefined
                        }
                    ],
                    command: 'TEST',
                    nick: 'nick',
                    ident: 'ident',
                    hostname: 'example.org',
                    params: ['bar']
                }, done);
            });

            it('should parse a message that has multiple tags with no values, a single empty "trailing" parameter and a nick@hostname prefix', function (done) {
                parser.write('@foo;bar :nick!ident@example.org TEST :\r\n');

                expectOutputCalledWith({
                    tags: [
                        {
                            tag: 'foo',
                            value: undefined
                        },
                        {
                            tag: 'bar',
                            value: undefined
                        }
                    ],
                    command: 'TEST',
                    nick: 'nick',
                    ident: 'ident',
                    hostname: 'example.org',
                    params: ['']
                }, done);
            });

            it('should parse a message that has multiple tags with no values, multiple parameters and a nick!ident@hostname prefix', function (done) {
                parser.write('@foo;bar :nick!ident@example.org TEST bar baz\r\n');

                expectOutputCalledWith({
                    tags: [
                        {
                            tag: 'foo',
                            value: undefined
                        },
                        {
                            tag: 'bar',
                            value: undefined
                        }
                    ],
                    command: 'TEST',
                    nick: 'nick',
                    ident: 'ident',
                    hostname: 'example.org',
                    params: ['bar', 'baz']
                }, done);
            });

            it('should parse a message that has multiple tags with no values, multiple parameters (one of which is "trailing") and a nick!ident@hostname prefix', function (done) {
                parser.write('@foo;bar :nick!ident@example.org TEST bar :baz\r\n');

                expectOutputCalledWith({
                    tags: [
                        {
                            tag: 'foo',
                            value: undefined
                        },
                        {
                            tag: 'bar',
                            value: undefined
                        }
                    ],
                    command: 'TEST',
                    nick: 'nick',
                    ident: 'ident',
                    hostname: 'example.org',
                    params: ['bar', 'baz']
                }, done);
            });
            
            it('should parse a message that has multiple tags with no values, a "trailing" parameter that has spaces and a nick!ident@hostname prefix', function (done) {
                parser.write('@foo;bar :nick!ident@example.org TEST :hello world\r\n');

                expectOutputCalledWith({
                    tags: [
                        {
                            tag: 'foo',
                            value: undefined
                        },
                        {
                            tag: 'bar',
                            value: undefined
                        }
                    ],
                    command: 'TEST',
                    nick: 'nick',
                    ident: 'ident',
                    hostname: 'example.org',
                    params: ['hello world']
                }, done);
            });

            it('should parse a message that has multiple tags one with a value, a single parameter and a hostname prefix', function (done) {
                parser.write('@foo=bar;baz :irc.example.org TEST bar\r\n');

                expectOutputCalledWith({
                    tags: [
                        {
                            tag: 'foo',
                            value: 'bar'
                        },
                        {
                            tag: 'baz',
                            value: undefined
                        }
                    ],
                    command: 'TEST',
                    prefix: 'irc.example.org',
                    params: ['bar']
                }, done);
            });

            it('should parse a message that has multiple tags one with a value, a single parameter and a hostname prefix', function (done) {
                parser.write('@foo=bar;baz :irc.example.org TEST bar\r\n');

                expectOutputCalledWith({
                    tags: [
                        {
                            tag: 'foo',
                            value: 'bar'
                        },
                        {
                            tag: 'baz',
                            value: undefined
                        }
                    ],
                    command: 'TEST',
                    prefix: 'irc.example.org',
                    params: ['bar']
                }, done);
            });

            it('should parse a message that has multiple tags one with a value, a single "trailing" parameter and a hostname prefix', function (done) {
                parser.write('@foo=bar;baz :irc.example.org TEST :bar\r\n');

                expectOutputCalledWith({
                    tags: [
                        {
                            tag: 'foo',
                            value: 'bar'
                        },
                        {
                            tag: 'baz',
                            value: undefined
                        }
                    ],
                    command: 'TEST',
                    prefix: 'irc.example.org',
                    params: ['bar']
                }, done);
            });

            it('should parse a message that has multiple tags one with a value, a single empty "trailing" parameter and a hostname prefix', function (done) {
                parser.write('@foo=bar;baz :irc.example.org TEST :\r\n');

                expectOutputCalledWith({
                    tags: [
                        {
                            tag: 'foo',
                            value: 'bar'
                        },
                        {
                            tag: 'baz',
                            value: undefined
                        }
                    ],
                    command: 'TEST',
                    prefix: 'irc.example.org',
                    params: ['']
                }, done);
            });

            it('should parse a message that has multiple tags one with a value, multiple parameters and a hostname prefix', function (done) {
                parser.write('@foo=bar;baz :irc.example.org TEST bar baz\r\n');

                expectOutputCalledWith({
                    tags: [
                        {
                            tag: 'foo',
                            value: 'bar'
                        },
                        {
                            tag: 'baz',
                            value: undefined
                        }
                    ],
                    command: 'TEST',
                    prefix: 'irc.example.org',
                    params: ['bar', 'baz']
                }, done);
            });

            it('should parse a message that has multiple tags one with a value, multiple parameters (one of which is "trailing") and a hostname prefix', function (done) {
                parser.write('@foo=bar;baz :irc.example.org TEST bar :baz\r\n');

                expectOutputCalledWith({
                    tags: [
                        {
                            tag: 'foo',
                            value: 'bar'
                        },
                        {
                            tag: 'baz',
                            value: undefined
                        }
                    ],
                    command: 'TEST',
                    prefix: 'irc.example.org',
                    params: ['bar', 'baz']
                }, done);
            });

            it('should parse a message that has multiple tags one with a value, a "trailing" parameter that has spaces and a hostname prefix', function (done) {
                parser.write('@foo=bar;baz :irc.example.org TEST :hello world\r\n');

                expectOutputCalledWith({
                    tags: [
                        {
                            tag: 'foo',
                            value: 'bar'
                        },
                        {
                            tag: 'baz',
                            value: undefined
                        }
                    ],
                    command: 'TEST',
                    prefix: 'irc.example.org',
                    params: ['hello world']
                }, done);
            });

            it('should parse a message that has multiple tags one with a value, a single parameter and a nick@hostname prefix', function (done) {
                parser.write('@foo=bar;baz :nick@example.org TEST bar\r\n');

                expectOutputCalledWith({
                    tags: [
                        {
                            tag: 'foo',
                            value: 'bar'
                        },
                        {
                            tag: 'baz',
                            value: undefined
                        }
                    ],
                    command: 'TEST',
                    nick: 'nick',
                    hostname: 'example.org',
                    params: ['bar']
                }, done);
            });

            it('should parse a message that has multiple tags one with a value, a single parameter and a nick@hostname prefix', function (done) {
                parser.write('@foo=bar;baz :nick@example.org TEST bar\r\n');

                expectOutputCalledWith({
                    tags: [
                        {
                            tag: 'foo',
                            value: 'bar'
                        },
                        {
                            tag: 'baz',
                            value: undefined
                        }
                    ],
                    command: 'TEST',
                    nick: 'nick',
                    hostname: 'example.org',
                    params: ['bar']
                }, done);
            });

            it('should parse a message that has multiple tags one with a value, a single "trailing" parameter and a nick@hostname prefix', function (done) {
                parser.write('@foo=bar;baz :nick@example.org TEST :bar\r\n');

                expectOutputCalledWith({
                    tags: [
                        {
                            tag: 'foo',
                            value: 'bar'
                        },
                        {
                            tag: 'baz',
                            value: undefined
                        }
                    ],
                    command: 'TEST',
                    nick: 'nick',
                    hostname: 'example.org',
                    params: ['bar']
                }, done);
            });

            it('should parse a message that has multiple tags one with a value, a single empty "trailing" parameter and a nick@hostname prefix', function (done) {
                parser.write('@foo=bar;baz :nick@example.org TEST :\r\n');

                expectOutputCalledWith({
                    tags: [
                        {
                            tag: 'foo',
                            value: 'bar'
                        },
                        {
                            tag: 'baz',
                            value: undefined
                        }
                    ],
                    command: 'TEST',
                    nick: 'nick',
                    hostname: 'example.org',
                    params: ['']
                }, done);
            });

            it('should parse a message that has multiple tags one with a value, multiple parameters and a nick@hostname prefix', function (done) {
                parser.write('@foo=bar;baz :nick@example.org TEST bar baz\r\n');

                expectOutputCalledWith({
                    tags: [
                        {
                            tag: 'foo',
                            value: 'bar'
                        },
                        {
                            tag: 'baz',
                            value: undefined
                        }
                    ],
                    command: 'TEST',
                    nick: 'nick',
                    hostname: 'example.org',
                    params: ['bar', 'baz']
                }, done);
            });

            it('should parse a message that has multiple tags one with a value, multiple parameters (one of which is "trailing") and a nick@hostname prefix', function (done) {
                parser.write('@foo=bar;baz :nick@example.org TEST bar :baz\r\n');

                expectOutputCalledWith({
                    tags: [
                        {
                            tag: 'foo',
                            value: 'bar'
                        },
                        {
                            tag: 'baz',
                            value: undefined
                        }
                    ],
                    command: 'TEST',
                    nick: 'nick',
                    hostname: 'example.org',
                    params: ['bar', 'baz']
                }, done);
            });
            
            it('should parse a message that has multiple tags one with a value, a "trailing" parameter that has spaces and a nick@hostname prefix', function (done) {
                parser.write('@foo=bar;baz :nick@example.org TEST :hello world\r\n');

                expectOutputCalledWith({
                    tags: [
                        {
                            tag: 'foo',
                            value: 'bar'
                        },
                        {
                            tag: 'baz',
                            value: undefined
                        }
                    ],
                    command: 'TEST',
                    nick: 'nick',
                    hostname: 'example.org',
                    params: ['hello world']
                }, done);
            });

            it('should parse a message that has multiple tags one with a value, a single parameter and a nick!ident@hostname prefix', function (done) {
                parser.write('@foo=bar;baz :nick!ident@example.org TEST bar\r\n');

                expectOutputCalledWith({
                    tags: [
                        {
                            tag: 'foo',
                            value: 'bar'
                        },
                        {
                            tag: 'baz',
                            value: undefined
                        }
                    ],
                    command: 'TEST',
                    nick: 'nick',
                    ident: 'ident',
                    hostname: 'example.org',
                    params: ['bar']
                }, done);
            });

            it('should parse a message that has multiple tags one with a value, a single parameter and a nick!ident@hostname prefix', function (done) {
                parser.write('@foo=bar;baz :nick!ident@example.org TEST bar\r\n');

                expectOutputCalledWith({
                    tags: [
                        {
                            tag: 'foo',
                            value: 'bar'
                        },
                        {
                            tag: 'baz',
                            value: undefined
                        }
                    ],
                    command: 'TEST',
                    nick: 'nick',
                    ident: 'ident',
                    hostname: 'example.org',
                    params: ['bar']
                }, done);
            });

            it('should parse a message that has multiple tags one with a value, a single "trailing" parameter and a nick!ident@hostname prefix', function (done) {
                parser.write('@foo=bar;baz :nick!ident@example.org TEST :bar\r\n');

                expectOutputCalledWith({
                    tags: [
                        {
                            tag: 'foo',
                            value: 'bar'
                        },
                        {
                            tag: 'baz',
                            value: undefined
                        }
                    ],
                    command: 'TEST',
                    nick: 'nick',
                    ident: 'ident',
                    hostname: 'example.org',
                    params: ['bar']
                }, done);
            });

            it('should parse a message that has multiple tags one with a value, a single empty "trailing" parameter and a nick@hostname prefix', function (done) {
                parser.write('@foo=bar;baz :nick!ident@example.org TEST :\r\n');

                expectOutputCalledWith({
                    tags: [
                        {
                            tag: 'foo',
                            value: 'bar'
                        },
                        {
                            tag: 'baz',
                            value: undefined
                        }
                    ],
                    command: 'TEST',
                    nick: 'nick',
                    ident: 'ident',
                    hostname: 'example.org',
                    params: ['']
                }, done);
            });

            it('should parse a message that has multiple tags one with a value, multiple parameters and a nick!ident@hostname prefix', function (done) {
                parser.write('@foo=bar;baz :nick!ident@example.org TEST bar baz\r\n');

                expectOutputCalledWith({
                    tags: [
                        {
                            tag: 'foo',
                            value: 'bar'
                        },
                        {
                            tag: 'baz',
                            value: undefined
                        }
                    ],
                    command: 'TEST',
                    nick: 'nick',
                    ident: 'ident',
                    hostname: 'example.org',
                    params: ['bar', 'baz']
                }, done);
            });

            it('should parse a message that has multiple tags one with a value, multiple parameters (one of which is "trailing") and a nick!ident@hostname prefix', function (done) {
                parser.write('@foo=bar;baz :nick!ident@example.org TEST bar :baz\r\n');

                expectOutputCalledWith({
                    tags: [
                        {
                            tag: 'foo',
                            value: 'bar'
                        },
                        {
                            tag: 'baz',
                            value: undefined
                        }
                    ],
                    command: 'TEST',
                    nick: 'nick',
                    ident: 'ident',
                    hostname: 'example.org',
                    params: ['bar', 'baz']
                }, done);
            });
            
            it('should parse a message that has multiple tags one with a value, a "trailing" parameter that has spaces and a nick!ident@hostname prefix', function (done) {
                parser.write('@foo=bar;baz :nick!ident@example.org TEST :hello world\r\n');

                expectOutputCalledWith({
                    tags: [
                        {
                            tag: 'foo',
                            value: 'bar'
                        },
                        {
                            tag: 'baz',
                            value: undefined
                        }
                    ],
                    command: 'TEST',
                    nick: 'nick',
                    ident: 'ident',
                    hostname: 'example.org',
                    params: ['hello world']
                }, done);
            });

        });

    });

});

