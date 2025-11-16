import { env } from "cloudflare:workers";


export async function getUser(discordID) {
	try {
		var userData = await env.snapps_dev.getUserByDiscordID(discordID)
		return userData
	} catch (error) {
    console.error(`Error getting profile info!`)
		console.error(error);
	}
}
