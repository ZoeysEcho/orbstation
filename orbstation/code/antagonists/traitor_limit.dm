/// Current count of traitors & blood brothers
GLOBAL_VAR_INIT(traitor_limit_antag_count, 0)

/datum/game_mode/dynamic
	/// The number of alive players is multitplied by this percentage to determine the traitor limit.
	/// Configurable in dynamic.json.
	var/traitor_limit_scaling_percentage = 0.25
	/// Minimum amount of threat allowed to generate.
	var/min_threat_level = 30
	/// Chance that the roundstart threat report will be wrong about the threat level.
	var/fake_report_chance = 5
	/// Potential positive deviance from the actual threat level in the roundstart threat report.
	var/pos_shown_threat_deviance = 10
	/// Potential negative deviance from the actual threat level in the roundstart threat report.
	var/neg_shown_threat_deviance = -10

/// Calculates the limit for midround/latejoin traitor spawns based on current population and threat level.
/// Returns TRUE or FALSE depending on if more traitors can spawn or not.
/datum/game_mode/dynamic/proc/calculate_traitor_limit()
	var/traitor_limit = round(traitor_limit_scaling_percentage * GLOB.alive_player_list.len, 1)
	if(GLOB.traitor_limit_antag_count >= traitor_limit)
		return FALSE

	return TRUE

/datum/game_mode/dynamic/generate_threat()
	..()
	threat_level = max(min_threat_level, threat_level)

/datum/game_mode/dynamic/setup_shown_threat()
	if(threat_level == 100) // if the threat level is somehow at 100 we want the game to always print out the "Impending Doom" report because it's funny
		shown_threat = 100
	else if (prob(fake_report_chance))
		shown_threat = rand(min_threat_level, max_threat_level)
	else
		shown_threat = clamp(threat_level + rand(neg_shown_threat_deviance, pos_shown_threat_deviance), 0, 100)

/datum/antagonist/traitor/on_gain()
	GLOB.traitor_limit_antag_count++
	return ..()

/datum/antagonist/traitor/on_removal()
	if (GLOB.traitor_limit_antag_count > 0)
		GLOB.traitor_limit_antag_count--
	return ..()

/datum/antagonist/brother/on_gain()
	GLOB.traitor_limit_antag_count++
	return ..()

/datum/antagonist/brother/on_removal()
	if (GLOB.traitor_limit_antag_count > 0)
		GLOB.traitor_limit_antag_count--
	return ..()
