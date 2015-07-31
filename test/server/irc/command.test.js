IrcCommand = require('../../../server/irc/command.js');

describe('server/irc/command.js', function () {

    describe('getServerTime', function () {

        it('should return undefined if the command has no tags at all', function () {
            var command = new IrcCommand('TEST', { tags: [] });

            expect(command.getServerTime()).toBe(undefined);
        });

        it('should return undefined if the command has no server-time tags', function () {
            var command = new IrcCommand('TEST', { tags: [{ tag: 'example.org/foo', value: 'bar' }] });

            expect(command.getServerTime()).toBe(undefined);
        });

        it('should return a UNIX timestamp if the command has a server-time tag with a UNIX timestamp value', function () {
            var command = new IrcCommand('TEST', { tags: [{ tag: 'time', value: '1438382076' }] });

            expect(command.getServerTime()).toBe(1438382076000);
        });

        it('should return a UNIX timestamp if the command has a server-time tag with an ISO 8601 value', function () {
            var command = new IrcCommand('TEST', { tags: [{ tag: 'time', value: '2015-07-31T22:34:36+00:00' }] });

            expect(command.getServerTime()).toBe(1438382076000);
        });

    });

});
