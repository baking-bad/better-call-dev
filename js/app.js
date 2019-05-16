Vue.use(VuePrintObject);
Vue.use(VueLoading);

Vue.component('loading', VueLoading)

var app = new Vue({
    el: '#app',
    data: () => ({
        // address: "KT1ExvG3EjTrvDcAU7EqLNb77agPa5u6KvnY", // MainNet
        address: "",
        tezosNet: "alpha",
        activetab: 1,
        isReady: false,
        resultForParameter: {},
        resultForStorage: {},
        decoded_data: {},
        decoded_schema: {},
        parameterSchema: {},
        txInfo: {
            maxPages: 0,
            currentPage: 0,
            data: [],
            levels: []
        },
        groups: {},   
        baseAppURL: "https://baking-bad.github.io/better-call-dev/#",
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
        }
    },
    mounted() {
        if (window.location.hash) {
            let params = (window.location.hash).substring(1).split(':');
            this.tezosNet = params[0];
            this.address = params[1];
            this.explore();
        }
    },
    methods: {
        async explore() {
            await this.initApp();

            window.location.hash = `#${this.tezosNet}:${this.address}`

            let loader = this.setupLoader()

            let contractsData = await this.getContractsData();
            let code = contractsData["script"]["code"];
            let data = contractsData["script"]["storage"];

            await this.buildSchemas(code)

            this.decoded_data = decode_data(data, this.resultForStorage);
            this.decoded_schema = decode_schema(this.resultForStorage["collapsed_tree"])
            this.parameterSchema = decode_schema(this.resultForParameter["collapsed_tree"]);

            // move this to getTxData interface
            this.txInfo.maxPages = Math.ceil(await this.getPages() / 20);
            this.txInfo.data = await this.getTransactionData();
            this.txInfo.currentPage += 1;
            //

            this.groups = this.buildGroups(this.txInfo.data);
            this.txInfo.levels = this.unique(this.txInfo.data.map(this.getLevels));

            let operationGroups = await this.getAllNodeDataByLevels(this.txInfo.levels);

            this.pushOperationsToGroups(operationGroups, this.groups);
            this.buildBigMapAndParams(this.groups)

            this.isReady = true;
            loader.hide();
        },
        async initApp() {
            this.isReady = false;
            this.decoded_data = {};
            this.decoded_schema = {};
            this.parameterSchema = {};
            this.resultForParameter = {},
            this.resultForStorage = {},
            this.activetab = 1;
            this.txInfo.maxPages = 0;
            this.txInfo.currentPage = 0;
            this.txInfo.data = [];
            this.txInfo.levels = [];
            this.groups = {};
        },
        async getContractsData() {
            let res = await axios.get(`${this.baseNodeApiURL}/head/context/contracts/${this.address}`)
            return res.data;
        },
        setupLoader() {
            return this.$loading.show({
                container: this.$refs.formContainer,
                canCancel: false,
                color: "#76a34e",
            });
        },
        unique(arr) {
            return [...new Set(arr)]
        },
        isRelated(tx) {
            return (tx["kind"] == "transaction") && ([tx["destination"], tx["source"]].includes(this.address))
        },
        getLevels(tx) {
            return tx["type"]["operations"][0]["op_level"]
        },
        async getAllNodeDataByLevels(levels) {
            let links = await this.buildNodeLinksByBlock(levels);
            let promiseArray = links.map( url => axios.get(url) );

            return axios.all( promiseArray )
            .then((results) => {
                return results.map( el => el.data ).reduce((a, b) => [...a, ...b], [])
            })
        },
        async buildNodeLinksByBlock(levels) {
            let links = [];

            levels.forEach(function(level) {
                links.push(`${this.baseNodeApiURL}/${level}/operations/3`)
            }, this)

            return links
        },
        buildGroups(transactions) {
            groups = {}

            transactions.forEach(function(tx) {
                let operation = tx["type"]["operations"][0]
                let dateObj = new Date(operation["timestamp"]);

                groups[tx["hash"]] = {
                    "time": dateObj.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
                    "date": dateObj.toLocaleString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' }),
                    "level": operation["op_level"],
                    "operations": [],
                }
            })

            return groups
        },
        badgeClass: function(status) {
            if (status == "failed") {
                return "badge-danger"
            } else if (status == "skipped") {
                return "badge-warning"
            } else if (status == "applied") {
                return "badge-success"
            } else if (status == "backtracked") {
                return "badge-primary"
            }

            return "badge-secondary"
        },
        pushOperationsToGroups(operationGroups, groups) {
            operationGroups.forEach(function(group) {
                group["contents"].forEach(function(operation) {
                    if (this.isRelated(operation)) {
                        groups[group["hash"]].operations.push(operation)
                    }

                    if (operation["metadata"]["internal_operation_results"] != undefined) {
                        operation["metadata"]["internal_operation_results"].forEach(function(op) {
                            if (this.isRelated(op)) {
                                groups[group["hash"]].operations.push(op)
                            }
                        }, this)
                    }
                }, this)
            }, this)
        },
        buildBigMapAndParams(groups) {
            Object.keys(groups).forEach(function(hash) {
                groups[hash]["operations"].forEach(function(operation) {
                    if (operation["result"] != undefined) {
                        operation["status"] = operation["result"]["status"]
                    } else if (operation["metadata"]["operation_result"] != undefined) {
                        operation["status"] = operation["metadata"]["operation_result"]["status"];
                    }

                    if (operation["destination"] == this.address) {
                        if (operation["metadata"] != undefined) {
                            let bigMapDiff = operation["metadata"]["operation_result"]["big_map_diff"];
                            if (bigMapDiff != undefined) {
                                operation["decodedBigMapDiff"] = bigMapDiffDecode(bigMapDiff, this.resultForStorage)
                            }
                        }
                        if (operation["parameters"] != undefined) {
                            operation["decodedParameters"] = decode_data(operation["parameters"], this.resultForParameter);
                        }
                    }
                }, this)
            }, this)
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
        formatAddress(address) {
            return address.substr(0,4) + "..." + address.substr(address.length - 4,4)
        },
        formatXTZ(amount) {
            if (amount == 0 || amount == undefined) {
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
            let loader = this.setupLoader();
            
            // move this to getTxData interface
            let data = await this.getTransactionData();
            this.txInfo.currentPage += 1;
            //

            let levels = this.unique(data.map(this.getLevels));
            let newLevels = [];

            levels.forEach(function(level) {
                if (!this.txInfo.levels.includes(level)) {
                    newLevels.push(level)
                }
            }, this)

            let newGroups = this.buildGroups(data);
            let newOperationGroups = await this.getAllNodeDataByLevels(newLevels);

            this.pushOperationsToGroups(newOperationGroups, newGroups);
            this.buildBigMapAndParams(newGroups)

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
