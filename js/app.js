Vue.use(VuePrintObject);
Vue.use(VueLoading);

Vue.component('loading', VueLoading)

var app = new Vue({
    el: '#app',
    data: () => ({
        // address: "KT1HWuhDdbtVQ2S9NAaeEJyCbAF6cMtLcqcc", // AlphaNet
        address: "KT1SufMDx6d2tuVe3n6tSYUBNjtV9GgaLgtV", // AlphaNet
        // address: "KT1FU74GimCeEVRAEZGURb6TWU8jK1N6zFJy", // AlphaNet
        // address: "KT1ExvG3EjTrvDcAU7EqLNb77agPa5u6KvnY", // MainNet
        typeMap: {},
        collapsedTree: {},
        isReady: false,
        decoded_data: {},
        decoded_schema: {},
        tezosNet: "alpha",
        parameterSchema: {},
        txData: [],
        txDecoded: [],
        txWithDecodedData: {}
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
                return "http://mainnet-node.tzscan.io/chains/main/blocks"
            } else {
                return "http://alphanet-node.tzscan.io/chains/main/blocks"
            }
        }
    },
    methods: {
        explore() {
            let loader = this.$loading.show({
                container: this.$refs.formContainer,
                canCancel: false,
                color: "#007bff",
            });

            getPages = async () => {
                let res = await axios.get(`${this.baseApiURL}/number_operations/${this.address}?type=Transaction`)
                return res.data;
            };

            buildTransactionsLinks = async () => {
                let pages = await getPages()
                let links = [];
                pages = Math.ceil(pages / 20)

                for (var i = 0; i < pages; i++) {
                    links.push(`${this.baseApiURL}/operations/${this.address}?type=Transaction&p=${i}`)
                }

                return links
            };

            getTransactionsData = async () => {
                let links = await buildTransactionsLinks()
                let promiseArray = links.map( url => axios.get(url) );

                return axios.all( promiseArray )
                .then((results) => { 
                    return results.map( el => el.data ).reduce((a, b) => [...a, ...b], [])
                })
            }

            makeCalculations = async () => {
                let txs = await getTransactionsData();

                axios
                .get(`${this.baseApiURL}/node_account/${this.address}`)
                .then((response) => {
                    // storage part
                    let code = response["data"]["script"]["code"];
                    let result = {};
                    let result_for_parameter = {};
                    let data = response["data"]["script"]["storage"]

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

                    // parameters part
                    let res = [];
                    let txDecodedData = [];
                    let txWithDecoded = [];

                    txs.forEach(function(tx) {
                        let item = JSON.parse(tx["type"]["operations"][0]["str_parameters"]);
                        txWithDecoded.push(
                            {
                                "hash": tx["hash"],
                                "block_hash": tx["block_hash"],
                                "decoded_data": decode_data(item, result_for_parameter),
                                "result": null
                            }
                        )
                        res.push(item)
                    });

                    this.txWithDecodedData = txWithDecoded

                    this.txData = res;
                    
                    res.forEach(function(item) {
                        txDecodedData.push(decode_data(item, result_for_parameter))
                    });

                    this.txDecoded = txDecodedData;

                    // show results on the page
                    this.parameterSchema = decode_schema(result_for_parameter["collapsed_tree"]);
                    this.isReady = true;

                    loader.hide()
                })
                .catch(error => (console.log(error)));
            }

            makeCalculations()
        },
        click(tx) {
            axios
            .get(`${this.baseNodeApiURL}/${tx.block_hash}/operations/3`)
            .then((response) => {
                let schema = {}

                schema["type_map"] = this.typeMap;
                schema["collapsed_tree"] = this.collapsedTree;

                let data = response["data"][0]["contents"][0]["metadata"]["operation_result"]["big_map_diff"];

                tx.result = bigMapDiffDecode(data, schema)
            })
            .catch(error => (console.log(error)));
        }
    }
})


function flatten(items) {
    if (items instanceof PairArray) {
        if (items.length == 0) {
            return new PairArray()
        }

        let first = items[0]
        let rest = items.slice(1, items.length)
        
        return flatten(first).concat(flatten(rest))
    } else if (Array.isArray(items)) {
        if (items.length == 0) {
            return []
        }

        let first = items[0]
        let rest = items.slice(1, items.length)
        
        return flatten(first).concat(flatten(rest))
    } else {
        return [items]
    }
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

class PairArray extends Array {}
class OrArray extends Array {}

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

    function parseNode(node, path="0", nested=undefined) {
        if (["storage", "parameter"].indexOf(node["prim"]) != -1) {
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

        if (["pair", "or"].indexOf(node["prim"]) != -1) {
            if (typename || (nested != node["prim"])) {
                args = flatten(args);

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
                return args
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
                let tupleArgs = new PairArray(...args);
                res = flatten(tupleArgs)

                if (type_info['props'] != undefined && annotations) {
                    retRes = {}
                    for (var i = 0; i < res.length; i++) {
                        retRes[type_info['props'][i]] = res[i]
                    }
                    res = retRes
                }   
                
            } else if (["Left", "Right"].indexOf(node["prim"]) != -1) {
                let index = (node["prim"] == "Left" ? '0' : '1');
                let value = decode_node(node['args'][0], path + index);

                if (type_info['props'] != undefined && annotations == true) {
                    res[type_info['props'][index]] = value;
                } else {
                    res[index] = value;
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
