export class TimeoutError extends Error {}
export class RequestError extends Error {
    constructor(response) {
        super(response.statusText);
        this.code = response.status;
    }
}

export async function get(uri, timeout = 10000) {
  if (isCacheable(uri)) {
    if (localStorage[uri]) {
      return JSON.parse(localStorage[uri]);
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
  if (!response.ok) {
    throw new RequestError(response);
  }

  let jsonResponse = await response.json();

  if (isCacheable(uri)) {
    localStorage[uri] = JSON.stringify(jsonResponse);
  }
  return jsonResponse;
}

export async function post(uri, object, timeout = 10000) {
  if (isCacheable(uri)) {
    if (localStorage[uri]) {
      return JSON.parse(localStorage[uri]);
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
  if (!response.ok) {
    throw new RequestError(response);
  }

  let jsonResponse = await response.json();

  if (isCacheable(uri)) {
    localStorage[uri] = JSON.stringify(jsonResponse);
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
