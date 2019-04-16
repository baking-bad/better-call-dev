Vue.use(VuePrintObject);

var app = new Vue({
    el: '#app',
    data: () => ({
        // address: "KT1HWuhDdbtVQ2S9NAaeEJyCbAF6cMtLcqcc",
        address: "KT1ExvG3EjTrvDcAU7EqLNb77agPa5u6KvnY",
        typeMap: {},
        collapsedTree: {},
        ready: false
    }),
    methods: {
        explore() {
            // .get(`https://api.alphanet.tzscan.io/v1/node_account/${this.address}`)
            axios
            .get(`https://api6.tzscan.io/v1/node_account/${this.address}`)
            .then((response) => {
                let code = response["data"]["script"]["code"];
                let result = {}

                code.forEach(function(element) {
                    if (element["prim"] == "storage") {
                        result = buildSchema(element)
                    }  
                });

                this.typeMap = result["type_map"];
                this.collapsedTree = result["collapsed_tree"];
                this.ready = true

            }).catch(error => (console.log(error)));
        }
    }
})

function flatten(items) {
    if (Array.isArray(items)) {
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

// let json = {
// 'prim': 'storage',
// 'args': [{
//         'prim': 'pair',
//         'args': [{'prim': 'nat', 'annots': ['%counter']}, {'prim': 'nat', 'annots': ['%threshold']}],
//         'annots': [':storage']
//     }]
// }

// result = buildSchema(json)

// console.log(result["type_map"])
// console.log(result["collapsed_tree"])
