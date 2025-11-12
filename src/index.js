/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */
import * as Discord from "./utils/discord-api"
import * as Requests from "./utils/requests"
import {
	env
} from "cloudflare:workers";
import {
	Routes
} from 'discord-api-types/v10';

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
		if (!await Discord.isValidRequest(interactionObject, request.headers)) {
			console.log("telling sender that request is invalid...")
			return new createResponse(null, 401);
		}

		//handle interaction
		switch (interactionObject.type) {
			case 1:
				console.log("interaction identified as ping!")
				console.log("responding with pong!")
				return Requests.createResponse({
					type: 1
				}) // simple 'pong' response
				break;
			case 2:
				console.log("interaction identified as command interaction!")

				
				// test follow up stuff
				ctx.waitUntil(
					new Promise(async function (resolve) {


						
						await Discord.sendToEndpoint("PATCH", `/webhooks/${env.DISCORD_BOT_ID}/${interactionObject.token}/messages/@original`, {
	
								"flags": Discord.MessageFlags.toBitfield([Discord.MessageFlags.EPHEMERAL]),
								"content": "woah",
								"tts": false
							
						})
							
						return resolve(undefined);
					})

				)

				// assume deferred reply
				return Requests.createResponse({
							"type": Discord.InteractionCallbackTypes.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE,
							"data": {
								"flags": Discord.MessageFlags.toBitfield([Discord.MessageFlags.EPHEMERAL]),
								"tts": false
							}
						}, 200);


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
		return Requests.createResponse(null, 202);
	},
};
