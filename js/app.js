Vue.use(VuePrintObject);

var app = new Vue({
    el: '#app',
    data: () => ({
        // address: "KT1HWuhDdbtVQ2S9NAaeEJyCbAF6cMtLcqcc",
        address: "KT1ExvG3EjTrvDcAU7EqLNb77agPa5u6KvnY",
        typeMap: {},
        collapsedTree: {},
        ready: false,
        decoded: {}
    }),
    methods: {
        explore() {
            // .get(`https://api6.tzscan.io/v1/node_account/${this.address}`)
            // .get(`https://api.alphanet.tzscan.io/v1/node_account/${this.address}`)
            axios
            .get(`https://api.alphanet.tzscan.io/v1/node_account/${this.address}`)
            .then((response) => {
                let code = response["data"]["script"]["code"];
                let result = {};
                let data = response["data"]["script"]["storage"]

                code.forEach(function(element) {
                    if (element["prim"] == "storage") {
                        result = buildSchema(element)
                    }  
                });

                this.typeMap = result["type_map"];
                this.collapsedTree = result["collapsed_tree"];
                this.decoded = decode_data(data, result);
                this.ready = true

            }).catch(error => (console.log(error)));
        }
    }
})

function flatten(items) {
    if (items instanceof TupleArray) {
        if (items.length == 0) {
            return new TupleArray()
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

class TupleArray extends Array {}

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
                let tupleArgs = new TupleArray(...args);
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
