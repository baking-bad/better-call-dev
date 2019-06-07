export function bigMapDiffDecode(data, schema) {
  const paths = getBigMapSchema(schema.type_map);
  const res = {};

  data.forEach(item => {
    const key = decodeData(item.key, schema, true, true, paths.key_path);
    const val = decodeData(item.value, schema, true, true, paths.val_path);

    res[key] = val;
  });

  return res;
}

export function decodeData(data, schema, annotations = true, literals = true, rootNode = "0") {
  function decode_node(node, path = "0") {
    let res = {};
    let type_info = {};

    if (schema.type_map[path] != undefined) {
      type_info = schema.type_map[path];
    }

    if (isObject(node) && !Array.isArray(node)) {
      const args = [];
      const nodeArgs = node.args;

      if (nodeArgs != undefined) {
        Object.keys(nodeArgs).forEach(i => {
          args.push(decode_node(nodeArgs[i], path + i));
        });
      }

      if (node.prim === "Pair") {
        res = new Nested();
        res.prim = type_info.prim;
        res.args = args;

        if (type_info.children != undefined) {
          res = get_flat_nested(res);

          if (type_info.props != undefined && annotations) {
            const retRes = {};
            for (let i = 0; i < res.length; i++) {
              if (res[i] != undefined) {
                retRes[type_info.props[i]] = res[i];
              }
            }
            res = retRes;
          }
        }
      } else if (["Left", "Right"].includes(node.prim)) {
        const arg_path = path + (node.prim === "Left" ? "0" : "1");
        res = new Route();
        res.path = arg_path;
        res.value = decode_node(node.args[0], arg_path);

        if (type_info.children != undefined) {
          const terminal = get_route_terminal(res);

          if (type_info.props != undefined && annotations === true) {
            const index = type_info.children.indexOf(terminal.path);
            res = {};
            res[type_info.props[index]] = terminal.value;
          } else {
            res = terminal.value;
          }
        }
      } else if (node.prim === "Elt") {
        res = args;
      } else if (node.prim === "Some") {
        res = args[0];
      } else if (node.prim === "None") {
        res = null;
      } else if (literals) {
        res = decode_literal(node, type_info.prim);
      } else {
        const key = Object.keys(node)[0];
        res = node[key];
      }
    } else if (Array.isArray(node)) {
      if (["map", "big_map"].indexOf(type_info.prim) != -1) {
        node.forEach(item => {
          const elt = decode_node(item, path);
          res[elt[0]] = elt[1];
        });
      } else {
        const args = [];

        node.forEach(item => {
          args.push(decode_node(item, `${path}0`));
        });

        if (type_info.prim === "set") {
          res = args.filter(onlyUnique);
        } else if (type_info.prim === "list") {
          res = args;
        } else {
          // eslint-disable-next-line
          // console.log("Houston we have a problem: ", node, type_info);
        }
      }
    } else {
      // eslint-disable-next-line
      // console.log("Houston we have a problem: ", node, type_info);
    }

    return res;
  }

  return decode_node(data, rootNode);
}

export function buildSchema(code) {
  const type_map = {};

  function parseNode(node, path = "0", parent_prim = undefined) {
    if (["storage", "parameter"].includes(node.prim)) {
      return parseNode(node.args[0]);
    }

    type_map[path] = { prim: node.prim };
    const typename = getAnnotation(node, ":");
    let name = getAnnotation(node, "%", typename);

    let args = [];
    const nodeArgs = node.args;

    if (nodeArgs != undefined) {
      Object.keys(nodeArgs).forEach(i => {
        args.push(parseNode(nodeArgs[i], path + i, node.prim));
      });
    }

    if (["pair", "or"].includes(node.prim)) {
      const res = new Nested();
      res.prim = node.prim;
      res.args = args;

      if (typename || parent_prim != node.prim) {
        args = get_flat_nested(res);
        type_map[path].children = args.map(x => x.path);

        const props = args.map(x => x.name);

        if (allTrue(props)) {
          type_map[path].props = props;
        }

        if (typename) {
          type_map[path].name = typename;
        }
      } else {
        return res;
      }
    } else if (node.prim === "option" && name === undefined) {
      name = args[0].name;
    }

    return {
      prim: node.prim,
      path,
      args,
      name
    };
  }

  const collapsed_tree = parseNode(code);
  return {
    type_map,
    collapsed_tree
  };
}

export function decodeSchema(collapsed_tree) {
  function decode_node(node) {
    if (node.prim === "or") {
      var res = {};

      node.args.forEach((arg, i) => {
        if (arg.name != undefined) {
          res[arg.name] = decode_node(arg);
        } else {
          res[i] = decode_node(arg);
        }
      });

      return res;
    }

    if (node.prim === "pair") {
      let flag = false;
      const values = [];
      let res = {};

      node.args.forEach(arg => {
        if (arg.name === undefined) {
          flag = true;
        }

        const va = decode_node(arg);

        values.push(va);
        res[arg.name] = va;
      });

      return flag ? values : res;
    }

    if (node.prim === "set") {
      return [decode_node(node.args[0])];
    }

    if (node.prim === "list") {
      return [decode_node(node.args[0])];
    }

    if (["map", "big_map"].indexOf(node.prim) != -1) {
      let res = {};
      res[decode_node(node.args[0])] = decode_node(node.args[1]);
      return res;
    }

    if (node.prim === "option") {
      return decode_node(node.args[0]);
    }

    return `#${node.prim}`;
  }

  return decode_node(collapsed_tree);
}

function get_flat_nested(nested) {
  let flat_args = [];

  nested.args.forEach(arg => {
    if (arg instanceof Nested && arg.prim === nested.prim) {
      flat_args = flat_args.concat(get_flat_nested(arg));
    } else {
      flat_args.push(arg);
    }
  });

  return flat_args;
}

function get_route_terminal(route) {
  if (route.value instanceof Route) {
    return get_route_terminal(route.value);
  }
  return route;
}

function allTrue(obj) {
  for (const o in obj) {
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

function getAnnotation(x, prefix, def = undefined) {
  const ret = [];

  if (x.annots) {
    x.annots.forEach(a => {
      if (a[0] === prefix) {
        ret.push(a.slice(1, a.length));
      }
    });
  }

  return ret.length > 0 ? ret[0] : def;
}

function decode_literal(node, prim) {
  const key = Object.keys(node)[0];

  const core_type = key;
  const value = node[key];

  if (["int", "nat"].indexOf(prim) != -1) {
    return parseInt(value);
  }

  if (prim === "timestamp") {
    let date;

    if (core_type === "string") {
      date = new Date(value);
    } else {
      let ts = parseInt(value) * 1000;
      date = new Date(ts);
    }

    return date.toLocaleString("en-GB", { timeZone: "GMT" });
  }
  if (prim === "mutez") {
    return (parseInt(value) / Math.pow(10, 6)).toFixed(6) + ' ꜩ';
  }
  if (prim === "bool") {
    return value === true;
  }
  if (prim === "address" && core_type === "bytes") {
    // eslint-disable-next-line
    // console.log("Houston we have a problem: ", prim, core_type, value);
    return value;
  }

  return value;
}

function getBigMapSchema(typeMap) {
  const res = {};
  Object.keys(typeMap).forEach(key => {
    if (typeMap[key].prim === "big_map") {
      res.key_path = `${key.toString()}0`;
      res.val_path = `${key.toString()}1`;
    }
  });

  return res;
}
