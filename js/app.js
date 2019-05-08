Vue.use(VuePrintObject);
Vue.use(VueLoading);

Vue.component('loading', VueLoading)

var app = new Vue({
    el: '#app',
    data: () => ({
        // address: "KT1ExvG3EjTrvDcAU7EqLNb77agPa5u6KvnY", // MainNet
        address: "",
        typeMap: {},
        collapsedTree: {},
        isReady: false,
        decoded_data: {},
        decoded_schema: {},
        tezosNet: "alpha",
        parameterSchema: {},
        activetab: 1,
        txInfo: {
            maxPages: 0,
            currentPage: 0,
            tempTxStack: [],
            data: []
        },
        groups: {},
        resultForParameter: {},
        resultForStorage: {},
        nodeAccountData: {},
        demoAddresses: [{
            net: "alpha",
            address: "KT1SufMDx6d2tuVe3n6tSYUBNjtV9GgaLgtV"
        }, {
            net: "alpha",
            address: "KT1FU74GimCeEVRAEZGURb6TWU8jK1N6zFJy"
        }, {
            net: "alpha",
            address: "KT19iGCL4YrVpT6ezEzbDH37Yxbas8jWQz4s"
        }, {
            net: "alpha",
            address: "KT1QiAJocHUKYN29BegaCnCaSQ9FT2ZXGfuJ"
        }, {
            net: "alpha",
            address: "KT1HnvV5Z53naoh51jYvPF7w168nW8nfyx5v"
        }, {
            net: "alpha",
            address: "KT19yAMFum5MmD99kusQiCBGpTEVC1B52f9Q"
        }, {
            net: "alpha",
            address: "KT1Sefu81jFomBUTiJgK6VvCyY5rGrkhPszt"
        }, {
            net: "alpha",
            address: "KT1TpKkwKzGwMrWrGnPp9KixhraD2dtE5wE5"
        }, {
            net: "alpha",
            address: "KT1P3j1VonQytW3b2SzCnGVpjdf3oWajM79E"
        }, {
            net: "alpha",
            address: "KT1XtauF2tnmAKBzbLA2gNoMji9zSzSyYq9w"
        }, {
            net: "alpha",
            address: "KT1Qx7PRNAVHgam1qb2MuJohggnSdHTeBWyc"
        }]
    }),
    computed: {
        baseApiURL: function() {
            if (this.tezosNet === "main") {
                return "https://api5.tzscan.io/v1"
            } else {
                return "https://api.alphanet.tzscan.io/v1"
            }
        },
        baseNodeApiURL: function() {
            if (this.tezosNet === "main") {
                return "https://mainnet-node.tzscan.io/chains/main/blocks"
            } else {
                return "https://alphanet-node.tzscan.io/chains/main/blocks"
            }
        },
        explorerBaseUrl: function() {
            if (this.tezosNet === "main") {
                return "https://tzscan.io/"
            } else {
                return "https://alphanet.tzscan.io/"
            }
        }
    },
    mounted() {
        if (window.location.hash) {
            this.address = (window.location.hash).substring(1);
            this.explore();
        }
    },
    methods: {
        async explore() {
            await this.initApp();

            window.location.hash = "#" + this.address;

            let loader = this.$loading.show({
                container: this.$refs.formContainer,
                canCancel: false,
                color: "#007bff",
            });

            this.nodeAccountData = await this.getNodeAccountData();

            let code = this.nodeAccountData["script"]["code"];
            let data = this.nodeAccountData["script"]["storage"];

            await this.buildSchemas(code)

            this.typeMap = this.resultForStorage["type_map"];
            this.collapsedTree = this.resultForStorage["collapsed_tree"];
            this.decoded_data = decode_data(data, this.resultForStorage);
            this.decoded_schema = decode_schema(this.resultForStorage["collapsed_tree"])
            this.parameterSchema = decode_schema(this.resultForParameter["collapsed_tree"]);

            this.txInfo.maxPages = Math.ceil(await this.getPages() / 20);
            this.txInfo.data = await this.getTransactionData();
            this.txInfo.currentPage += 1;
            this.txInfo.data = this.txInfo.data.map(this.rebuildTx);

            if (this.txInfo.data.length == 20) {
                this.txInfo.data = this.moveInternalTxToTemp(this.txInfo.data);
            }

            this.groups = this.buildTxGroups(this.txInfo.data);

            Object.keys(this.groups).forEach(function(hash) {
                (this.groups[hash]).forEach(function(tx) {
                    let item = {}

                    if (tx["str_parameters"] != undefined) {
                        item = JSON.parse(tx["str_parameters"]);
                    }

                    tx["decoded_data"] = decode_data(item, this.resultForParameter);
                    tx["result"] = null;
                }, this)
            }, this);

            let final_data = await this.getAllNodeData(this.groups)

            final_data.forEach(function(node_data) {
                let big_map_diff = node_data["contents"][0]["metadata"]["operation_result"]["big_map_diff"];
                
                if (big_map_diff && (node_data["hash"] in this.groups)) {
                    let schema = {};

                    schema["type_map"] = this.typeMap;
                    schema["collapsed_tree"] = this.collapsedTree;

                    this.groups[node_data["hash"]][0]["result"] = bigMapDiffDecode(big_map_diff, schema)
                }
            }, this)

            this.isReady = true;
            loader.hide();
        },
        async initApp() {
            this.typeMap = {};
            this.collapsedTree = {};
            this.isReady = false;
            this.decoded_data = {};
            this.decoded_schema = {};
            this.parameterSchema = {};
            this.activetab = 1;
            this.txInfo.maxPages = 0;
            this.txInfo.currentPage = 0;
            this.txInfo.tempTxStack = [];
            this.txInfo.data = [];
            this.groups = {};
            this.nodeAccountData = {};
        },
        async getNodeAccountData() {
            let res = await axios.get(`${this.baseApiURL}/node_account/${this.address}`)
            return res.data;
        },
        async buildSchemas(code) {
            code.forEach(function(element) {
                if (element["prim"] == "storage") {
                    this.resultForStorage = buildSchema(element)
                } 
                if (element["prim"] == "parameter") {
                    this.resultForParameter = buildSchema(element);
                } 
            }, this);
        },
        async getPages() {
            let res = await axios.get(`${this.baseApiURL}/number_operations/${this.address}?type=Transaction`)
            return res.data;
        },
        async getTransactionData() {
            let res = await axios.get(`${this.baseApiURL}/operations/${this.address}?type=Transaction&p=${this.txInfo.currentPage}`)
            return res.data;
        },
        rebuildTx(tx) {
            let operation = tx["type"]["operations"][0]
            let dateObj = new Date(operation["timestamp"]);

            return {
                "hash": tx["hash"],
                "block_hash": tx["block_hash"],
                "failed": operation["failed"],
                "src": operation["src"]["tz"],
                "dst": operation["destination"]["tz"],
                "amount": operation["amount"],
                "fee": operation["fee"],
                "str_parameters": operation["str_parameters"],
                "internal": operation["internal"],
                "op_level": operation["op_level"],
                "decoded_data": null,
                "time": dateObj.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
                "date": dateObj.toLocaleString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' })
            }
        },
        moveInternalTxToTemp(data) {
            for (let i = data.length - 1; i >= 0; i--) {
                if (data[i]["internal"] == true) {
                    this.txInfo.tempTxStack.push(data[i])
                } else {
                    return data.slice(0, i + 1)
                }
            }
        },
        buildTxGroups(data) {
            let res = {};
            for (let i = 0; i < data.length; i++) {
                let txHash = data[i]["hash"];
                if (txHash in res) {
                    res[txHash].unshift(data[i])
                } else {
                    res[txHash] = new Array(data[i])
                }
            }

            return res
        },
        async buildNodeLinks(groups) {
            let links = [];

            Object.keys(groups).forEach(function(hash) {
                let block_hash = groups[hash][0]["block_hash"];
                links.push(`${this.baseNodeApiURL}/${block_hash}/operations/3`)
            }, this)

            return links
        },
        async getAllNodeData(groups) {
            let links = await this.buildNodeLinks(groups);
            let promiseArray = links.map( url => axios.get(url) );

            return axios.all( promiseArray )
            .then((results) => { 
                return results.map( el => el.data ).reduce((a, b) => [...a, ...b], [])
            })
        },
        formatAddress(address) {
            return address.substr(0,4) + "..." + address.substr(address.length - 4,4)
        },
        formatXTZ(amount) {
            if (amount == 0) {
                return "0 ꜩ"
            }
            return (amount / Math.pow(10, 6)).toString() + " ꜩ"
        },
        demo() {
            let pick = randomInteger(0, this.demoAddresses.length - 1)
            let item = this.demoAddresses[pick]

            this.tezosNet = item["net"]
            this.address = item["address"]
            this.explore()
        },
        async loadMore() {
            let loader = this.$loading.show({
                container: this.$refs.formContainer,
                canCancel: false,
                color: "#007bff",
            });

            let data = await this.getTransactionData();
            let currentTxStack = this.txInfo.tempTxStack;

            this.txInfo.currentPage += 1;

            data = data.map(this.rebuildTx);

            if (data.length == 20) {
                this.txInfo.tempTxStack = [];
                data = this.moveInternalTxToTemp(data);
            }

            currentTxStack = currentTxStack.concat(data);
            let newGroups = this.buildTxGroups(currentTxStack);

            Object.keys(newGroups).forEach(function(hash) {
                (newGroups[hash]).forEach(function(tx) {
                    let item = JSON.parse(tx["str_parameters"]);

                    tx["decoded_data"] = decode_data(item, this.resultForParameter);
                    tx["result"] = null;
                }, this)
            }, this);

            let final_data = await this.getAllNodeData(newGroups)

            final_data.forEach(function(node_data) {
                let big_map_diff = node_data["contents"][0]["metadata"]["operation_result"]["big_map_diff"];
                
                if (big_map_diff && (node_data["hash"] in newGroups)) {
                    newGroups[node_data["hash"]][0]["result"] = bigMapDiffDecode(big_map_diff, this.resultForStorage)
                }
            }, this)

            this.groups = extend(this.groups, newGroups)

            this.activetab = 2;
            this.activetab = 1;
            loader.hide();
        }
    }
})

