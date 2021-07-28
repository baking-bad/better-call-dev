import dayjs from "dayjs";

export const delimiter = '➛';

function getId() {
    return Math.floor(Math.random() * (+100000000 - +1)) + +1;
}

function parseDiffType(diffType) {
    if (diffType === 'create') {
        return 'added-tree-item'
    } else if (diffType === 'update') {
        return 'edited-tree-item'
    } else if (diffType === 'delete') {
        return 'removed-tree-item'
    }
    return '';
}

function formatValue(val, typ) {
    if (typ === "mutez") {
        let xtz = (val / 1000000).toLocaleString(undefined, { maximumFractionDigits: 6 });
        return `${xtz} \uA729`;
    } else if (typ === "timestamp") {
        if (typeof val === 'string') {
            let d = dayjs(val);
            if (d.isValid())
                return d.format("DD MMMM YYYY HH:mm");
        } else {
            let d = dayjs(val * 1000);
            if (d.isValid())
                return d.format("DD MMMM YYYY HH:mm");
        }
    }
    if (val === undefined) return 'null';
    return val;
}

function getValue(x) {
    if (x.diff_type === 'update') {
        return `${formatValue(x.from, x.type)} ${delimiter} ${formatValue(x.value, x.type)}`
    }
    return formatValue(x.value, x.type)
}

function deducePrim(x) {
    if (x.prim === 'bytes') {
        if (x.value === 'None') {
            return 'option';
        }
        if (x.value === 'True' || x.value === 'False') {
            return 'bool';
        }
        if (x.value === '{}') {
            return 'map';
        }
        if (x.value === '[]') {
            return 'list';
        }
        if (/({|}|DIP|DUP|CAR|FAILWITH|Pair|Left|Right|Unit|Elt)/.test(x.value)) {
            return 'lambda';
        }
        if (/^"(tz|KT)[1-9A-HJ-NP-Za-km-z]{34}"$/.test(x.value)) {
            return 'address';
        }
        if (/^\d+$/.test(x.value)) {
            return 'nat';
        }
        if (/"\w+"/.test(x.value)) {
            return 'string';
        }
    }
    return x.prim;
}

function unwrap(x) {
    return String(x).replace(/^"(.*)"$/, '$1');
}

function removeQuotationFromString(name) {
    return name.replace(/['"]+/g, '');
}

function isLeftName(name) {
    return name.indexOf("Left") === 0;
}

function isRightName(name) {
    return name.indexOf("Right") === 0;
}

function getLeftRightValue(name) {
    if (isLeftName(name)) {
        const LEFT_LENGTH = 4;
        return removeQuotationFromString(name.slice(LEFT_LENGTH).trim());
    }

    if (isRightName(name)) {
        const RIGHT_LENGTH = 5;
        return removeQuotationFromString(name.slice(RIGHT_LENGTH).trim());
    }
}

function compactizePairs(x) {
    if (!('name' in x)) {
        return x.type;
    }
    if (isLeftName(x.name) || isRightName(x.name)) {
        return getLeftRightValue(x.name);
    }
    const pairs = x.name.split('Pair');
    let reduced = pairs.reduce((a, b) => {
        a = a + `${b.trim().split(' ')[0]}:`
        return a;
    }, '');
    return reduced.slice(1, -1).trim();
}

function parseItem(x, compactPair) {
    let item = {
        name: compactPair ? compactizePairs(x) : x.name,
        children: [],
        value: getValue(x),
        type: "value",
        id: getId(),
        kind: parseDiffType(x.diff_type),
        from: unwrap(x.from),
        val: unwrap(x.value),
        prim: x.prim,
        realPrim: deducePrim(x),
        diffType: x.diff_type
    }

    if (x.children) {
        item.type = 'object';
        item.children = getTree(x.children, false, compactPair);
        item.value = `${item.children.length} items`;
    }

    if (item.value === undefined) item.value = 'null';
    return [item];
}

function parseMap(x, compactPair) {
    const label = x.prim === 'big_map' ? 'diffs' : 'items'
    let item = {
        name: x.name,
        children: [],
        value: (x.value !== undefined && x.value !== null) ? x.value : `0 ${label}`,
        type: "object",
        value_type: x.type,
        prim: x.prim,
        realPrim: x.prim,
        val: x.prim === 'big_map' && x.value !== undefined && x.value !== null ? String(x.value) : undefined,
        id: getId(),
        kind: parseDiffType(x.diff_type),
        count: x.count,
    }

    if (x.children) {
        item.children = getTree(x.children, false, compactPair);
        item.value = `${item.children.length} ${label}`;
    }

    return [item];
}

function parseNamedTuple(x) {
    let res = [];
    x.children.forEach(item => {
        res.push(...parseItems(item))
    })
    return res;
}

function parseTuple(x, isRoot = false) {
    if (isRoot) {
        if (x.children) {
            let res = [];
            x.children.forEach((xChild, idx) => {
                let node = getTree(xChild)
                node[0].name = String(idx);
                res.push(...node);
            })
            return res;
        }
        return [{
            id: getId(),
            name: x.name,
            type: 'object',
            children: [],
            value: '0 items',
            kind: parseDiffType(x.diff_type)
        }]
    }

    let children = [];
    if (x.children) {
        x.children.forEach((xChild, idx) => {
            let node = getTree(xChild)
            node[0].name = String(idx);
            children.push(node[0]);
        })
    }

    return [{
        id: getId(),
        name: x.name,
        type: 'object',
        children: children,
        value: children.length ? `${children.length} items` : '0 items',
        kind: parseDiffType(x.diff_type),
    }];
}

function parseItems(x, compactPair, isRoot = false) {
    if (x.type === 'list' || x.type === 'set' || x.type === 'tuple' || x.type === 'union') {
        return parseTuple(x, isRoot);
    }
    if (x.type === 'map' || x.type === 'big_map') {
        return parseMap(x, compactPair);
    }
    if ((x.type === 'namedtuple' || x.type === 'namedunion') && isRoot) {  // TODO: why isRoot == true only?
        return parseNamedTuple(x);
    }
    return parseItem(x, compactPair)
}

export function getTree(data, isRoot = false, compactPair = false) {
    let res = [];
    if (data instanceof Array) {
        data.forEach(x => {
            res.push(...parseItems(x, compactPair, isRoot));
        })
    } else if (data instanceof Object) {
        res.push(...parseItems(data, compactPair, isRoot));
    }
    return res;
}
