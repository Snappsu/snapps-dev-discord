/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */
import * as Discord from "./apis/discord"
import * as Requests from "./utils/requests"
import * as Setup from "./tools/setup"
import * as Commands from "./commands"
import * as Modals from "./utils/modals"
import {
	env
} from "cloudflare:workers";

export default {
	async fetch(request, env, ctx) {


		if (request.method == "PATCH") {
			// uh oh, time for some funky stuff

			const command = await request.json()
			console.log(command)

			if (command.command == "update_command" && command.secret_code == env.COMMAND_UPDATE_CODE) {
				await Commands.setup.publishAllCommands()
			}
			return Requests.createResponse({
				msg: "congrats, you may or may not have did something or nothing <3"
			}, 200)
		}


		// extract body
		var interactionObject
		interactionObject = await request.text()

		// log request
		console.log("incoming request!")
		console.log("===== request data =====")
		console.log(JSON.stringify(request, null, 2))
		if (request.body) {
			console.log("===== request body =====")
			try {
				console.log(JSON.stringify(JSON.parse(interactionObject), null, 2)) // cursed, ik, shutup

			} catch (e) {
				console.log(interactionObject)
			}
		}
		console.log("===== end of request info =====")

		// validate request
		var isRequestValid = await Discord.isValidRequest(interactionObject, request.headers)
		if (!isRequestValid) {
			console.log("telling sender that request is invalid...")
			return new Requests.createResponse({
				msg: "invalid request"
			}, 401);
		}

		// jsonify the body
		interactionObject = JSON.parse(interactionObject)

		console.log("handling request...")

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

				// get requested command
				var commandName = interactionObject.data.name
				if ("options" in interactionObject.data) commandName = `${interactionObject.data.name}_${interactionObject.data.options[0].name}`
				var commandRawName = Setup.getCommandClassByName(commandName)
				if (commandRawName) { commandName = commandRawName }
				
				console.log(`command name: ${commandName}!`)
				console.log(`checking if command spec exists...`)

				// get callback type because it may need to be instant
				// TODO: OTHER CALLBACK TYPES
				switch (Commands[commandName].spec.callback) {
					case Discord.InteractionCallbackTypes.MODAL:
						console.log("sending modal response...")
						return Commands[commandName].exec(interactionObject)
						break;

					default:
						// run command (in background)
						console.log(`calling command...`)
						// bootleg debugging
						//console.log(Commands[commandName].exec(interactionObject))
						ctx.waitUntil(
							new Promise(async function (resolve) {
								await Commands[commandName].exec(interactionObject)
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
				}
				break;
			case 3:
				console.log("interaction identified as message component interaction!")

				// get requested command
				var commandName = interactionObject.message.interaction.name.replace(" ","_")

				console.log(`command name: ${commandName}!`)
				console.log(`checking if command spec exists...`)
				var commandRawName = Setup.getCommandClassByName(commandName)
				
				if (commandRawName) commandName=commandRawName

				// run command (in background)
				console.log(`calling command...`)
				ctx.waitUntil(
					new Promise(async function (resolve) {
						await Commands[commandName].update(interactionObject)
						return resolve(undefined);
					})
				)
				// assume deferred reply
				return Requests.createResponse({
					"type": Discord.InteractionCallbackTypes.DEFERRED_UPDATE_MESSAGE,
					"data": {
						"flags": Discord.MessageFlags.toBitfield([Discord.MessageFlags.EPHEMERAL]),
						"tts": false
					}
				}, 200);
				break;
			case 4:
				console.log("interaction identified as command autocomplete interaction!")
				break;
			case 5:
				console.log("interaction identified as modal submittion!")
				// process modal (in background)
				console.log(`processing modal command...`)
				ctx.waitUntil(
					new Promise(async function (resolve) {
						await Modals.processModal(interactionObject)
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
		}
		console.log("acknowledging interaction request...")
		return Requests.createResponse(null, 202);
	},
};

async function isValidRequest(body, headers) {
	console.log("checking validity of request...")
	var isVerified = false;
	var body = JSON.stringify(body)
	const timestamp = headers.get('x-signature-timestamp')
	const signature = headers.get('x-signature-ed25519')
	try {
		const key = await crypto.subtle.importKey("raw", Uint8Array.fromHex(env.DISCORD_BOT_PUB_KEY), {
			"name": "Ed25519"
		}, false, ["verify"])
		let message = timestamp + body;
		let enc = new TextEncoder();
		var newBody = enc.encode(message)
		isVerified = await crypto.subtle.verify({
				"name": "Ed25519"
			},
			key,
			Uint8Array.fromHex(signature),
			newBody
		)
	} catch (error) {
		console.error(error)
		isVerified = false
	}
	isVerified ? console.log("request is valid!") : console.error("request is NOT valid!")
	return isVerified
}