function extend(obj, src) {
    Object.keys(src).forEach(function(key) { obj[key] = src[key]; });
    return obj;
}

function randomInteger(min, max) {
    var rand = min + Math.random() * (max + 1 - min);
    rand = Math.floor(rand);
    return rand;
  }

function get_flat_nested(nested) {
    let flat_args = [];

    nested.args.forEach(function(arg) {
        if ((arg instanceof Nested) && (arg["prim"] == nested.prim)) {
            flat_args = flat_args.concat(get_flat_nested(arg));
        } else {
            flat_args.push(arg);
        }
    })

    return flat_args
}

function get_route_terminal(route) {
    if (route.value instanceof Route) {
        return get_route_terminal(route.value)
    }
    return route
}

function allTrue(obj) {
    for (var o in obj) {
        if (!obj[o]) {
            return false;
        }
    }

    return true;
}

function isObject(obj) {
  return obj === Object(obj);
}

function onlyUnique(value, index, self) { 
    return self.indexOf(value) === index;
}

class Nested extends Object {}
class Route extends Object {}

function getAnnotation(x, prefix, def=undefined) {
    let ret = []

    if (x["annots"]) {
        x["annots"].forEach(function(a) {
            if (a[0] == prefix) {
                ret.push(a.slice(1, a.length))
            }
        })
    }

    return ret.length > 0 ? ret[0] : def
}

