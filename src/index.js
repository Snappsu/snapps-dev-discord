/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */
import { env } from "cloudflare:workers";

export default {
	async fetch(request, env, ctx) {

	// extract body
	var interactionObject
	if (request.headers.get('content-type') == 'application/json') interactionObject = await request.json()
	else interactionObject = await request.text()
	
	// log request
	console.log("incoming request!")
	console.log("===== request data =====")
	console.log(request)
	console.log("===== request body =====")
	console.log(interactionObject)
	console.log("===== end of request info =====")

	// validate request
	if (!await isValidRequest(interactionObject,request.headers)) {
		console.log("telling sender that request is invalid...")
		return new createResponse(null, 401);
	}

	//handle interaction
	switch (interactionObject.type) {
		case 1:
			console.log("interaction identified as ping!")
			return createResponse({type:1})
			
			break;
		case 2:
			console.log("interaction identified as command interaction!")
			break;
		case 3:
			console.log("interaction identified as message component interaction!")
			break;
		case 4:
			console.log("interaction identified as command autocomplete interaction!")
			break;
		case 5:
			console.log("interaction identified as modal submittion!")
			break;
	}
		console.log("acknowledging interaction request...")
		return createResponse(null, 401);
	},
};

async function isValidRequest(body,headers) {
	console.log("checking validity of request...")
	var isVerified = false;
	var body = JSON.stringify(body)
	const timestamp = headers.get('x-signature-timestamp')
	const signature = headers.get('x-signature-ed25519')
	try {
		const key = await crypto.subtle.importKey("raw", Uint8Array.fromHex(env.DISCORD_BOT_PUB_KEY), { "name": "Ed25519" }, false, ["verify"])
		  let message = timestamp + body;
		let enc = new TextEncoder();
		var newBody  = enc.encode(message)
		isVerified = await crypto.subtle.verify( 
			{ "name": "Ed25519" } , 
			key, 
			Uint8Array.fromHex(signature),
			newBody
		)
	}
	catch (error){
		isVerified = false
	}
	isVerified?console.log("request is valid!"):console.error("request is NOT valid!")
	return isVerified
}

function createResponse(body,status=200){
	console.log(`creating ${status} response...`)
	const headers = new Headers()
	var USER_AGENT = "SnappsDevBot (github.com/Snappsu/snapps-dev-discord/, 1.0)"
	headers.append('content-type','application/json')
	headers.append('user-agent',USER_AGENT)
	const response = new Response(body?JSON.stringify(body):null,{status:status,headers:headers})
	return response
}