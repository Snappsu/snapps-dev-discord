// A paremeter for paremeter pure JS front for discord's API
// Plus some helper functions
// Cause I'm too lazy to get a framework to work with workers
// (yeah let's use lazy)

import { env } from "cloudflare:workers";
import * as Requests from "../utils/requests"

// ----------------
// Helper functions
// ----------------

export async function isValidRequest(body,headers) {
	console.log("checking validity of request...")
	var isVerified = false;
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
		console.log(error)
		isVerified = false
	}
	isVerified?console.log("request is valid!"):console.error("request is NOT valid!")
	return isVerified
}

export async function sendToEndpoint(method, endpoint, body) {
	console.log("making request to discord...")
	return await Requests.createHttpRequest(method,`${env.DISCORD_API_BASE_URL+endpoint}`,body,[["Authorization",env.DISCORD_BOT_TOKEN]])
}

// ----------------
// Message Utilities
//-----------------

export class MessageFlags {

	static CROSSPOSTED = 2 ** 0
	static IS_CROSSPOST = 2 ** 1
	static SUPPRESS_EMBEDS = 2 ** 2
	static SOURCE_MESSAGE_DELETED = 2 ** 3
	static URGENT = 2 ** 4
	static HAS_THREAD = 2 ** 5
	static EPHEMERAL = 2 ** 6
	static LOADING = 2 ** 7
	static FAILED_TO_MENTION_SOME_ROLES_IN_THREAD = 2 ** 8
	static SUPPRESS_NOTIFICATIONS = 2 ** 12
	static IS_VOICE_MESSAGE = 2 ** 13
	static HAS_SNAPSHOT = 2 ** 14
	static IS_COMPONENTS_V2 = 2 ** 15

	static toBitfield(flags) {
		var bitField = 0
		flags.forEach(flag => {
			bitField += flag
		});
		return bitField

	}

	static toFlags(toBitfield) {

	}
}

// -------------------
// Component Utilities
// -------------------
// Okay i see why libraries have this now

export class ComponentTypes {

	static ACTION_ROW = 1
	static BUTTON = 2
	static STRING_SELECT = 3
	static TEXT_INPUT = 4
	static USER_SELECT = 5
	static ROLE_SELECT = 6
	static MENTIONABLE_SELECT = 7
	static CHANNEL_SELECT = 8
	static SECTION = 9
	static TEXT_DISPLAY = 10
	static THUMBNAIL = 11
	static MEDIA_GALLERY = 12
	static FILE = 13
	static SEPARATOR = 14
	static CONTAINER = 17
	static LABEL = 18

	static name(type) {
		switch (type) {
			case 1:
				return "Action Row"
			case 2:
				return "Button"
			case 3:
				return "String Select"
			case 4:
				return "Text Input"
			case 5:
				return "User Select"
			case 6:
				return "Role Select"
			case 7:
				return "Mentionable Select"
			case 8:
				return "Channel Select"
			case 9:
				return "Section"
			case 10:
				return "Text Display"
			case 11:
				return "Thumbnail"
			case 12:
				return "Media Gallery"
			case 13:
				return "File"
			case 14:
				return "Separator"
			case 17:
				return "Container"
			case 18:
				return "Label"
			default:
				break;
		}
	}
}

export class ButtonStyles {
	static PRIMARY = 1;
	static SECONDARY = 2
	static SUCCESS = 3
	static DANGER = 4
	static LINK = 5
	static PREMIUM = 6
}


