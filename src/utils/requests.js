export function createResponse(body, status = 200) {
	console.log(`creating ${status} response...`)
	const headers = new Headers()
	var USER_AGENT = "SnappsDevBot (github.com/Snappsu/snapps-dev-discord/, 1.0)"
	headers.append('content-type', 'application/json')
	headers.append('user-agent', USER_AGENT)
	const response = new Response(body ? JSON.stringify(body) : null, {
		status: status,
		headers: headers
	})
	return response
}

export async function createHttpRequest(method, url, body = null, headers, ) {
	console.log(`sending ${method.toUpperCase()} request to ${url}...`)

	try {

		// append global headers
		const requests_headers = new Headers()
		var USER_AGENT = "SnappsDevBot (github.com/Snappsu/snapps-dev-discord/, 1.0)"
		requests_headers.append('content-type', 'application/json')
		requests_headers.append('user-agent', USER_AGENT)

		// append custom headers
		headers.forEach(header => {
			requests_headers.append(header[0], header[1])
		});


		// some parameter checking
		if (!method) {
			console.warn("method not specified; assuming GET");
			method = "GET"
		}
		if (!method) {
			console.error("url not specified!");
			throw new Error("No URL supplied to request!");
		}

		// send request
		const res = await fetch(
			url, {
				method: method.toUpperCase(),
				headers: requests_headers,
				body: JSON.stringify(body),
			}
		);

		// read response (if existss)
		var data 
        if (res.body) data = await res.json();

		// log it
		console.log('response recieved!');
		console.log('logging response info...');
		console.log('===== response data =====');
		console.log(res);
		console.log('===== response body =====');
		console.log(JSON.stringify(data, null, 2));
		console.log('===== end of response info =====');

		// return it
		return {
			response: res,
			body: data
		}

	} catch (err) {
		console.error(err);
		throw err;
	}
}