function buildSchema(code) {
    let type_map = {}

    function parseNode(node, path="0", parent_prim=undefined) {
        if (["storage", "parameter"].includes(node["prim"])) {
            return parseNode(node['args'][0])
        }

        type_map[path] = {"prim": node['prim']}
        let typename = getAnnotation(node, ':')

        let args = [];
        let nodeArgs = node["args"];

        if (nodeArgs != undefined) {
            Object.keys(nodeArgs).forEach(function (i) {
                args.push(parseNode(nodeArgs[i], path+i, node["prim"]));
            });
        }

        if (["pair", "or"].includes(node["prim"])) {
            res = new Nested()
            res.prim = node['prim'];
            res.args = args;

            if (typename || (parent_prim != node["prim"])) {
                args = get_flat_nested(res);
                type_map[path]['children'] = args.map(function(x) {
                    return x["path"];
                });

                let props = args.map(function(x) {
                    return x["name"];
                });

                if (allTrue(props)) {
                    type_map[path]['props'] = props;
                }

                if (typename) {
                    type_map[path]['name'] = typename;
                }

            } else {
                return res;
            }
        }

        return {
            "prim": node["prim"],
            "path": path,
            "args": args,
            "name": getAnnotation(node, "%", typename)
        }
    }

    let collapsed_tree = parseNode(code)
    return {
        "type_map": type_map,
        "collapsed_tree": collapsed_tree
    }
}

