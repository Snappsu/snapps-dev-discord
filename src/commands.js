import * as Discord from "./apis/discord.js";
import * as Space from "./apis/snapps-space.js"
import * as Requests from "./utils/requests.js"
import * as Commands from "./commands.js"
import {
	env
} from "cloudflare:workers";

/*
===== TODO LIST =====
- kinky permissions command
- help command
- requests commands
- profile command
- account settings commands
- asks commands
- subcommands
- command perms
- command prod statsus
- commissions
*/

/* command template 

export class [command name]{
	static spec = {
		name:, // as it appears to discord
		type:, // command type
		callback:, // wether to defer or not, really
		description:, // as it appears to discord
		contexts: [], // where can the command be used
		isInDev:, // T/F - whether or not to deploy the command to all servers or just dev server
		perms: // what roll has access to the command
	}

	 // this will be called upon initial command use (sans modals and autocompete (probably))
	static async exec(interactionData){}

	// when message component is interacted with, this is the fuction that runs
	static async update(interactionData){}
}

*/

/* defered reply template

try {
	// log command or something

	// do command stuff
	var message = {} // the message to send back
	message.flags = Discord.MessageFlags.toBitfield([Discord.MessageFlags.EPHEMERAL]) // make the message ephemeral
	
	// return message to discord
	await Discord.sendToEndpoint("PATCH", `/webhooks/${env.DISCORD_BOT_ID}/${interactionData.token}/messages/@original`, message)

} catch (e) {
	// log error
	console.error(e)

	// return error message to discord
	await Discord.sendToEndpoint("PATCH", `/webhooks/${env.DISCORD_BOT_ID}/${interactionData.token}/messages/@original`, {
		flags: Discord.MessageFlags.toBitfield([Discord.MessageFlags.EPHEMERAL]),
		content: "",
		tts: false,
		embeds: [{
			id: 1,
			description: "Something went wrong running the command...",
			"color": 0xff0000
		}],
	})
}

*/

// this is how the commands are to be laid out
// this is also a todo list now,
export class setup {
	static layout = {
		slash: [
			"help",
			"pet",
			"category_account",
			/* placeholder
			{
				category: "request",
				commands: [{
						command: request_help
					},
					{
						command: request_new
					},
					{
						command: request_edit
					},
					{
						command: request_list
					},
					{
						command: request_view
					},
					{
						command: request_delete
					},
				]
			},
			{
				category: "ask",
				commands: [{
						command: ask_help
					},
					{
						command: ask_new
					},
					{
						command: ask_edit
					},
					{
						command: ask_list
					},
					{
						command: ask_view
					},
					{
						command: ask_delete
					},
				]
			},
			*/
		],
		user: [
			"user_profile"
		]
	}

	// not the most robust (non-recusive, missing subcommand groups, repeated code), but should be good enough for my means
	// TODO: options/parameters
	static async publishAllCommands() {
		console.log("refreshing published commands...")

		console.log("wiping all commands...")
		await Discord.deleteAllGuildApplicationCommands(env.DISCORD_TEST_SERVER_ID)
		await Discord.deleteAllGlobalApplicationCommands()

		var command;



		for (let index = 0; index < setup.layout.user.length; index++) {
			const element = Commands[setup.layout.user[index]];
			console.log(element)

			// command object
			command = {
				type: element.spec.type,
				name: element.spec.name,
				description: element.spec.description,
				nsfw: false,
				contexts: element.spec.contexts,
			}
			console.log(command)

			if (element.spec.isInDev) { // if in dev
				// create guild command
				await Discord.createGuildApplicationCommand(command, env.DISCORD_TEST_SERVER_ID)

			} else { // otherwise...
				// create global command
				await Discord.createGlobalApplicationCommand(command)

			}
		}

		// slash commands
		for (let index = 0; index < setup.layout.slash.length; index++) {
			const element = Commands[setup.layout.slash[index]];
			console.log(element)

			// command object
			command = {
				type: element.spec.type,
				name: element.spec.name,
				description: element.spec.description,
				nsfw: false,
				contexts: element.spec.contexts,
			}

			if (element.spec.type == Discord.ApplicationCommandTypes.CATEGORY) {
				command.options = []
				command.type = 1
				//delete command.type
				for (let index = 0; index < element.commands.length; index++) {
					var subcommand = Commands[element.commands[index]]
					var subcom = {}
					subcom.type = 1
					subcom.name = subcommand.spec.name
					subcom.description = subcommand.spec.description
					subcom.nsfw = false
					subcom.contexts = subcommand.spec.contexts
					command.options.push(subcom)
				}
			}

			console.log(command)

			if (element.spec.isInDev) { // if in dev
				// create guild command
				await Discord.createGuildApplicationCommand(command, env.DISCORD_TEST_SERVER_ID)

			} else { // otherwise...
				// create global command
				await Discord.createGlobalApplicationCommand(command)

			}

		}

		// user commands
	}

}


