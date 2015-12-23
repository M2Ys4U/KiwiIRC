define('helpers/rpc', ['misc/gateway'], function (Gateway) {
    return Gateway.instance().rpc;
});
