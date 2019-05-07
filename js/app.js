Vue.use(VuePrintObject);
Vue.use(VueLoading);

Vue.component('loading', VueLoading)

var app = new Vue({
    el: '#app',
    data: () => ({
        // address: "KT1HWuhDdbtVQ2S9NAaeEJyCbAF6cMtLcqcc", // AlphaNet
        // address: "KT1SufMDx6d2tuVe3n6tSYUBNjtV9GgaLgtV", // AlphaNet
        // address: "KT1FU74GimCeEVRAEZGURb6TWU8jK1N6zFJy", // AlphaNet
        // address: "KT1HWuhDdbtVQ2S9NAaeEJyCbAF6cMtLcqcc", // AlphaNet
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
            data: [],
            groups: {}
        },
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
            address: "KT1HWuhDdbtVQ2S9NAaeEJyCbAF6cMtLcqcc"
        }, {
            net: "alpha",
            address: "KT1FEDVALSfQLZwVZbF1hRxJ9c8MTPe7azCZ"
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
    methods: {
        async explore() {
            await this.initApp();

            let loader = this.$loading.show({
                container: this.$refs.formContainer,
                canCancel: false,
                color: "#007bff",
            });

            getPages = async () => {
                let res = await axios.get(`${this.baseApiURL}/number_operations/${this.address}?type=Transaction`)
                return res.data;
            };

            getTransactionData = async () => {
                let res = await axios.get(`${this.baseApiURL}/operations/${this.address}?type=Transaction&p=${this.txInfo.currentPage}`)
                return res.data;
            }

            rebuildTx = (tx) => {
                let operation = tx["type"]["operations"][0]
                let dateObj = new Date(operation["timestamp"]);

                return {
                    "hash": tx["hash"],
                    "block_hash": tx["block_hash"],
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
            }

            moveInternalTxToTemp = (data) => {
                for (let i = data.length - 1; i >= 0; i--) {
                    if (data[i]["internal"] == true) {
                        this.txInfo.tempTxStack.push(data[i])
                    } else {
                        return data.slice(i)
                    }
                }
            }

            buildTxGroups = (data) => {
                let res = {};
                let lastExt = 0;

                for (let i = 0; i < data.length; i++) {
                    if (data[i]["internal"] == true) {
                        continue
                    } else {
                        let txHash = data[i]["hash"];
                        res[txHash] = data.slice(lastExt, i + 1).reverse();
                        lastExt = i + 1;
                    }
                }
                
                return res
            }

            // getNodeData = async (block_hash) => {
            //     let res = await axios.get(`${this.baseNodeApiURL}/${block_hash}/operations/3`)
            //     return res.data;
            // }

            getNodeAccountData = async () => {
                let res = await axios.get(`${this.baseApiURL}/node_account/${this.address}`)
                return res.data;
            }

            buildNodeLinks = async () => {
                let links = [];

                Object.keys(this.txInfo.groups).forEach(function(hash) {
                    let block_hash = this.txInfo.groups[hash][0]["block_hash"];
                    links.push(`${this.baseNodeApiURL}/${block_hash}/operations/3`)
                }, this)

                return links
            }

            getAllNodeData = async () => {
                let links = await buildNodeLinks()
                let promiseArray = links.map( url => axios.get(url) );

                return axios.all( promiseArray )
                .then((results) => { 
                    return results.map( el => el.data ).reduce((a, b) => [...a, ...b], [])
                })
            }

            this.txInfo.maxPages = Math.ceil(await getPages() / 20)
            this.txInfo.data = await getTransactionData()

            this.txInfo.data = this.txInfo.data.map(rebuildTx)

            if (this.txInfo.data.length == 20) {
                this.txInfo.data = moveInternalTxToTemp(this.txInfo.data)
            }

            this.txInfo.groups = buildTxGroups(this.txInfo.data)

            this.nodeAccountData = await getNodeAccountData()


            let code = this.nodeAccountData["script"]["code"];
            let data = this.nodeAccountData["script"]["storage"];
            let result = {};
            let result_for_parameter = {};

            code.forEach(function(element) {
                if (element["prim"] == "storage") {
                    result = buildSchema(element)
                } 
                if (element["prim"] == "parameter") {
                    result_for_parameter = buildSchema(element)
                } 
            });

            this.typeMap = result["type_map"];
            this.collapsedTree = result["collapsed_tree"];
            this.decoded_data = decode_data(data, result);
            this.decoded_schema = decode_schema(result["collapsed_tree"])

            Object.keys(this.txInfo.groups).forEach(function(hash) {
                (this.txInfo.groups[hash]).forEach(function(tx) {
                    let item = JSON.parse(tx["str_parameters"]);

                    tx["decoded_data"] = decode_data(item, result_for_parameter);
                    tx["result"] = null;
                })
            }, this);

            this.parameterSchema = decode_schema(result_for_parameter["collapsed_tree"]);

            

            let final_data = await getAllNodeData()

            final_data.forEach(function(node_data) {
                let big_map_diff = node_data["contents"][0]["metadata"]["operation_result"]["big_map_diff"];
                
                if (big_map_diff) {
                    let schema = {};

                    schema["type_map"] = this.typeMap;
                    schema["collapsed_tree"] = this.collapsedTree;

                    this.txInfo.groups[node_data["hash"]][0]["result"] = bigMapDiffDecode(big_map_diff, schema)
                }
            }, this)

            this.isReady = true;
            loader.hide()
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
            this.txInfo.groups = {};
            this.nodeAccountData = {};
        }
    }
})

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
                            retRes[type_info['props'][i]] = res[i]
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
        return new Date(Date.parse(value))
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
            return [...decode_node(node['args'][0])]
        }

        if (node['prim'] == 'list') {
            return [...decode_node(node['args'][0])]
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