function decode_data(data, schema, annotations=true, literals=true, rootNode='0') {
    function decode_node(node, path='0') {
        let res = {};

        if (schema["type_map"][path] != undefined) {
            var type_info = schema["type_map"][path]
        } else {
            var type_info = {}
        }

        if (isObject(node) && !Array.isArray(node)) {
            let args = [];
            let nodeArgs = node["args"];

            if (nodeArgs != undefined) {
                Object.keys(nodeArgs).forEach(function (i) {
                    args.push(decode_node(nodeArgs[i], path+i));
                });
            }
            
            if (node["prim"] == "Pair") {
                res = new Nested()
                res.prim = type_info['prim']
                res.args = args;

                if (type_info["children"] != undefined) {
                    res = get_flat_nested(res);

                    if (type_info['props'] != undefined && annotations) {
                        retRes = {}
                        for (var i = 0; i < res.length; i++) {
                            if (res[i] != undefined) {
                                retRes[type_info['props'][i]] = res[i]
                            }  
                        }
                        res = retRes
                    }  
                }  
            } else if (["Left", "Right"].includes(node["prim"])) {
                let arg_path = path + (node["prim"] == "Left" ? '0' : '1');
                res = new Route();
                res.path = arg_path;
                res.value = decode_node(node['args'][0], arg_path);

                if (type_info["children"] != undefined ) {
                    let terminal = get_route_terminal(res)

                    if (type_info['props'] != undefined && annotations == true) {
                        let index = type_info["children"].indexOf(terminal.path)
                        res = {}
                        res[type_info['props'][index]] = terminal.value;
                    } else {
                        res = terminal.value;
                    }
                }
            } else if (node["prim"] == "Elt") {
                res = args
            } else if (node["prim"] == "Some") {
                res = args[0]
            } else if (node["prim"] == "None") {
                res = undefined
            } else if (literals) {
                res = decode_literal(node, type_info["prim"])
            } else {
                let key = Object.keys( node )[0]
                res = node[key]
            }
        } else if (Array.isArray(node)) {
            if (["map", "big_map"].indexOf(type_info["prim"]) != -1) {
                node.forEach(function (item, i) {
                    let elt = decode_node(item, path)
                    res[elt[0]] = elt[1]
                });
            } else {
                args = [];

                node.forEach(function (item) {
                    args.push(decode_node(item, path + "0"))
                });

                if (type_info["prim"] == "set") {
                    res = args.filter( onlyUnique );
                } else if (type_info["prim"] == "list") {
                    res = args
                } else {
                    console.log("Houston we have a problem: ", node, type_info)
                }
            }
        } else {
            console.log("Houston we have a problem: ", node, type_info)
        }

        return res
    }

    return decode_node(data, rootNode)
}

function decode_literal(node, prim) {
    let key = Object.keys( node )[0]

    let core_type = key
    let value = node[key]

    if (["int", "nat"].indexOf(prim) != -1) {
        return parseInt(value)
    }

    if (prim == "timestamp") {
        let ts = parseInt(value) * 1000;
        let date = new Date(ts);
        return date.toLocaleString("en-GB")
    } else if (prim == "mutez") {
        return (parseInt(value) / Math.pow(10, 6)).toFixed(6)
    } else if (prim == "bool") {
        return (value == true)
    } else if (prim == "address" && core_type == "bytes") {
        console.log("Houston we have a problem: ", prim, core_type, value)
        return value
    }

    return value
}

function decode_schema(collapsed_tree) {
    function decode_node(node) {
        if (node["prim"] == "or") {
            var res = {};

            node["args"].forEach(function (arg, i) {
                if (arg["name"] != undefined) {
                    res[arg["name"]] = decode_node(arg)
                } else {
                    res[i] = decode_node(arg)
                }
            });

            return res;
        }

        if (node["prim"] == "pair") {
            var flag = false;
            var values = [];
            var res = {};

            node["args"].forEach(function (arg) {
                if (arg["name"] == undefined) {
                    flag = true
                }

                var va = decode_node(arg)

                values.push(va)
                res[arg["name"]] = va
            });

            return flag ? values : res
        }

        if (node["prim"] == "set") {
            return [decode_node(node['args'][0])]
        }

        if (node['prim'] == 'list') {
            return [decode_node(node['args'][0])]
        }


        if (['map', 'big_map'].indexOf(node['prim']) != -1) {
            var res = {}
            res[decode_node(node['args'][0])] = decode_node(node['args'][1]);
            return res
        }

        return `#${node["prim"]}`
    }

    return decode_node(collapsed_tree)
}

function getBigMapSchema(typeMap) {
    let res = {}
    Object.keys(typeMap).forEach(function(key) {
        if (typeMap[key]["prim"] == "big_map") {
            res["key_path"] = key.toString() + "0";
            res["val_path"] = key.toString() + "1";
        }
    });

    return res
}

function bigMapDiffDecode(data, schema) {
    let paths = getBigMapSchema(schema["type_map"])
    let res = {}

    data.forEach(function(item) {
        let key = decode_data(item["key"], schema, true, true, paths["key_path"])
        let val = decode_data(item["value"], schema, true, true, paths["val_path"])

        res[key] = val
    })

    return res
}