// command specifications go here

// --- pet command ---

// ----- account category  -----

export class category_account {
	static spec = {
		name: "account",
		type: Discord.ApplicationCommandTypes.CATEGORY, // command type
		callback: Discord.InteractionCallbackTypes.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE, // wether to defer or not, really
		description: "View or change your account settings.", // as it appears to discord
		contexts: [Discord.InteractionContextTypes.GUILD, Discord.InteractionContextTypes.BOT_DM], // where can the command be used
		isInDev: true, // T/F - whether or not to deploy the command to all servers or just dev server
		perms: null, // what roll has access to the command (global if null)
	}
	static commands = [
		"account_register",
		"account_privacy",
		"account_wild",
		"account_delete",
	]
}

// --- account registration ---
export class account_register {

	static spec = {
		name: "register",
		type: Discord.ApplicationCommandTypes.CHAT_INPUT, // command type
		callback: Discord.InteractionCallbackTypes.MODAL, // wether to defer or not, really
		description: "Gets you signed up to Snapps Space!", // as it appears to discord
		contexts: [Discord.InteractionContextTypes.GUILD, Discord.InteractionContextTypes.BOT_DM], // where can the command be used
		isInDev: false, // T/F - whether or not to deploy the command to all servers or just dev server
		perms: null, // what roll has access to the command (global if null)
	}
	static exec(interactionContent) {
		console.log("sending registration modal...")

		return Requests.createResponse({
			"type": account_register.spec.callback,
			"data": {
				"custom_id": "register_modal",
				"title": "Snapps' Space Registration",
				"components": [{
						"type": Discord.ComponentTypes.TEXT_DISPLAY, // ComponentType.TEXT_DISPLAY
						"content": `## What's this all about?
You are currently about to make an account on my site, [snapps.dev](https://snapps.dev). Everything is linked to your discord account so there's no need to create a password.

With this account, you'll be access to many things:
- Gain authorization to services I host.
- Get extra features or permissions.
- The ability to track silly stats.
  - Ask count, Drawpiles started, etc.
- More to come!

[Privacy Policy](https://space.snapps.dev/privacy) | [Terms of Service](https://space.snapps.dev/terms)`
					},
					{
						"type": 18,
						"label": "Would you like your profile to be private?",
						"description": "This will hide your profile and stats from lookups and searches.",
						"component": {
							"type": 3,
							"custom_id": "account_priv",
							"placeholder": "Choose...",
							"options": [{
									"label": "Yes",
									"value": true,
									"emoji": {
										"name": "✅"
									}
								},
								{
									"label": "No",
									"value": false,
									"emoji": {
										"name": "❎"
									}
								}
							]
						}
					}
				]
			}
		}, 200);
	}
}

// --- account privacy ---
export class account_privacy {
	static spec = {
		name: "privacy", // as it appears to discord
		type: Discord.ApplicationCommandTypes.CHAT_INPUT, // command type
		callback: Discord.InteractionCallbackTypes.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE, // wether to defer or not, really
		description: "Manage you account privacy.", // as it appears to discord
		contexts: [Discord.InteractionContextTypes.GUILD, Discord.InteractionContextTypes.BOT_DM], // where can the command be used
		isInDev: true, // T/F - whether or not to deploy the command to all servers or just dev server
		perms: null // what roll has access to the command
	}

