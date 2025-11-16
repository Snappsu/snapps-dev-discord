import * as Commands from "../commands.js"

// To be ran whenever a new command is created

//commandIDs - int[] - IDs of commands to delete
export function getCommandClassByName(commandName) {
	//console.log(commandName)

	var className = null;
	Object.entries(Commands).forEach(command => {
		try {
			//console.log(command[1].spec.name==commandName)

			if (command[1].spec.name == commandName) {
				className = command[0];
				console.log(`match found: ${className}!`)

				return className;
			}
		} catch (e) {

		}

	});
	return className;
}
