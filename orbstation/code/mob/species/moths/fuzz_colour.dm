//sets moth to the correct color
/datum/species/moth/on_species_gain(mob/living/carbon/C, datum/species/old_species, pref_load)
	. = ..()
	if(!ishuman(C))
		return
	var/mob/living/carbon/human/moth = C
	fixed_mut_color = moth.dna.features["moth_color"]

//Pref for moth coloration
/datum/preference/choiced/moth_color
	savefile_key = "feature_mothcolor"
	savefile_identifier = PREFERENCE_CHARACTER
	category = PREFERENCE_CATEGORY_FEATURES
	main_feature_name = "Fuzz color"
	should_generate_icons = TRUE

/datum/preference/choiced/moth_color/init_possible_values()
	var/list/values = list()

	var/icon/moth_base = icon('orbstation/icons/mob/species/moth/bodyparts_greyscale.dmi', "moth_head")
	moth_base.Blend(icon('orbstation/icons/mob/species/moth/bodyparts_greyscale.dmi', "moth_chest_m"), ICON_OVERLAY)
	moth_base.Blend(icon('orbstation/icons/mob/species/moth/bodyparts_greyscale.dmi', "moth_l_arm"), ICON_OVERLAY)
	moth_base.Blend(icon('orbstation/icons/mob/species/moth/bodyparts_greyscale.dmi', "moth_r_arm"), ICON_OVERLAY)

	var/icon/eyes = icon('icons/mob/species/human/human_face.dmi', "motheyes")
	eyes.Blend(COLOR_BLACK, ICON_MULTIPLY)
	moth_base.Blend(eyes, ICON_OVERLAY)

	moth_base.Scale(64, 64)
	moth_base.Crop(15, 64, 15 + 31, 64 - 31)

	for (var/name in GLOB.color_list_moth)
		var/color = GLOB.color_list_moth[name]

		var/icon/icon = new(moth_base)
		icon.Blend(color, ICON_MULTIPLY)
		values[name] = icon

	return values

/datum/preference/choiced/moth_color/apply_to_human(mob/living/carbon/human/target, value)
	target.dna.features["moth_color"] = GLOB.color_list_moth[value]

//Moth bodypart overrides
/obj/item/bodypart/head/moth
	icon_greyscale = 'orbstation/icons/mob/species/moth/bodyparts_greyscale.dmi'
	should_draw_greyscale = TRUE

/obj/item/bodypart/chest/moth
	icon_greyscale = 'orbstation/icons/mob/species/moth/bodyparts_greyscale.dmi'
	should_draw_greyscale = TRUE

/obj/item/bodypart/arm/left/moth
	icon_greyscale = 'orbstation/icons/mob/species/moth/bodyparts_greyscale.dmi'
	should_draw_greyscale = TRUE

/obj/item/bodypart/arm/right/moth
	icon_greyscale = 'orbstation/icons/mob/species/moth/bodyparts_greyscale.dmi'
	should_draw_greyscale = TRUE

/obj/item/bodypart/leg/left/moth
	icon_greyscale = 'orbstation/icons/mob/species/moth/bodyparts_greyscale.dmi'
	should_draw_greyscale = TRUE

/obj/item/bodypart/leg/right/moth
	icon_greyscale = 'orbstation/icons/mob/species/moth/bodyparts_greyscale.dmi'
	should_draw_greyscale = TRUE

/datum/species/moth/get_features()
	var/list/features = ..()

	features += "feature_mothcolor"

	return features

/datum/species/moth/randomize_features(mob/living/carbon/human/human_mob)
	human_mob.dna.features["moth_color"] = GLOB.color_list_moth[pick(GLOB.color_list_moth)]
	..()