// Holy heck this is pushing the limits of my brain
// Def not an injection attack waiting to happen :savakShy:
export class ComponentBuilder {
	constructor(type, id = null) {

		this.type = type;
		// set paremeters
		switch (type) {

			// Action Row
			case ComponentTypes.ACTION_ROW:

				// Params
				if (id) this.id = id;

				this.components = []
				this.addComponent = function (component) {
					this.components.push(component)
				};

				// Build 
				this.build = function () {

					var component = {
						type: type,
						components: []
					}
					this.components.forEach(comp => {
						component.components.push(comp.build())
					});

					if (id) component.id = id
					return component
				}
				break;

			// Button
			case ComponentTypes.BUTTON:

				// Params
				if (id) this.id = id;
				this.style = ButtonStyles.PRIMARY

				// Set params
				this.setParams = function ({
					style,
					label,
					emoji,
					custom_id,
					sku_id,
					url,
					disabled
				}) {
					if (style) this.style = style
					if (label) this.label = label
					if (emoji) this.emoji = emoji
					if (custom_id) this.custom_id = custom_id
					if (sku_id) this.sku_id = sku_id
					if (url) this.url = url
					if (disabled) this.disabled = disabled

				};

				// Build 
				this.build = function () {

					var component = {
						type: type,
					}
					if (id) component.id = id
					if (this.style) component.style = this.style
					if (this.label) component.label = this.label
					if (this.emoji) component.emoji = this.emoji
					if (this.custom_id) component.custom_id = this.custom_id
					if (this.sku_id) component.sku_id = this.sku_id
					if (this.url) component.url = this.url
					if (this.disabled) component.disabled = this.disabled

					return component
				}
				break;
			
			// String Select
			case ComponentTypes.STRING_SELECT:

				// Params
				if (id) this.id = id;
				this.style = ButtonStyles.PRIMARY
				this.options = []

				// Set params
				this.setParams = function ({
					custom_id,
					disabled,
					required,
					min_values,
					max_values,
					placeholder,
				}) {
					if (custom_id) this.custom_id = custom_id
					if (disabled) this.disabled = disabled
					if (required) this.required = required
					if (min_values) this.min_values = min_values
					if (max_values) this.max_values = max_values
					if (placeholder) this.placeholder = placeholder
				};

				this.addOption = function ({label,value,description,emoji,de_fault}) {
					var option = {}
					if(label) option.label = label
					if(value) option.value = value
					if(description) option.description = description
					if(emoji) option.emoji = emoji
					if(de_fault) option.default = de_fault
					this.options.push(option)
				}

				// Build 
				this.build = function () {

					var component = {
						type: type,
					}
					if (id) component.id = id
					if (this.custom_id) component.custom_id = this.custom_id
					if (this.disabled) component.disabled = this.disabled
					if (this.required) component.required = this.required 
					if (this.min_values) component.min_values = this.min_values
					if (this.max_values) component.max_values = this.max_values
					if (this.placeholder) component.placeholder = this.placeholder

					component.options = this.options

					return component
				}
				
				break;


			// Section
			case ComponentTypes.SECTION:

				// Params
				if (id) this.id = id;

				this.components = []
				
				// Add Component
				this.addComponent = function (component) {
					this.components.push(component)
				};

				// Set Accessory
				this.setAccessory = function (accessory) {
					this.accessory = accessory
				};

				// Build 
				this.build = function () {

					var component = {
						type: type,
						components: []
					}
					this.components.forEach(comp => {
						component.components.push(comp.build())
					});

					if (id) component.id = id
					if (this.accessory) component.accessory = this.accessory.build()
					return component
				}
				break;

			// Text Display
			case ComponentTypes.TEXT_DISPLAY:

				// Params
				if (id) this.id = id;

				// Set text
				this.setContent =  function (text) {
					this.content=text
				}

				// Build 
				this.build = function () {

					var component = {
						type: type,
						content: this.content
					}

					if (id) component.id = id
					return component
				}
				break;

			// Thumbnail
			case ComponentTypes.THUMBNAIL:

				// Params
				if (id) this.id = id;

				// Set params
				this.setParams = function ({
					media,
					description,
					spoiler
				}) {
					if (media) this.media = media
					if (description) this.description = description
					if (spoiler) this.spoiler = spoiler
				};

				// Build 
				this.build = function () {

					var component = {
						type: type,
						media: {
							url: this.media
						}
					}

					if (id) component.id = id
					if (this.description) component.description = description
					if (this.spoiler) component.spoiler = spoiler
					return component
				}
				break;

			// Container
			case ComponentTypes.CONTAINER:

				// Params
				if (id) this.id = id;

				this.components = []
				this.addComponent = function (component) {
					this.components.push(component)
				};

				// Set params
				this.setParams = function ({
					accent_color,
					spoiler
				}) {
					if (accent_color) this.accent_color = accent_color
					if (spoiler) this.spoiler = spoiler
				};

				// Build 
				this.build = function () {

					var component = {
						type: type,
						components: []
					}
					this.components.forEach(comp => {
						component.components.push(comp.build())
					});

					if (id) component.id = id
					if (this.accent_color) component.accent_color = this.accent_color
					if (this.spoiler) component.spoiler = this.spoiler
					return component
				}
				break;

			
			default:
				break;
		}

		this.toString = function () {
			return JSON.stringify(this.build())
		}
	}


}

// --------------------
// Application Commands
// --------------------

export class ApplicationCommandTypes {
	static CHAT_INPUT = 1
	static USER = 2
	static MESSAGE = 3
	static PRIMARY_ENTRY_POINT = 4

	static name(type) {

		switch (type) {
			case 1:
				return "Chat Input"
			case 2:
				return "User"
			case 3:
				return "Message"
			case 4:
				return "Primary Entry Point"
			default:
				return "Unknown"
		}
	}
}

// Get Global Application Commands
export async function getGlobalApplicationCommands(applicationID, botToken = null) {
	const url = `https://discord.com/api/applications/${applicationID}/commands`;
	const options = {
		method: 'GET',
		headers: {
			Authorization: `Bot ${botToken?botToken:process.env.DISCORD_BOT_TOKEN}`,
			'content-type': 'application/json'
		},
	};

	try {
		const response = await fetch(url, options);
		const data = await response.json();
		return {
			status: response.status,
			data: data
		}
	} catch (error) {
		console.error(error);
	}
}


