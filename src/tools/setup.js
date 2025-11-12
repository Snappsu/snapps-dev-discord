import * as Discord from "../apis/discord.js";
import * as Commands from "../commands.js"

// To be ran whenever a new command is created

//commandIDs - int[] - IDs of commands to delete
export function getCommandClassByName(commandName){
	var className = null;
	Object.entries(Commands).forEach(command => {
		if (command[1].spec.name==commandName) {
			className = command[0];
		}
	});
	return className;
}



async function updateCommands() {
	// Get all remotely-registered commands
	const getCommands = await Discord.getGlobalApplicationCommands(process.env.DISCORD_APP_ID)
	const remoteCommands = await getCommands.data.map(x => [x.id,x.name]);	

	// Get all locally-found command
	var localCommands = Object.values(Commands).map(x => x.spec.name)

	// For each remote command
	remoteCommands.forEach(command => {
		// If remote command not found, unregister it
		if(!localCommands.includes(command[1])) Discord.deleteGlobalApplicationCommand(process.env.DISCORD_APP_ID,command[0])
	});

	// (Re)Register all
	for (let index = 0; index < localCommands.length; index++) {
		var commandClass = getCommandClassByName(localCommands[index])
		Discord.createGlobalApplicationCommand(process.env.DISCORD_APP_ID, Commands[commandClass].spec);
	}
}

// Some commands I use for set up
// Comment/Uncomment as needed

//Removes loose remote commands and registers local ones
updateCommands()