	// this will be called upon initial command use (sans modals and autocompete (probably))
	static async exec(interactionData) {
		try {
			// log command or something

			// do command stuff
			var userDataRequest = await Space.getUser(interactionData.member.user.id);
			var userData = userDataRequest.data
			const currentPrivacy = await Space.getUserPrivacy(userData)
			var body = account_privacy.createPrivacyModal(currentPrivacy)
			body.flags = Discord.MessageFlags.toBitfield([Discord.MessageFlags.EPHEMERAL, Discord.MessageFlags.IS_COMPONENTS_V2])
			await Discord.sendToEndpoint("PATCH", `/webhooks/${env.DISCORD_BOT_ID}/${interactionData.token}/messages/@original`, body)

		} catch (e) {
			// log error
			console.error(e)

			// return error message to discord
			await Discord.sendToEndpoint("PATCH", `/webhooks/${env.DISCORD_BOT_ID}/${interactionData.token}/messages/@original`, {
				flags: Discord.MessageFlags.toBitfield([Discord.MessageFlags.EPHEMERAL]),
				content: "",
				tts: false,
				embeds: [{
					id: 1,
					description: "Something went wrong running the command...",
					"color": 0xff0000
				}],
			})
		}
	}

	// when message component is interacted with, this is the fuction that runs
	static async update(interactionData) {
		var userDataRequest = await Space.getUser(interactionData.member.user.id);
		var userData = userDataRequest.data
		var currentPrivacy = await Space.getUserPrivacy(userData) // get current
		currentPrivacy ? await Space.removeUserFlag(userData, 0b100) : await Space.addUserFlag(userData, 0b100) // flip it
		currentPrivacy ? currentPrivacy = false : currentPrivacy = true

		var body = account_privacy.createPrivacyModal(currentPrivacy) // create body
		body.flags = Discord.MessageFlags.toBitfield([Discord.MessageFlags.EPHEMERAL, Discord.MessageFlags.IS_COMPONENTS_V2])
		await Discord.sendToEndpoint("PATCH", `/webhooks/${env.DISCORD_BOT_ID}/${interactionData.token}/messages/@original`, body)
	}

	static createPrivacyModal(currentPrivacy) {
		var body = {
			components: []
		}

		// Text
		var container = new Discord.ComponentBuilder(Discord.ComponentTypes.CONTAINER)
		container.setParams({
			accent_color: 0x0099ff
		})
		var text = new Discord.ComponentBuilder(Discord.ComponentTypes.TEXT_DISPLAY)
		text.setContent(`Currently your profile is...\n## __**${currentPrivacy?"PRIVATE":"PUBLIC"}**__!`)
		container.addComponent(text)
		body.components.push(container.build())

		// Buttons
		var buttonRow = new Discord.ComponentBuilder(Discord.ComponentTypes.ACTION_ROW)
		var toggleButton = new Discord.ComponentBuilder(Discord.ComponentTypes.BUTTON)
		currentPrivacy ? toggleButton.setParams({
			style: Discord.ButtonStyles.DANGER,
			label: "MAKE PUBLIC"
		}) : toggleButton.setParams({
			style: Discord.ButtonStyles.SUCCESS,
			label: "MAKE PRIVATE"
		})
		toggleButton.setParams({
			custom_id: "toggle_btn"
		})
		buttonRow.addComponent(toggleButton)
		body.components.push(buttonRow.build())

		return body
	}
}

// --- account wild ---
export class account_wild {
	static spec = {
		name: "wild", // as it appears to discord
		type: Discord.ApplicationCommandTypes.CHAT_INPUT, // command type
		callback: Discord.InteractionCallbackTypes.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE, // wether to defer or not, really
		description: "For those with more 'wild' tastes.", // as it appears to discord
		contexts: [Discord.InteractionContextTypes.GUILD, Discord.InteractionContextTypes.BOT_DM], // where can the command be used
		isInDev: true, // T/F - whether or not to deploy the command to all servers or just dev server
		perms: null // what roll has access to the command
	}

