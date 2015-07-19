var proxyquire = require('proxyquire');

describe('server/dns.js', function () {
    var dns, node_dns, net;

    beforeEach(function () {
        node_dns = jasmine.createSpyObj('dns', ['resolve6', 'resolve4']);
        node_dns['@callThru'] = false;
        net = jasmine.createSpyObj('net', ['isIP', 'isIPv4']);
        net['@callThru'] = false;

        dns = proxyquire('../../server/dns.js', {
            'net': net,
            'dns': node_dns
        });
    });

    describe('getConnectionFamily', function () {

        beforeEach(function () {
            node_dns.resolve6.and.callFake(function (host, cb) {
                cb(null, []);
            });
            node_dns.resolve4.and.callFake(function (host, cb) {
                cb(null, []);
            });
        });

        it('should return "IPv4" if host is an IPv4 address', function (done) {
            net.isIP.and.returnValue(true);
            net.isIPv4.and.returnValue(true);

            dns.getConnectionFamily('0.0.0.0', function (err, family) {
                if (err) {
                    return done.fail(err);
                }

                expect(family).toEqual('IPv4');

                done();
            });
        });

        it('should return "IPv6" if host is an IPv6 address', function (done) {
            net.isIP.and.returnValue(true);
            net.isIPv4.and.returnValue(false);

            dns.getConnectionFamily('0.0.0.0', function (err, family) {
               if (err) {
                    return done.fail(err);
                }

                expect(family).toEqual('IPv6');

                done();
            });
        });

        it('should not call dns.resolve[4|6] if the host is an IP address', function (done) {
            net.isIP.and.returnValue(true);
            net.isIPv4.and.returnValue(false);

            dns.getConnectionFamily('0.0.0.0', function (err, family) {
               if (err) {
                    return done.fail(err);
                }

                expect(node_dns.resolve6).not.toHaveBeenCalled();
                expect(node_dns.resolve4).not.toHaveBeenCalled();

                done();
            });
        });

        it('should attempt to perform a v6 lookup before a v4 lookup', function (done) {
            net.isIP.and.returnValue(false);

            dns.getConnectionFamily('example.com', function (err) {
                if (err) {
                    return done.fail(err);
                }

                expect(node_dns.resolve6).toHaveBeenCalled();
                expect(node_dns.resolve4).not.toHaveBeenCalled();

                done();
            });
        });

        it('should perform a v4 lookup if a v6 lookup is unsuccessful', function (done) {
            net.isIP.and.returnValue(false);
            node_dns.resolve6.and.callFake(function (host, cb) {
                cb('test error');
            });

            dns.getConnectionFamily('example.com', function (err) {
                if (err) {
                    return done.fail(err);
                }

                expect(node_dns.resolve6).toHaveBeenCalled();
                expect(node_dns.resolve4).toHaveBeenCalled();

                done();
            });
        });

        it('should return an error if both the v6 and v4 lookups are unsuccessful', function (done) {
            net.isIP.and.returnValue(false);
            node_dns.resolve6.and.callFake(function (host, cb) {
                cb('test error');
            });
            node_dns.resolve4.and.callFake(function (host, cb) {
                cb('test error');
            });

            dns.getConnectionFamily('example.com', function (err) {
                expect(err).toEqual('test error');

                done();
            });
        });

    });

});

