import * as Discord from "./discord.js";
import * as Space from "./space.js"

// Command specifications go here

export class register {

	static registerURL = "https://discord.com/oauth2/authorize?client_id=1415423498641211542&response_type=code&redirect_uri=https%3A%2F%2Fshibboleth.snapps.dev%2Fregister%2Fdiscord%2F&scope=identify+guilds.members.read"

	static spec = {
		name: "register",
		type: Discord.ApplicationCommandTypes.CHAT_INPUT,
		description: "Sends you a link to sign up to Snapps Space.",
		contexts: [Discord.InteractionContextTypes.GUILD, Discord.InteractionContextTypes.BOT_DM]
	}
	static async exec(interactionContent) {
		console.log("Sending registration info")

		await Discord.InteractionCallback(interactionContent.id, interactionContent.token, {

			"type": Discord.InteractionCallbackTypes.MODAL,
			"data": {
				"custom_id": "register_modal",
				"title": "Snapps' Space Registration",
				"components": [{
						"type": 10, // ComponentType.TEXT_DISPLAY
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
		})
	}
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
		"name": "pet",
		"type": Discord.ApplicationCommandTypes.CHAT_INPUT,
		"description": "Pet the service kobold.",
	}

	static async exec(interactionContent) {

		var petData;
		const petChance = Math.random()
		console.log(petChance)
		if (petChance <= pet.SPECIAL_CHANCE) { // If special pet
			petData = pet.chooseRandom(pet.SPECIAL_PET_LIST)
		} else {
			petData = pet.chooseRandom(pet.NORMAL_PET_LIST)
		}

		var callback = await Discord.InteractionCallback(interactionContent.id, interactionContent.token, {
			"type": Discord.InteractionCallbackTypes.CHANNEL_MESSAGE_WITH_SOURCE,
			"data": {
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
			}
		})

		// Add to a global blep counter
		return new Response()
	}

}

export class profile_user {
	static spec = {
		"name": "Snapps' Space Profile",
		"type": Discord.ApplicationCommandTypes.USER,
	}

	static async exec(interactionContent, ctx) {

		ctx.waitUntil(Discord.InteractionCallback(interactionContent.id, interactionContent.token, {
			"type": Discord.InteractionCallbackTypes.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE,
			"data": {
				"flags": Discord.MessageFlags.toBitfield([Discord.MessageFlags.EPHEMERAL, Discord.MessageFlags.IS_COMPONENTS_V2]),
				"content": "Loading...",
				"tts": false
			}
		}));

		ctx.waitUntil(await profile_user.followup(interactionContent));

		var options = {
			status: 200
		};
		return new Response("", options);
	}
	static async followup(interactionContent) {

		console.log(interactionContent);

		var userData;
		var sameUser = interactionContent.member.user.id == interactionContent.data.target_id


		console.log("Following up on profile query...")

		if (sameUser) userData = await Space.getOwnProfile(interactionContent.data.target_id);

		else userData = await Space.getUser(interactionContent.data.target_id);


			var body = profile_user.generateFrontPage(userData)

			body.flags = Discord.MessageFlags.toBitfield([Discord.MessageFlags.EPHEMERAL, Discord.MessageFlags.IS_COMPONENTS_V2])

			var followup = await Discord.FollowupMessage("edit", interactionContent.application_id, interactionContent.token, body);

	}

	static async update(interactionContent,ctx){
		var body
		switch (interactionContent.data.values[0]) {
			
			case "id": //Front Page
				var userData;
				var sameUser = interactionContent.member.user.id == interactionContent.message.interaction_metadata.target_user.id
				if (sameUser) userData = await Space.getOwnProfile(interactionContent.message.interaction_metadata.target_user.id);
				else userData = await Space.getUser(interactionContent.message.interaction_metadata.target_user.id);
				body = profile_user.generateFrontPage(userData)
				body.flags = Discord.MessageFlags.toBitfield([Discord.MessageFlags.EPHEMERAL, Discord.MessageFlags.IS_COMPONENTS_V2])
				break;
			case "ask": //Ask Page
				body = profile_user.generateAskPage(interactionContent.message.interaction_metadata.target_user)
				body.flags = Discord.MessageFlags.toBitfield([Discord.MessageFlags.EPHEMERAL, Discord.MessageFlags.IS_COMPONENTS_V2])
				break;
			default:
				break;
		}
		
		 
		
		// Send Callback
		ctx.waitUntil(Discord.InteractionCallback(interactionContent.id, interactionContent.token, {
			"type": Discord.InteractionCallbackTypes.DEFERRED_UPDATE_MESSAGE,
			"data": {
				"flags": Discord.MessageFlags.toBitfield([Discord.MessageFlags.EPHEMERAL, Discord.MessageFlags.IS_COMPONENTS_V2]),
				"content": "Loading...",
				"tts": false
			}
		}));

		var followup = await Discord.FollowupMessage("edit", interactionContent.application_id, interactionContent.token, body);
		console.log(JSON.stringify(body))
		//console.log(followup)

		var options = {
			status: 202
		};
		return new Response( options);
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

		if (userData.data.status == 404) {

			body = {
				"flags": Discord.MessageFlags.toBitfield([Discord.MessageFlags.EPHEMERAL]),
				"content": "",
				"tts": false,
				"embeds": [{
					"id": 130249665,
					"description": "I can't seem to find any information about this user...",
					"fields": [],
					"color": 16731688,
					"title": "User Not Found"
				}],
				"components": [],
				"actions": {}
			};
		} else {


var basicsContainer = new Discord.ComponentBuilder(Discord.ComponentTypes.CONTAINER)
		basicsContainer.setParams({accent_color:0x00ffff})

		//Profile Basics
		var basicsSection = new Discord.ComponentBuilder(Discord.ComponentTypes.SECTION)
		var userIcon = new Discord.ComponentBuilder(Discord.ComponentTypes.THUMBNAIL)
		userIcon.setParams({media:`https://cdn.discordapp.com/avatars/${userData.data.data.discord_id}/${userData.data.data.icon}?size=128`})
		basicsSection.setAccessory(userIcon)
		var userInfoText = new Discord.ComponentBuilder(Discord.ComponentTypes.TEXT_DISPLAY)
		userInfoText.setContent(`
			# [${userData.data.data.nickname}](https://space.snapps.dev/profile?value=${userData.data.data.uuid})
Title: ${userData.data.data.title ? userData.data.data.title : "None"}
Registered Since: ${new Date(userData.data.data.created_at * 1000).toLocaleDateString()}
			`)

		basicsSection.addComponent(userInfoText)
		
		basicsContainer.addComponent(basicsSection)
		
		body.components.push(basicsContainer.build())

		const menubar = profile_user.generatePageMenuComponent()
		body.components.push(menubar)


		}

		

		return body

	}

	//WIP: Wait till asks are a thing
	static generateAskPage(discordUserData) {

		var body = {
			components: []
		}

		var basicsContainer = new Discord.ComponentBuilder(Discord.ComponentTypes.CONTAINER)
		basicsContainer.setParams({accent_color:0xff00ff})

		//Profile Basics
		var basicsSection = new Discord.ComponentBuilder(Discord.ComponentTypes.SECTION)
		var userIcon = new Discord.ComponentBuilder(Discord.ComponentTypes.THUMBNAIL)
		userIcon.setParams({media:`https://cdn.discordapp.com/avatars/${discordUserData.id}/${discordUserData.avatar}?size=128`})
		basicsSection.setAccessory(userIcon)
		var userInfoText = new Discord.ComponentBuilder(Discord.ComponentTypes.TEXT_DISPLAY)
		userInfoText.setContent(`# Ask Stats
Woah, hey, hold up! This is a work in progress!`)

		basicsSection.addComponent(userInfoText)
		
		basicsContainer.addComponent(basicsSection)
		
		body.components.push(basicsContainer.build())

		const menubar = profile_user.generatePageMenuComponent()
		body.components.push(menubar)

		return body

	}


}