	// this will be called upon initial command use (sans modals and autocompete (probably))
	static async exec(interactionData) {

		try {
			// log command or something

			// do command stuff
			var message = {} // the message to send back
			message.flags = Discord.MessageFlags.toBitfield([Discord.MessageFlags.EPHEMERAL]) // make the message ephemeral

			// return message to discord
			await Discord.sendToEndpoint("PATCH", `/webhooks/${env.DISCORD_BOT_ID}/${interactionData.token}/messages/@original`, message)

		} catch (e) {
			// log error
			console.error(e)

			// return error message to discord
			await Discord.sendToEndpoint("PATCH", `/webhooks/${env.DISCORD_BOT_ID}/${interactionData.token}/messages/@original`, {
				flags: Discord.MessageFlags.toBitfield([Discord.MessageFlags.EPHEMERAL]),
				content: "",
				tts: false,
				embeds: [{
					id: 1,
					description: "Something went wrong running the command...",

					"color": 0xff0000
				}],
			})
		}
	}

	// when message component is interacted with, this is the fuction that runs
	static async update(interactionData) {}
}

// --- account delete ---
export class account_delete {
	static spec = {
		name: "delete", // as it appears to discord
		type: Discord.ApplicationCommandTypes.CHAT_INPUT, // command type
		callback: Discord.InteractionCallbackTypes.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE, // wether to defer or not, really
		description: "Delete your Snapps Space account", // as it appears to discord
		contexts: [Discord.InteractionContextTypes.GUILD, Discord.InteractionContextTypes.BOT_DM], // where can the command be used
		isInDev: true, // T/F - whether or not to deploy the command to all servers or just dev server
		perms: null // what roll has access to the command
	}

	// this will be called upon initial command use (sans modals and autocompete (probably))
	static async exec(interactionData) {
		try {
			// log command or something

			// do command stuff
			var message = {} // the message to send back
			message.flags = Discord.MessageFlags.toBitfield([Discord.MessageFlags.EPHEMERAL]) // make the message ephemeral

			// return message to discord
			await Discord.sendToEndpoint("PATCH", `/webhooks/${env.DISCORD_BOT_ID}/${interactionData.token}/messages/@original`, message)

		} catch (e) {
			// log error
			console.error(e)

			// return error message to discord
			await Discord.sendToEndpoint("PATCH", `/webhooks/${env.DISCORD_BOT_ID}/${interactionData.token}/messages/@original`, {
				flags: Discord.MessageFlags.toBitfield([Discord.MessageFlags.EPHEMERAL]),
				content: "",
				tts: false,
				embeds: [{
					id: 1,
					description: "Something went wrong running the command...",
					"color": 0xff0000
				}],
			})
		}
	}

	// when message component is interacted with, this is the fuction that runs
	static async update(interactionData) {}
}

// ----- loose commands -----

// general help
export class help {
	static spec = {
		name: "help", // as it appears to discord
		type: Discord.ApplicationCommandTypes.CHAT_INPUT, // command type
		callback: Discord.InteractionCallbackTypes.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE, // wether to defer or not, really
		description: "What is this creature? What do they do?", // as it appears to discord
		contexts: [Discord.InteractionContextTypes.GUILD, Discord.InteractionContextTypes.BOT_DM], // where can the command be used
		isInDev: true, // T/F - whether or not to deploy the command to all servers or just dev server
		perms: null // what roll has access to the command
	}

	// this will be called upon initial command use (sans modals and autocompete (probably))
	static async exec(interactionData) {}

	// when message component is interacted with, this is the fuction that runs
	static async update(interactionData) {}
}

// pet command
export class pet {

	static SPECIAL_CHANCE = .01

	// [pet text, pet color, pet image]
	static NORMAL_PET_LIST = [
		["Amazing pet!!", 0x0099ff],
		["Great pet!", 0x99ff00],
		["Good pet!", 0x99ff00],
		["Alright pet.", 0x888888],
		["Okay pet.", 0x888888],
		["Bad pet.", 0xff9900],
		["Horrible pet...", 0xff0000]
	]
	static SPECIAL_PET_LIST = [
		["Elusive butt pet!", 0x00ff99],
		["Intercepted by Savak!", 0x00ff99],
		["Intercepted by Snavak!", 0x00ff99],
		["Intercepted by Snapps!", 0x00ff99]
	]

	static chooseRandom(arr) {
		return arr[Math.floor(Math.random() * arr.length)];
	}


