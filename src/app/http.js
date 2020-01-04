import lscache from "lscache";

export class TimeoutError extends Error {}
export class RequestError extends Error {
    constructor(response) {
        super(response.statusText);
        this.code = response.status;
    }
}

export async function get(uri, timeout = 10000) {
  if (isCacheable(uri)) {
    if (lscache.get(uri)) {
      return JSON.parse(lscache.get(uri))
    }
  }

  let response = await withTimeout(timeout,
    fetch(uri, {
      method: 'GET',
      referrerPolicy: "no-referrer",
      headers: {
        'Accept': 'application/json'
      }
    })
  );
  
  let jsonResponse = null;
  if (response.ok) {
    jsonResponse = await response.json();
  } else if (response.status !== 404) {
    throw new RequestError(response);
  }

  if (isCacheable(uri)) {
    lscache.set(uri, JSON.stringify(jsonResponse), 42000);
  }
  return jsonResponse;
}

export async function post(uri, object, timeout = 10000) {
  if (isCacheable(uri)) {
    if (lscache.get(uri)) {
      return JSON.parse(lscache.get(uri))
    }
  }

  let response = await withTimeout(timeout,
      fetch(uri, {
        method: 'POST',
        referrerPolicy: "no-referrer",
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(object)
      })
  );
  
  let jsonResponse = null;
  if (response.ok) {
    jsonResponse = await response.json();
  } else if (response.status !== 404) {
    throw new RequestError(response);
  }

  if (isCacheable(uri)) {
    lscache.set(uri, JSON.stringify(jsonResponse), 42000);
  }
  return jsonResponse;
}


function isCacheable(uri) {
  return uri.includes("chains/main/blocks") && !uri.includes("head") && !uri.includes("127.0.0.1")
}

async function withTimeout(ms, promise) {
  return new Promise((resolve, reject) => {

    const id = setTimeout(() => {
      reject(new TimeoutError());
    }, ms);

    promise.then(
      (res) => {
        clearTimeout(id);
        resolve(res);
      },
      (err) => {
        clearTimeout(id);
        reject(err);
      }
    );
  });
}