// Create Global Application Commands
// applicationID - int - S.E.
// commandDesc - JSON object - the JSON parameters of the command
export async function createGlobalApplicationCommand(applicationID, commandDesc) {
	console.log(`Registering ${ApplicationCommandTypes.name(commandDesc.type)} command '${commandDesc.name}'...`)

	// Send request to create
	try {

		const url = `https://discord.com/api/applications/${applicationID}/commands`;
		const options = {
			method: 'POST',
			headers: {
				Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
				'content-type': 'application/json'
			},
			body: JSON.stringify(commandDesc)
		};

		// Process response
		const response = await fetch(url, options);
		const data = await response.json();
		if (response.status == 200) console.log(`${ApplicationCommandTypes.name(data.type)} Command "${data.name}" has been successfully overwritten! (ID: ${data.id})`)
		else if (response.status == 201) console.log(`${ApplicationCommandTypes.name(data.type)} Command "${data.name}" has been successfully created! (ID: ${data.id})`)
		else console.log(data)

	} catch (error) {
		console.error(error);
	}
}

// Delete Global Application Commands
// Note: you better know what you are deleting cause I'm not adding any identifying functions past id
export async function deleteGlobalApplicationCommand(applicationID, commandID) {
	console.log(`Deleting command ${commandID}...`)
	const url = `https://discord.com/api/applications/${applicationID}/commands/${commandID}`;
	const options = {
		method: 'DELETE',
		headers: {
			Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
			'content-type': 'application/json'
		},
		body: ''
	};

	try {
		const response = await fetch(url, options);
		if (response.status == 204) console.log("Deletion successful!")
		else {
			console.log("ERROR: Deletion unsuccessful!")
		}
		return (response.status);
	} catch (error) {
		return (error);
	}
}

// ------------
// Interactions
// ------------

export class InteractionTypes {
	static PING = 1
	static APPLICATION_COMMAND = 2
	static MESSAGE_COMPONENT = 3
	static APPLICATION_COMMAND_AUTOCOMPLETE = 4
	static MODAL_SUBMIT = 5;
	static name(type) {

		switch (type) {
			case 1:
				return "Ping Command"
			case 2:
				return "Application Command"
			case 3:
				return "Message Component"
			case 4:
				return "Application Command Autocomplete"
			case 5:
				return "Modal Submit"
			default:
				return "Unknown"
		}
	}
}

export class InteractionContextTypes {
	static GUILD = 0
	static BOT_DM = 1
	static PRIVATE_CHANNEL = 2
	static name(type) {

		switch (type) {
			case 0:
				return "Guild"
			case 1:
				return "Bot DM"
			case 2:
				return "Private Channel"
			default:
				return "Unknown"
		}
	}
}

export class InteractionCallbackTypes {
	static PONG = 1
	static CHANNEL_MESSAGE_WITH_SOURCE = 4
	static DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE = 5
	static DEFERRED_UPDATE_MESSAGE = 6
	static UPDATE_MESSAGE = 7
	static APPLICATION_COMMAND_AUTOCOMPLETE_RESULT = 8
	static MODAL = 9
	static PREMIUM_REQUIRED = 10
	static LAUNCH_ACTIVITY = 12
}

export async function InteractionCallback(interactionId, interactionToken, callbackBody) {
	console.log(`Calling back to Interaction ${interactionId}...`);
	try {
		const url = `https://discord.com/api/v10/interactions/${interactionId}/${interactionToken}/callback`;
		const options = {
			method: "POST",
			headers: {
				"content-type": "application/json"
			},
			body: JSON.stringify(callbackBody)
		};
		const response = await fetch(url, options);
		if (response.body) {
			//const data = await response.text();
			console.log(`Callback successful!`);
			return;
		}
	} catch (error) {
		console.error(`Callback unsuccessful!`);
		console.error(error);
	}
}

// Followup Message
export async function FollowupMessage(method, applicationID, interactionToken, message,messageID=null) {
	console.log(`Following up with previous Interaction...`)

	var url;

	if (method.toLowerCase() == "edit" || method.toLowerCase() == "patch") {
		method = "patch";
		url = `https://discord.com/api/webhooks/${applicationID}/${interactionToken}/messages/${messageID?messageID:"@original?with_components=true"}`;
	} else if (method.toLowerCase() == "delete") {
		method = "delete"
		url = `https://discord.com/api/webhooks/${applicationID}/${interactionToken}/messages/${messageID?messageID:"@original?with_components=true"}`;

	} else if (method.toLowerCase() == "send" || method.toLowerCase() == "post") {
		method = "post"
		url = `https://discord.com/api/webhooks/${applicationID}/${interactionToken}?with_components=true`;
	}

	// Send request to create
	try {

		const options = {
			method: method.toUpperCase(),
			headers: {
				'content-type': 'application/json'
			},
			body: JSON.stringify(message)
		};

		// Process response
		const response = await fetch(url, options);
		console.warn(response)
		if (response.body) {
			
			const data = await response.json();
			console.log(`Follow-up successful!`)

			return data
		} else {
			response.text()
		}


	} catch (error) {
		console.log(`Follow-up unsuccessful!`)
		console.error(error);
	}

}