	static spec = {
		name: "pet", // as it appears to discord
		type: Discord.ApplicationCommandTypes.CHAT_INPUT, // command type
		callback: Discord.InteractionCallbackTypes.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE, // wether to defer or not, really
		description: "Pet the service kobold.", // as it appears to discord
		contexts: [Discord.InteractionContextTypes.GUILD, Discord.InteractionContextTypes.BOT_DM], // where can the command be used
		isInDev: true, // T/F - whether or not to deploy the command to all servers or just dev server
		perms: null // what roll has access to the command
	}

	static async exec(interactionData) {
		try {
			var petData;
			const petChance = Math.random()
			console.log(petChance)
			if (petChance <= pet.SPECIAL_CHANCE) { // If special pet
				petData = pet.chooseRandom(pet.SPECIAL_PET_LIST)
			} else {
				petData = pet.chooseRandom(pet.NORMAL_PET_LIST)
			}

			await Discord.sendToEndpoint("PATCH", `/webhooks/${env.DISCORD_BOT_ID}/${interactionData.token}/messages/@original`, {
				"flags": Discord.MessageFlags.toBitfield([Discord.MessageFlags.EPHEMERAL]),
				"content": "",
				"tts": false,
				"embeds": [{
					"id": 130249665,
					"description": petData[0],
					"fields": [],
					"image": {
						"url": "https://cdn.snapps.dev/button.gif"
					},
					"color": petData[1]
				}],
			})
		} catch (e) {
			// log error
			console.error(e)

			// return error message to discord
			await Discord.sendToEndpoint("PATCH", `/webhooks/${env.DISCORD_BOT_ID}/${interactionData.token}/messages/@original`, {
				flags: Discord.MessageFlags.toBitfield([Discord.MessageFlags.EPHEMERAL]),
				content: "",
				tts: false,
				embeds: [{
					id: 1,
					description: "Something went wrong running the command...",
					"color": 0xff0000
				}],
			})
		}

	}

}

// ----- user context commands -----

// user profile lookup
export class user_profile {
	static spec = {
		name: "Snapps' Space Profile", // as it appears to discord
		type: Discord.ApplicationCommandTypes.USER, // command type
		callback: Discord.InteractionCallbackTypes.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE, // wether to defer or not, really
		//description: "Pet the service kobold.", // as it appears to discord
		contexts: [Discord.InteractionContextTypes.GUILD], // where can the command be used
		isInDev: true, // T/F - whether or not to deploy the command to all servers or just dev server
		perms: null // what roll has access to the command
	}

	static async exec(interactionData) {

		await user_profile.followup(interactionData)

	}


	static async followup(interactionData) {

		var isSelf = interactionData.member.user.id == interactionData.data.target_id
		var body;

		console.log("Following up on profile query...")

		// get user
		var userData;
		var userDataRequest = await Space.getUser(interactionData.data.target_id);
		var userData = userDataRequest.data


		// if profile private and !isSelf return private profile notice
		if (!userData || (await env.snapps_dev.isPrivate(userData) && !isSelf)) {
			body = user_profile.generateNotFoundPage()
		} else {
			body = user_profile.generateFrontPage(userData)
		}
		body.flags = Discord.MessageFlags.toBitfield([Discord.MessageFlags.EPHEMERAL, Discord.MessageFlags.IS_COMPONENTS_V2])

		await Discord.sendToEndpoint("PATCH", `/webhooks/${env.DISCORD_BOT_ID}/${interactionData.token}/messages/@original`, body)

	}

	static async update(interactionData) {

		var body

		// get user
		var userData;
		var userDataRequest = await Space.getUser(interactionData.message.interaction_metadata.target_user.id);
		userData = userDataRequest.data

		switch (interactionData.data.values[0]) {
			case "id": //Front Page
				body = user_profile.generateFrontPage(userData)
				body.flags = Discord.MessageFlags.toBitfield([Discord.MessageFlags.EPHEMERAL, Discord.MessageFlags.IS_COMPONENTS_V2])
				break;
			case "ask": //Ask Page
				body = user_profile.generateAskPage(userData)
				body.flags = Discord.MessageFlags.toBitfield([Discord.MessageFlags.EPHEMERAL, Discord.MessageFlags.IS_COMPONENTS_V2])
				break;
		}

		// Send Callback
		await Discord.sendToEndpoint("PATCH", `/webhooks/${env.DISCORD_BOT_ID}/${interactionData.token}/messages/@original`, body)
	}

