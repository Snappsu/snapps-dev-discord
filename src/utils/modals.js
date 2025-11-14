import * as Discord from "../apis/discord";
import {
	env
} from "cloudflare:workers";

/* ===== TODO LIST =====
- implement profile privacy option
 */

export async function processModal(interactionObject) {
	try {
		console.log("processing modal...")
		switch (interactionObject.data.custom_id) {
			case "register_modal":
				console.log("user registration modal submittion identified...")
				var body;
				interactionObject.data.components.forEach(component => {
					console.log(component)
				});

				console.log("attempting to register...")
                console.log(interactionObject.member.user)

				var registration = await env.snapps_dev.createUserViaDiscordInternal(interactionObject.member.user)
				console.log(registration)

				var userData = await env.snapps_dev.getUserByDiscordID(interactionObject.member.user.id).data
				console.log(userData)


				var userData;
				//if already registered; hard-coded cause i've lost everything
				if (registration.data == "seems like you're already registered") {
					body = `Hmmm... seems like you're already registered...\nYou can check out your profile here: https://space.snapps.dev/profile/${userData.uuid}\nOr you can use the \`/profile\` command to see your profile without logging in.`

				} else if (registration.status == "error") {

					//something went wrong
					body = "Hmmm... seems something went wrong while making you and account...\nYou should tell <@143978133798780928>"
				} else {
					body = `Registration complete! You can check out your profile here: https://space.snapps.dev/profile/${userData.uuid}\nOr you can use the \`/profile\` command to see your profile without logging in.`
				}

				await Discord.sendToEndpoint("PATCH", `/webhooks/${env.DISCORD_BOT_ID}/${interactionObject.token}/messages/@original`, {
					"flags": Discord.MessageFlags.toBitfield([Discord.MessageFlags.EPHEMERAL]),

					// Probs check if it ACTUALLY completed
					"content": body
				})
				break;

			default:
				console.error("unrecognized modal!")
				break;
		}
	} catch (e) {

		console.error(e)
	}
}
