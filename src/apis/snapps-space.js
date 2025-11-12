import { env } from "cloudflare:workers";


export async function getUser(discordID) {
	console.log(`Getting Snapps' Space User of Discord User ${discordID}...`)
	const url = `https://shibboleth.snapps.dev/lookup/discord-id?value=${discordID}`;
	const options = {
		method: 'GET'
	};

	try {
		const data = await env.shibboleth.BOT_getUser(discordID)
    console.log(`Profile info recieved!`)
    console.log(data)

		return {
			response: data.status,
			data: data
		}
	} catch (error) {
    console.error(`Error getting profile info!`)
		console.error(error);
	}
}

export async function getOwnProfile(discordID) {
	console.log(`Getting Snapps' Space User of Discord User ${discordID}...`)
	const url = `https://shibboleth.snapps.dev/lookup/discord-id?value=${discordID}`;
	const options = {
		method: 'GET'
	};

	try {
		const data = await env.shibboleth.BOT_getOwnProfile(discordID)
    console.log(`Profile info recieved!`)
    //console.log(data)

		return {
			response: data.status,
			data: data
		}
	} catch (error) {
    console.error(`Error getting profile info!`)
		console.error(error);
	}
}