	static generatePageMenuComponent() {

		var holder = new Discord.ComponentBuilder(Discord.ComponentTypes.ACTION_ROW);

		var pageMenu = new Discord.ComponentBuilder(Discord.ComponentTypes.STRING_SELECT);
		pageMenu.setParams({
			custom_id: "menu_page",
			placeholder: "Choose a menu..."
		})
		pageMenu.addOption({
			label: "Front Page",
			value: "id"
		});
		pageMenu.addOption({
			label: "Ask Page",
			value: "ask"
		});

		holder.addComponent(pageMenu)
		return holder.build()
	}

	static generateFrontPage(userData) {

		console.warn(userData);

		var body = {
			components: []
		}
		var basicsContainer = new Discord.ComponentBuilder(Discord.ComponentTypes.CONTAINER)
		basicsContainer.setParams({
			accent_color: 0x00ffff
		})

		//Profile Basics
		var basicsSection = new Discord.ComponentBuilder(Discord.ComponentTypes.SECTION)
		var userIcon = new Discord.ComponentBuilder(Discord.ComponentTypes.THUMBNAIL)
		userIcon.setParams({
			media: Discord.getUserAvatarURL(userData)
		})
		basicsSection.setAccessory(userIcon)
		var userInfoText = new Discord.ComponentBuilder(Discord.ComponentTypes.TEXT_DISPLAY)
		userInfoText.setContent(`
			# [${userData.nickname?userData.nickname:userData.discord_username}](https://space.snapps.dev/profile?value=${userData.uuid})
Title: ${userData.title ? userData.title : "None"}
Registered Since: ${new Date(userData.created_at).toLocaleDateString()}
			`)

		basicsSection.addComponent(userInfoText)

		basicsContainer.addComponent(basicsSection)

		body.components.push(basicsContainer.build())

		const menubar = user_profile.generatePageMenuComponent()
		body.components.push(menubar)
		return body

	}

	//WIP: Wait till asks are a thing
	static generateAskPage(userData) {

		var body = {
			components: []
		}

		var basicsContainer = new Discord.ComponentBuilder(Discord.ComponentTypes.CONTAINER)
		basicsContainer.setParams({
			accent_color: 0xff00ff
		})

		//Profile Basics
		var basicsSection = new Discord.ComponentBuilder(Discord.ComponentTypes.SECTION)
		var userIcon = new Discord.ComponentBuilder(Discord.ComponentTypes.THUMBNAIL)
		userIcon.setParams({
			media: Discord.getUserAvatarURL(userData)
		})
		basicsSection.setAccessory(userIcon)
		var userInfoText = new Discord.ComponentBuilder(Discord.ComponentTypes.TEXT_DISPLAY)
		userInfoText.setContent(`# Ask Stats
Woah, hey, hold up! This is a work in progress!`)

		basicsSection.addComponent(userInfoText)

		basicsContainer.addComponent(basicsSection)

		body.components.push(basicsContainer.build())

		const menubar = user_profile.generatePageMenuComponent()
		body.components.push(menubar)

		return body

	}

	static generateNotFoundPage() {
		var body = {
			components: []
		};
		/*
				"components": [
		    {
		      "type": 17,
		      "accent_color": 15035189,
		      "spoiler": false,
		      "components": [
		        {
		          "type": 10,
		          "content": "# User Not Found\nI can't seem to find any information about this user..."
		        }
		      ]
		    }
		  ],
		  */
		var container = new Discord.ComponentBuilder(Discord.ComponentTypes.CONTAINER)
		container.setParams({
			accent_color: 15035189
		})

		var text = new Discord.ComponentBuilder(Discord.ComponentTypes.TEXT_DISPLAY)
		text.setContent("# User Not Found\nI can't seem to find any information about this user...")

		container.addComponent(text)

		body.components.push(container.build())


		return body

	}
}
