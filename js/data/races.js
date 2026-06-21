/**
 * Lyrian Chronicles - Race Data
 * 5 primary races + 42 ancestries with images
 */

/* exported RACE_DATA, ANCESTRY_MAP, TRAIT_DESCRIPTIONS */
const RACE_DATA = [
  {
    "id": "69ea4f7b6be32fced492ff93",
    "name": "Chimera",
    "description": "Chimera are creatures that have been mutated due to magic and have gained sentience. &nbsp;Almost all Chimera can be traced back to areas of high magical concentration and a lifeform that was mutated. &nbsp;Despite being quite varied in physical characteristics, all Chimera are effectively the same race at their core. &nbsp;It is unknown how arcane magic was able to pattern itself in such a way\u2026From Slime Chimera to the more common Feline Chimeras, there are varied sub-races that can be found throughout the world. And those sub-races can vary widely, even within the same phenotypes. Coloration, ear and tail shapes, and even number of physical characteristics. These widely varying phenotypes are broadly categorized in two ways: kanolith and zoalith.Kanolith chimera have limited physical characteristics. Most kanoliths will have ears, tails, or both corresponding to their sub-race. Kanoliths are the most common type of chimera overall and what most will think of when imagining a chimera of any sub-race.Zoalith chimera have exaggerated or prevalent physical characteristics. Fur, scales, replaced or altered limbs, and animalistic face shapes are all examples of zoalith features. This often leads to zoalith chimera having a far more \u201cbestial\u201d appearance which can sometimes bring social challenges. While zoalith chimera are overall rarer than kanolith, there are some sub-races that this trend is reversed. Centaurs, harpies, lamiafolk, and slimefolk are all examples of sub-races which trend toward zoalith.",
    "attributes": "You gain +1 in toughness and +1 in awareness.",
    "proficiencies": ["Common", "Sub-race Dialect"],
    "image": "https://cdn.angelssword.com/ttrpg/assets/1bf33da4-b9ac-44cf-ae53-ce85f84ee58f-Slime_GIrl_New_raw_1.sm.webp"
  },
  {
    "id": "69ea4f7b6be32fced492ff95",
    "name": "Demon",
    "description": "In Demon lore, they were the descendants of Angels who had rebelled against providence.&nbsp; Losing their angelic wings and methods to absorb the Divine might of Light, they\u2019ve adapted techniques to burn their own life force to temporarily tap into their powers.&nbsp; The dangerous technique called&nbsp;Divine Release, is highly praised as the pinnacle of a demon\u2019s powers.While originally slandered as \u201cdemons\u201d by humans and the angels of old, the demons have embraced the name as proof of their rebellion.&nbsp;Demons appear as humanoids, and but have varying secondary characteristics.&nbsp; Some have tiny wings that are devoid of the providence absorbing \u201cfeathers\u201d, while some have various kinds of horns or eye patterns.&nbsp; Some even have pointed ears like the fae.The Demon city of Sorthen exists as an aristocratic meritocracy, where the power balance shifts, houses die and new ones are born based on their contribution to society. &nbsp;These Demon houses all grant their offspring a middle name, this name referencing their roles in society from servants to soldiers to scholars. &nbsp;Each family passes down the techniques of their role, specializing for the greatest efficiency. None of these roles are looked down upon, and it is considered an honor to fulfill your purpose to the highest capability. &nbsp;While the tradition of adhering to house societal roles, they are not inflexible. &nbsp;It is not unusual for an individual to carve out a new life path if they demonstrate exceptional merit, and straying from that assigned family role would then not be viewed negatively.Size: Medium",
    "attributes": "You gain +1 in Power and +1 in Reason.",
    "proficiencies": ["Common", "Sorthen", "Common Weapon (1)"],
    "image": "https://cdn.angelssword.com/ttrpg/assets/7a2206e1-b5dc-433d-bc13-ee552982d128-Demon_Portrait_New_raw.sm.webp"
  },
  {
    "id": "69ea4f7b6be32fced492ff94",
    "name": "Fae",
    "description": "The Fae are widely considered the first people that populated Lyra.&nbsp; They are beings that were born from the will of nature and the world itself.&nbsp; Faeries can be quite varied in culture and demeanor, some using their age immortality to achieve great wisdom-- while others might use it to laze about and be merry.The most common type of Fae are the High Fae which appear as youthful humanoids with pointed ears and eyes that come in various colors and patterns",
    "attributes": "You gain +1 in Agility and +1 in Cunning.",
    "proficiencies": ["Common", "Sylvan"],
    "image": "https://cdn.angelssword.com/ttrpg/assets/42158447-1039-4c70-992b-00b67e562492-Dryad_raw.sm.webp"
  },
  {
    "id": "69ea4f7b6be32fced492ff91",
    "name": "Human",
    "description": "The origin of humans is not quite clear-- a race of generally homogenous characteristics in comparison to the other races.&nbsp; Despite their similarity, humans are varied in nature and have adapted to many different environments.&nbsp; Humans are quick learners and quick to adapt, a haste that is unseen in some of the other races, a byproduct of their generally shorter lifespans.For a reason still unknown, the humans are blessed by providence-- the great power of divine light and are born with a special attunement for it regardless of their religion.Size: Medium",
    "attributes": "You gain +1 in the main stat of your choice and +1 in the substat of your choice.",
    "proficiencies": ["Common", "Language (1 choice)", "Common Weapon (1)"],
    "image": "https://cdn.angelssword.com/ttrpg/assets/aa638108-9b8e-48ad-9e58-c7451e054c42-Sword_Saint_New_raw.sm.webp"
  },
  {
    "id": "69ea4f7b6be32fced492ff92",
    "name": "Youkai",
    "description": "Contrary to popular belief, Youkai are not the same as Chimera.&nbsp; Rather than being lifeforms that have attained sentience through magical mutations, Youkai were once ambient magic that binded together to form lifeforms.&nbsp; Hailing from the misty isle of Kirara, the Youkai are the rarest race amongst the population of Lyr.Like Chimera, the Youkai lineages are divided into Sub-Races.",
    "attributes": "You gain +1 in Focus and +1 in Presence.",
    "proficiencies": ["Common", "Kiraran"],
    "image": "https://cdn.angelssword.com/ttrpg/assets/6cdb70f8-f6b5-43c2-a494-361d0f916d92-Jiangshi_New_raw.sm.webp"
  }
];

const ANCESTRY_MAP = {
  "Youkai": [
    {
      "id": "69ea4f7a6be32fced492fb3a",
      "name": "Ancient Marionette",
      "ancestryId": "ancient-marionette",
      "description": "Ancient Marionettes: Lost to time and sea, the Ancient Marionettes stand as enigmatic remnants of a past long forgotten. Once components of the colossal arcane superweapon known as a \"Divine Arms\", these constructs now serve as hosts to sentient magic, giving life and consciousness to their once dormant forms. Rescued from the wreckage of a bygone vessel that met its fate in the waters surrounding the Isle of Kirara, these inert marionettes were left on the enchanted shore, their purpose and power seemingly lost to the ages. However, the island's potent, ambient magic, a phenomenon that gives birth to the unique entities known as youkai, saw in these Ancient Marionettes an opportunity - bodies ready to house their formless essence. As the island's pervasive magic seeped into the marionettes, they awoke from their lifeless slumber. The youkai spirits, now housed in these ancient bodies, began to stir, imbuing them with a consciousness that mirrored their own. Thus, the Ancient Marionettes were reborn, not as weapons of war but as sentient beings in their own right, the symbiosis of ancient technology and living magic. Physically, Ancient Marionettes resemble their former selves - intricate, humanoid forms, wrought from an alloy seemingly immune to the ravages of time and sea. Strange, arcane symbols adorn their bodies, pulsating with a soft, ethereal glow that intensifies when they harness their magical abilities. Their eyes, once empty and hollow, now shine with the vibrant spark of sentient life. Despite their imposing exterior, these reborn constructs possess an inherent gentleness, a testament to the youkai spirit within them. They are beings of thought and contemplation, bound by a curiosity of their new existence, their strange past, and the world they find themselves in. The Ancient Marionettes stand as a testament to the transformative power of magic, a symbol of a union between the ancient and the new, and a unique addition to the diverse inhabitants of the Isle of Kirara.Size: MediumWinner of the 2023 Alpha Race Creation Contest (Constructs) by PurpleXCompleX.",
      "attributes": "Thermal Vision, Mana Eater, Adaptive Defense",
      "proficiencies": [],
      "image": "https://cdn.angelssword.com/ttrpg/assets/5209e9d5-9bea-4b26-91ec-093be7d3e7e2-Marionette_new_2_hand_doll_work_start.sm.webp"
    },
    {
      "id": "69ea4f7a6be32fced492fb2f",
      "name": "Jiangshi",
      "ancestryId": "jiangshi",
      "description": "Jiangshi, a &nbsp;subrace of Youkai, are beings that inhabit and reanimate dead bodies. When a Jiangshi is born from a Youkai parent, a mitama\u2014the undeveloped Youkai spirit\u2014is inserted into the corpse of a physical being, such as a Human or Chimera. A distinctive talisman is affixed to their head, signifying their status and anchoring their existence within the host body. This bond prevents the corpse from decaying and grants the Jiangshi the ability to restore the dead body and benefit from healing, making them resilient on the battlefield. Predominantly found within the confines of Kirara, Jiangshi are rare and often face discrimination in other nations due to their unsettling forms and their relentless ferocity in combat, where they operate without experiencing pain or fatigue.Playing a Jiangshi involves embodying both strength and vulnerability. The unbreakable bond between the Jiangshi and their host body means that any severe damage to the corpse results in the Jiangshi's demise, introducing a critical vulnerability despite their formidable nature. In regions outside of Kirara, Jiangshi often encounter mistrust and prejudice. Additionally, a rising trend sees non-Youkai individuals traveling to Kirara to offer the corpses of their loved ones as hosts, driven by a deep desire to reconnect with those who have passed. This dynamic adds layers of emotional complexity and narrative tension for Jiangshi characters, who must navigate their powerful abilities alongside societal challenges. Jiangshi bring a unique combination of endurance, and a rich backstory to any adventuring party, making them compelling choices for players seeking depth and roleplaying potential.Size: Medium",
      "attributes": "Tireless Undead, Hopping Zombie, Consume Enemy",
      "proficiencies": [],
      "image": "https://cdn.angelssword.com/ttrpg/assets/0bb88010-ef02-4169-be18-51ee62c139c3-Jiangshi_New_raw.sm.webp"
    },
    {
      "id": "69ea4f7a6be32fced492fb2e",
      "name": "Kitsune",
      "ancestryId": "kitsune",
      "description": "Kitsune are the most prevalent subrace of Youkai, enchanting the world with their graceful presence. Manifesting as graceful fox spirits adorned with multiple tails, each tail symbolizes their age, wisdom, and magical prowess. Renowned for their mastery of illusions and arcane arts, Kitsune seamlessly blend deception and enchantment, making them formidable sorcerers and cunning tricksters. As the first Youkai to unite and establish a cohesive society, Kitsune laid the foundational stone for Youkai civilization on the mist-shrouded Kiraran Isles, a region rich in magical energy that perfectly complements their innate abilities. The capital city of Al Hazard, founded by the enigmatic Kitsune Grandmaster Zathegi\u2014whose true form and gender remain shrouded in mystery\u2014stands as a testament to their ingenuity and enigma. Al Hazard, one of the oldest surviving cities in all of Lyr, continues to thrive as a beacon of Kitsune culture and magical excellence.&nbsp;Playing a Kitsune means embracing a character steeped in tradition, mystique, and an unwavering appreciation for beauty and art. With a natural affinity for illusion and magic that can shape both perception and reality, Kitsune seamlessly integrate their artistic talents into their magical practices, making them exceptional artisans. In Kitsune society, those who create or embody beauty are held in the highest reverence, fostering a culture that celebrates artistic expression and craftsmanship. Kitsune characters excel in roles that require a flair for the dramatic, whether as spellcasters, diplomats, spies, or master artisans. Their rich cultural heritage offers deep narrative potential, allowing players to explore themes of identity, legacy, and creativeness. Despite their magical and artistic talents, Kitsune are often viewed with suspicion by others, remnants of which persist in societal prejudices and mistrust outside Kirara. This dynamic provides ample opportunities for character development, as Kitsune navigate their place in a world that both reveres and fears their magical and artistic heritage. Kitsune bring a unique blend of charm, intelligence, magical versatility, and artistic prowess to an adventuring party, making them captivating and influential allies.Size: Medium",
      "attributes": "Nightvision, Fading Counter",
      "proficiencies": [],
      "image": "https://cdn.angelssword.com/ttrpg/assets/655c0d7a-ab8a-4fbc-8a0d-b960d927569b-Kitsune_2_New_raw.sm.webp"
    },
    {
      "id": "69ea4f7a6be32fced492fb53",
      "name": "Nekomata",
      "ancestryId": "nekomata",
      "description": "Nekomata are a rare and often misunderstood sub-race of Youkai. They are deeply associated with death in most Youkai cultures and folklore ties them to first developing the methods and talismans needed to birth Jiangshi. In more recent times, with increasing trade and travel between Kirara and Lyr, Nekomata are often mistaken for Catfolk by Lyrian natives, with their primary distinguishing feature being their twin cat tails.Nekomata are most often solitary wanderers with only the rare villages to be found hidden in dense mountain forests. In fact, most people in Kirara will go their entire long lives without ever seeing a Nekomata. Unfortunately, this elusiveness makes any stories or tales involving a Nekomata stand out all the more and the most memorable are almost always those that are shocking. This has given Nekomata an undeserved reputation of hostility and maliciousness in Youkai society due to the actions of cruel pranksters, arsonists, and serial killers throughout history. A Nekomata traveling through Kirara will often find their actions and steps watched carefully by suspicious townsfolk and guards, although this reputation hasn\u2019t spread well into Lyr.Beyond their ability to puppet the recently deceased and their close connection with death, Nekomata are most known for their grudges. They do not forget an insult, a thrown stone, or a slight nor the faces and voices of the ones that said the words or threw the stones. It is likely that many of the cruel pranks, burned buildings, and slaughtered families are from a Nekomata settling their grudge decades later.Nekomata adventurers are often cautious to trust their companions but will form deep bonds if their trust isn\u2019t betrayed. In fact, adventuring parties that have a long standing Nekomata member would be wise to keep an eye on their twin-tailed friend, especially when insults begin to fly. Because a Nekomata holding a grudge for themselves is dangerous, but a Nekomata that is holding a grudge in defense of a friend is something lethal.And a Nekomata using the corpses of their recently defeated enemies to help in looting is a perfectly normal cultural quirk.\u201cI remember the stone you threw twenty winters ago. Do you?\u201dSize: M",
      "attributes": "Corpse Puppetry, Feign Death, Grudge",
      "proficiencies": [],
      "image": "https://cdn.angelssword.com/ttrpg/assets/b8683138-0ac5-41c7-b620-7fae8ce5d216-nekomata.sm.webp"
    },
    {
      "id": "69ea4f7a6be32fced492fb4c",
      "name": "Nio",
      "ancestryId": "nio",
      "description": "The Nio are ancient stone guardians. sentient statues who once stood vigil over sacred temples, hidden groves, and ancestral shrines across the lands of Kirara and beyond. Sometimes confused with gargoyles, the Nio possess intelligence and empathy whereas gargoyles typically attack anyone that comes close.The Nio have little in terms of a society or community. They often spend most of their life in a sacred sleep. While resting in this form they do not eat and they do not age making them the perfect guards. It is not uncommon for a Nio to spend decades in this form until their services are required again and a Nio usually serves alone, or with just one other Nio.Most Nio speak little, and when they do, it is with a slow, resonant cadence. They are not heartless, but they value purpose above sentiment. Their sense of duty is absolute, and many of them refuse to step away from their warded locations, even when the world has long forgotten them.Some Nio now wander, their temples lost to time or desecrated by war. These unbounded Nio seek new causes or companions to protect, and may imprint upon individuals they deem righteous. Others serve monasteries or empires as living monuments, standing sentinel in gardens, courtyards, and graveyards alike.Nio adventurers lean towards frontline roles, many of them relying on their hardened skin to absorb blows. By nature, most of them are also more accustomed to using melee weapons or unarmed combat as statues with other weapons are simply less common.Those traveling with an Nio will find a reliable and loyal ally. Just don\u2019t expect great conversations.\u201cThe world may forget. But I remain.\u201dSize: M",
      "attributes": "Stoneskin, Eternal Vigil, Statue Form",
      "proficiencies": [],
      "image": "https://cdn.angelssword.com/ttrpg/assets/643b0e9d-7040-4df5-88c2-08f6650934e1-Nio_Close_-_Copy.sm.webp"
    },
    {
      "id": "69ea4f7a6be32fced492fb39",
      "name": "Oni",
      "ancestryId": "oni",
      "description": "Their magical power is focused toward power and male Oni are generally large, strong, and sometimes brutish. Contrarily, female Oni are often very beautiful, by human standards. However, an Oni's appearance has little in common with their physical strength and despite their appearance, Oni are often calm and introspective. Oni are sometimes mistaken for Demons due to their horns. Most Oni also enjoy alcohol, which makes even the calmest incredibly rowdy. They tend to have incredibly powerful Ki, and even without training they tend to be able to affect the Ki of others.Size: MediumWinner of the 2023 Alpha Race Creation Contest by AShyMoth.",
      "attributes": "Spirited Bravado, Drink to Battle, Gravitational Ki",
      "proficiencies": [],
      "image": "https://cdn.angelssword.com/ttrpg/assets/c674920e-2796-4247-9f6a-d929c869dff7-Oni_New_raw.sm.webp"
    },
    {
      "id": "69ea4f7a6be32fced492fb2c",
      "name": "Raijin",
      "ancestryId": "raijin",
      "description": "Raijin are an exceptionally rare subrace of Youkai, embodying the very essence of lightning crystallized into sentient form. Their bodies are conduits of electrical energy, with vibrant arcs of lightning coursing through and emanating around them, granting them an electrifying presence that is both mesmerizing and formidable. Possessing incredible speed and agility, Raijin can catch and consume lightning, harnessing its raw power to fuel their abilities and enhance their combat prowess. This mastery over electrical energy not only makes them swift and lethal on the battlefield but also allows them to manipulate their surroundings with bursts of lightning-infused magic. Due to the intense energy that flows through and around them, Raijin often feel uncomfortable amidst the energetic fields of their own kind, which compels them to lead solitary lives.Historically, Raijin have traversed the farthest and most remote reaches of Lyr, their nomadic lifestyles a testament to their independence and relentless pursuit of personal goals. On the battlefield, Raijin excel as lone warriors or as leaders of small, focused units, utilizing their incredible energy to wipe out enemies in single combat. Their unique abilities allow them to absorb lightning, rendering them impervious to such assaults, and to imbue their weapons with crackling electricity, transforming them into fearsome instruments of battle. This dual mastery not only enhances their offensive capabilities but also instills fear in their adversaries. While typically solitary, Raijin can bring tactical advantages to an adventuring party, wreathing their weapons in electricity for a powerful frontal assault. Players who thrive as lone wolves and enjoy infusing weapons with power, will find playing a Raijin immensely rewarding. Additionally, those who aspire to lead or prefer to follow their own desires without hesitation will resonate with the Raijin's independent and dynamic nature, making them captivating and influential allies.Size: Medium",
      "attributes": "Consume Lightning, Lightning Weapon, Elemental Mastery: Lightning",
      "proficiencies": [],
      "image": "https://cdn.angelssword.com/ttrpg/assets/146c2bec-a405-485c-b463-f5a79dd0b544-Raijin_raw.sm.webp"
    },
    {
      "id": "69ea4f7a6be32fced492fb4f",
      "name": "Ryujin",
      "ancestryId": "ryujin",
      "description": "Ryujin are a rare and prideful sub-race of Youkai with distinctive draconic features. Claiming to be the only true direct descendants of mythical dragons, Ryujin are often at odds with Lizardfolk and Kobolds, who both claim the same - though Ryujin don\u2019t give the opinions of \u201clesser races\u201d much thought in that regard. Overall, Ryujin are regal and intimidating with a presence that commands a room and a glare that can silence a crowd.Culturally, Ryujin live together and apart from the rest of Kiraran society. They don\u2019t tend to form Ryujin villages but instead take on leadership roles in other Youkai communities as exclusive merchants, mayors, governors, or just wealthy nobles leveraging their wealth and power. They demand a level of excellence from those around them that causes communities they\u2019re in to both be free of corruption and require full, constant effort of improvement that can drive people away in search for an easier, simpler life.But what Ryujin demand of others, they demand of themselves even more intensely. Ryujin craftsmen will spend decades perfecting a single work to be worthy of their effort and lineage. Warriors will master techniques passed down from master to student for hundreds of years and often fight with an elegance that would be more at home on a stage than a battlefield. Scholars and mages dissect and understand their chosen fields to degrees of minutia reserved for specialist universities. Striking up a conversation about a Ryujin\u2019s interest will be a sure method of being regaled with the proper impact angles for hammering the shape of a katana, an arcane breakdown of individual elements of the Glittershard spell, or a detailed retelling down to individual combatants of an ancient, obscure battle.But most mysterious of all are Ryujin adventurers. Often young and still in training (for a Ryujin), their drive to seek out the wonders of the world is second to none. The pride and drive for excellence is still present but there is often an underlying goal or purpose in their traveling the world. Ryujin adventurers are often knowledgeable in history and lost knowledge and they always seem to be searching for something, an ancient item or manuscript or tome. Unless you are extremely close to a Ryujin, it is not recommended to press them on the details of their search.\u201cYou are ignorant of what stands before you.\u201dSize: Medium",
      "attributes": "Draconic Presence, Ryujin's Mastery, Dragon's Breath",
      "proficiencies": [],
      "image": "https://cdn.angelssword.com/ttrpg/assets/43fde452-f149-47d6-987a-1b391668ec02-Ryujin2.sm.webp"
    },
    {
      "id": "69ea4f7a6be32fced492fb50",
      "name": "Suryan",
      "ancestryId": "suryan",
      "description": "Suryan are a secluded sub-race of Youkai. Often described as \u201clight given form\u201d, the radiance that surrounds them is unmistakable and they are a spectacle for those who have never seen a Suryan before. Most Suryan are deeply spiritual and hold a reverence for light and its nurturing properties.Suryan villages and towns tend to be located in high mountain valleys, as close to the sun as can be managed while still able to support crops. The warm light each Suryan gives off makes their villages pleasantly welcoming and even the most inhospitable seeming locations team with trees, farms, and wildlife due to their influence. It is not uncommon to scale a frigid mountain pass only to descend into a shallow valley full of warm sunlight and green nature fully at odds with the surrounding mountains.These villages and towns often support mountaintop monasteries where Suryan monks learn and meditate on the Five Harmonies, with the first and oldest,&nbsp;Divyajyoti\u1e25 \u0100laya\u1e25, being located in a secluded section of the&nbsp;N\u0101gan\u1e5btya Parvata\u1e25 placed upon the highest peak,&nbsp;N\u012bl\u0101mbara\u015bikhara\u1e25. Five Harmonies monasteries produce revered wisdoms and graceful healers and are common pilgrimages for the wealthy and destitute alike.Suryan adventurers carry that spirituality and sense of community with them on their journeys. While not all will be mystical monks capable of weaving light into healing threads, their willingness to help even in small ways is a common behavior. A Suryan adventurer is just as comfortable clearing the wilderness of dangerous monsters as they are cheerfully helping a farmer harvest their crops. Many Suryan have been taught from a young age the basic mysticism of Five Harmonies as a guiding principle, although those born and raised outside of those mountain communities may lack that connection.Expect Suryan companions to be spiritual and compassionate to those around them.\u201cJ\u012bvana\u1e25 jyotibhi\u1e25 j\u0101yate. All life springs from light.\u201dTL Notes:N\u0101gan\u1e5btya Parvata\u1e25 - The Mountains of the Dragon DanceN\u012bl\u0101mbara\u015bikhara\u1e25 -&nbsp;The Blue-Robed Peak, in this case blue-robed is a poetic epithet for the sky.&nbsp;Divyajyoti\u1e25 \u0100laya\u1e25 - The Sanctuary of Divine LightSize: Medium",
      "attributes": "Solar Radiance, Elemental Mastery: Holy, Revealing Light",
      "proficiencies": [],
      "image": "https://cdn.angelssword.com/ttrpg/assets/a1ad5de2-177c-4bac-afe3-d5069b4e8511-Suryan.sm.webp"
    },
    {
      "id": "69ea4f7a6be32fced492fb2d",
      "name": "Tengu",
      "ancestryId": "tengu",
      "description": "Tengu are a distinguished subrace of Youkai, recognizable as humanoids adorned with majestic wings that grant them the ability to soar through the skies of Lyr. Originating from the rugged mountains of Mt. Merlin, Tengu reside alongside the dangerous Astra Line, a region teeming with chaotic astra energy and perilous creatures known as Fiends. Each Tengu possesses the unique ability to summon a supernatural mask, meticulously crafted to reflect their individual essence. When donned, these masks suppress their innate aura and presence, rendering them nearly invisible to magical detection. This ability is crucial for their survival, as it allows them to navigate the treacherous landscapes at the border of the Astra Line undetected by the ever-present threat of Fiends. Renowned as fierce warriors and specialist Fiend hunters, they have developed the technique of bathing their weapons in their own aura. &nbsp;This specialty technique creating properties similar to silver weapons to shatter Fiendish defenses. Tengu play a pivotal role in safeguarding their homeland and by proxy the homelands of others, maintaining the delicate balance between order and chaos.Despite many Tengu villages falling under the jurisdiction of Northi, the kingdom respects their autonomy, recognizing the invaluable protection Tengu provide by keeping Fiends at bay. This mutual respect fosters a harmonious relationship, with the citizens of Northi viewing the presence of Tengu as a blessing rather than a burden. Tengu society is built on principles of strength, honor, and resilience, making them ideal companions for those who seek to embody the spirit of a fierce slayer. Players who are drawn to characters that harness the power of flight, excel in combat, and specialize in hunting formidable monsters will find the Tengu subrace exceptionally rewarding. Embracing a Tengu character means stepping into the role of a vigilant protector, capable of swift aerial maneuvers and specialist knowledge of Fiends, guiding the party's path against the most evil of creatures.Size: Medium",
      "attributes": "Tengu Mask, Flight, Tengu Aura Weapon",
      "proficiencies": [],
      "image": "https://cdn.angelssword.com/ttrpg/assets/7ab01cfa-8df2-445c-a55d-716a8ca8c1f9-Tengu_New_raw.sm.webp"
    },
    {
      "id": "69ea4f7a6be32fced492fb3e",
      "name": "Yuki-Onna",
      "ancestryId": "yuki-onna",
      "description": "Yuki-Onna are an rare subrace of Youkai, exclusively female snow spirits who embody the serene yet formidable essence of winter. Primarily inhabiting the frigid regions around Mt. Merlin, the eastern fringes of Easter's forest, and the vast expanses of the Mirane Tundra, Yuki-Onna live in tightly-knit tribes that reflect their deep connection to their icy environments. These Youkai are incredibly rare outside their snowy homelands, with only those possessing powerful soul cores daring to traverse into warmer climates. In the magical sanctuary of Kirara, a sizeable population of Yuki-Onna thrives, thanks to the strong ambient magic that allows them to withstand the heat. Their presence in Kirara not only highlights their resilience but also their drive to adapt to different climates.Yuki-Onna are renowned for their mastery of cryomancy, a powerful form of magic that allows them to control and manipulate ice and snow. This mastery was exemplified by the legendary cryomancer, Mirane, who was mentored by the Tsurara tribe of Yuki-Onna in the creation of the Eternal Mirane Cage\u2014a legendary-class spell. Following the sealing of a dangerous Fiend by Mirane, Yuki-Onna played a crucial role in the subsequent expedition to eliminate the threat, showcasing their prowess as fierce warriors and reliable allies. Playing a Yuki-Onna is ideal for players who relish the roles of outsiders and travelers, embracing characters who navigate the world with grace despite its hostility. Their unique abilities and tribal heritage offer a rich narrative experience, perfect for those seeking to portray resilient and independent spirits who are unafraid to journey far from home in pursuit of their goals.Size: Medium",
      "attributes": "Chilling Cold, Absorb Ice, Icicle Nail",
      "proficiencies": [],
      "image": "https://cdn.angelssword.com/ttrpg/assets/b3f43b68-adc1-44c8-9b03-8adceecdb2d3-Yuki-Onna_raw.sm.webp"
    }
  ],
  "Fae": [
    {
      "id": "69ea4f7a6be32fced492fb49",
      "name": "Anubis",
      "ancestryId": "anubis",
      "description": "The Anubis are a unique race of Fae from the southwestern region of Telsin, known for their deep respect for life, death, and the natural order. With dark hair, bronze skin, and their unique Jackal-like ears, the Anubis see themselves as guardians of the living and the dead alike. While their own lifespans are exceptionally long, they hold a profound reverence for the brief lives of other beings, viewing them as precious gifts to be treasured even beyond death. This belief extends to the Anubis\u2019 role in mediating spiritual affairs and protecting the deceased from desecration.Renowned for their honesty and strong sense of karma, the Anubis possess an almost supernatural ability to discern lies, making them respected yet sometimes avoided as arbiters. Their ceremonial attire includes light-colored clothing, adorned with golden jewelry and polished river stones\u2014symbols of lineage often passed down or given as offerings to the deceased.Skilled at laying disturbed spirits to rest, they hold a complex relationship with necromancy, respecting it when practiced with reverence. Anubis Necromancers act as graveyard caretakers and conduct important funerary rites, roles woven into their cultural fabric and essential to their purpose across the region, which has garnered respect in spiritual circles even as far as Northi.Size: Medium",
      "attributes": "Last Rites, Weighing the Heart, Speak with dead",
      "proficiencies": [],
      "image": "https://cdn.angelssword.com/ttrpg/assets/bfaa0f98-412d-4e53-b69a-75c8093b4539-Anubis_Female_2_-_Copy.sm.webp"
    },
    {
      "id": "69ea4f7a6be32fced492fb44",
      "name": "Cait Sith",
      "ancestryId": "cait-sith",
      "description": "Cait Sith are a rare subrace of the fae, distinguished by their dual forms and elusive nature within the realm of Lyr. Originating from the lands of Avalon, Cait Sith often appear as enchanting Fae adorned with delicate cat ears atop their heads, leading many to mistake them for the more common Catfolk. However, their true versatility is revealed in their ability to assume the form of an actual cat, a transformation that many Cait Sith embrace and many stay in for most of their lives. This shapeshifting capability allows them to seamlessly integrate into various environments, particularly human dwellings, where they often masquerade as beloved house cats. Their preference for a relaxed and lounging lifestyle reflects the tranquil culture of Avalon, where comfort and leisure are highly valued. In their feline guise, Cait Sith seek out the warmth and attention of humans, enjoying the care and adoration bestowed upon them. &nbsp;Cait Sith are known to become irked when they do not receive the expected adoration, such as being left milk, leading them to orchestrate mischievous pranks on those who neglect their whims.Despite their seemingly benign and playful demeanor, Cait Sith harbor a deep-seated animosity towards their mortal enemies, the Black Dogs, also known as Cu Sith. These shapeshifting dog Fae from Sylvan share an intense mutual detest, often culminating in deadly duels that underscore the severity of their rivalry. Beyond their playful tricks, Cait Sith possess a formidable and sinister ability to manipulate the life force of weakened enemies, using this dark magic as a potent weapon to eliminate threats. This unique combination of charm and lethal power makes Cait Sith both captivating and dangerous. Players who choose Cait Sith characters have the possibility of living double lives as they pretend to be normal cats, using trickery and haunting forces to their means. &nbsp;Their intense rivalry with the Black Dogs can also make for some interesting and fun roleplaying moments.Size: Medium (when not in cat form)",
      "attributes": "Cat Form, Soul Strike, Nightvision",
      "proficiencies": [],
      "image": "https://cdn.angelssword.com/ttrpg/assets/fb8ca4ac-2b5c-4a19-a589-053a8250a5aa-Cait_Sith_raw.sm.webp"
    },
    {
      "id": "69ea4f7a6be32fced492fb54",
      "name": "Cu Sith",
      "ancestryId": "cu-sith",
      "description": "Cu Sith are a rare subrace of Fae, distinguished by their dual forms and steadfast nature. They originated from the lands of Sylvan within Easter and appear as enchanting, dogfolk-like Fae with dog ears atop their heads and emotive tails. Their true forms, however, are that of a small or medium sized dog, indistinguishable from any normal dog. This shapeshifting allows them to blend into most environments, especially areas with other races, where they sometimes take on the role of beloved pet or guardian. They can form strong bonds with others in this guise and history is full of stories of mysteriously intelligent dogs caring for their owners, rescuing children, or driving off attackers from families and villages.&nbsp;One particularly strange series of events in history involved the royal family pet of the Kingdom of Sayce. Located on the eastern edge of Northi on the shores of Sayce Lake, the small kingdom held a double dominating trade position of controlling lake and river travel in eastern Northi and also airship travel as they benefited from a major leyline running through the kingdom. Shortly before King Leonard Rune Leon of Northi began his push for unifying the entire country, the Trehaerne family colluded with the neighboring Kingdom of Eynion in an attempt to overthrow the Sayce\u2019s and take control of the Kingdom by allowing assassins to stage in their estate. If things had gone to plan, the entire Sayce family would have been wiped out and the Trehaerne\u2019s would have inherited the throne. However, in a series of unbelievable events, the Sayce family dog tripped up, foiled, uncovered, and in one account, even took up a sword in his jaws and fought off an assassin when he went directly after Princess Lowri in a furious duel. The machinations of the Trehaerne family and the Kingdom of Eynion was presented to King Leonard and justice was seen to, the Kingdom of Sayce was one of the first to join the growing movement of unification. After that event, regardless of the truth behind the more exaggerated stories, the Sayce Royal Flag has included the silhouette of that dog.Because of their loyal and dedicated nature, Cu Sith have a deep hatred toward the flighty and cruel Cait Sith. The shapeshifting cats from Avalon share this mutual detestment and this often leads to deadly duels. It is speculated that Cu Sith began to venture out into the wider world beyond Easter as a direct opposition to the Cait Sith and to protect others from being taken advantage of. The Cu Sith\u2019s haunting bark is one of their most useful tools in driving off or defeating Cait Sith and also reinforces the perception of the deep animosity between cats and dogs.Size: M",
      "attributes": "Dog Form, Haunting Bark, Scent",
      "proficiencies": [],
      "image": "https://cdn.angelssword.com/ttrpg/assets/400a6a16-e1d5-49f2-b7c9-fbe5518b8511-dog.sm.webp"
    },
    {
      "id": "69ea4f7a6be32fced492fb3d",
      "name": "Dryad",
      "ancestryId": "dryad",
      "description": "Dryads, an enchanting subrace of the Fae, are deeply intertwined with the natural world, making them rare visitors beyond the verdant expanses of their forest homes. Predominantly hailing from the enchanted woods of Easter, a select few have established their presence in the forest territories of Susururu in Northi. While urban environments are seldom their preference, some Dryads venture into cities driven by necessity or purpose, often finding solace only in their work as they navigate the concrete jungles far from their beloved woodlands. Their existence is a harmonious blend of isolation and duty, maintaining a delicate balance between their innate connection to nature and the demands of the wider world.Central to Dryad culture is the sacred tradition of planting a new tree with each birth, symbolizing a celebration of life and the enduring bond within their communities. These family groves serve as living testaments to their heritage, meticulously tended by each generation to honor their lineage and the cycle of life. Regardless of where their paths may lead, Dryads are bound by an unwavering commitment to return and pay respects to their families, reinforcing the importance of kinship and continuity. Visually, Dryads are a breathtaking embodiment of nature's diversity, adorned with green or leafy hair, plant-like or wooden skin, and an array of natural features that reflect their individual connection to the flora around them. Playing a Dryad allows one to channel the grace and resilience of the forest, bringing a profound sense of harmony and natural beauty to any adventuring party.Size: Medium",
      "attributes": "Forest Walker, Nature's Grasp",
      "proficiencies": [],
      "image": "https://cdn.angelssword.com/ttrpg/assets/788952e5-495f-453d-af58-f2ac1bba7f22-Dryad_raw.sm.webp"
    },
    {
      "id": "69ea4f7a6be32fced492fb45",
      "name": "Dullahan",
      "ancestryId": "dullahan",
      "description": "The Dullahan are a subspecies of Fae that are often shunned even from Fae society due to their association with death. Dullahan are able to subconsciously feel death and are in some way pulled towards it. For this reason, most Dullahan end up leaving the Fae society of Easter. The long lifespans of the Fae and the relative stability of their lands make deaths a rarity. Dullahan have little concept of family, and a child Dullahan matures within a year. In non-fae society, Dullahan are unjustly feared and reviled as the harbingers of death as it follows either shortly after a Dullahan appears or it appears right before a Dullahan does. Because of this, it is rare for a Dullahan to ever truly settle down in a place and even most travelling Dullahan have a way to hide their appearance. Male Dullahan often have to resort to magic, while female ones can get away with a hooded cloak and good head placement.Dullahan have two distinctively different appearances, similar to the Kanolith and Zoalith variants of Chimera's. Regardless of the variant, they share that the Dullahan is a humanoid figure that is clad almost entirely in armor. The male version of a Dullahan is commonly found without a head all together, where as the female Dullahan tends to carry a Fae head with her oftentimes carrying it in her arms. Curiously enough, this armor is normally entirely decorative and offers no more protection than normal flesh would. It is only when a Dullahan picks up a suit of armor and merges it with themselves that their armor becomes resilient.&nbsp;Dullahan adventurers are rare and viewed with mixed opinions. Some believe in the superstition that they cause death and treat it with caution. Others view their attraction to death as either a free warning sign or a hint as to where money could be found. Personality wise, Dullahans often have a rather morbid sense of humor and a nihilistic outlook on the world. They struggle to make meaningful connections but value the ones that they do.Size: Medium",
      "attributes": "Headless, Dullahan's Mount",
      "proficiencies": [],
      "image": "https://cdn.angelssword.com/ttrpg/assets/84ccb202-81d6-4830-8944-6d1dc016f5f0-Dullahan_male_1_raw.sm.webp"
    },
    {
      "id": "69ea4f7a6be32fced492fb33",
      "name": "Gnome",
      "ancestryId": "gnome",
      "description": "Gnomes, often referred to as \"mine faeries,\" are a reclusive subrace of the Fae known for their curiosity and mastery of the earth's hidden treasures. Preferring the solitude of subterranean environments, Gnomes are predominantly found throughout the foothills of Easter's Mountains, with a resilient few making their homes in the depths of Mt. Merlin in Northi. Their affinity for hunting and uncovering buried riches drives them to explore the intricate network of tunnels and caverns, where their adept burrowing skills and knowledge of the terrain set them apart from other Fae. This solitary nature fosters a culture of independence and self-reliance, as many Gnomes choose to embark on treasure hunts alone, guided by their own instincts and expertise.Equipped with the unique ability to shape their mana into formidable claws, Gnomes effortlessly carve through earth and stone, creating intricate tunnels or devising cunning pitfalls to outwit their adversaries. This magical prowess not only enhances their efficiency in excavation and exploration but also serves as a strategic advantage in defending their hard-earned treasures. Playing a Gnome means embracing a life of exploration and discovery, leveraging their resourcefulness and dexterity to navigate both the physical and magical challenges of the world. Gnome characters bring a blend of resilience, surprise, and unwavering determination to any adventuring party, making them great teammates who can create unique tactical advantages.Size: Small",
      "attributes": "Mining Expertise, Gnome Claws, Destroy Ground",
      "proficiencies": [],
      "image": "https://cdn.angelssword.com/ttrpg/assets/928c7955-ff4e-4d8c-8f43-8b5f2b520a48-Gnome_New_raw.sm.webp"
    },
    {
      "id": "69ea4f7a6be32fced492fb30",
      "name": "High Fae",
      "ancestryId": "high-fae",
      "description": "The High Fae, the most populous subrace among the Fae, are the heart of Easter's capitals. Dominating the grand cities of Avalon and Sylvan, these urban strongholds have grown into the largest metropolises in the region, attracting Fae from all corners of the world. Unlike their more reclusive kin, High Fae embrace innovation and possess an insatiable wanderlust, driving their rapid expansion and fostering a dynamic society where tradition meets progress. Despite their affinity for forming a great society, High Fae remain deeply connected to nature, seamlessly blending architectural marvels with the natural landscapes that surround them.Possessing eyes imbued with powerful arcane circuits, all Fae can create minor distortions in the minds of others, but the High Fae have honed this ability to extraordinary levels. They can manipulate the fabric of space with precision, allowing them to teleport at will, a skill that grants them unparalleled agility and strategic advantage both in daily life and in the heat of conflict. Playing a High Fae means embodying a blend of grace, ingenuity, and magical prowess, making them ideal for roles that require both creativity and tactical finesse. Their unique abilities and forward-thinking mindset enable High Fae characters to navigate complex social structures and adapt swiftly to ever-changing circumstances.Size: Medium",
      "attributes": "Lucid Sleep, Faerie Flash II",
      "proficiencies": [],
      "image": "https://cdn.angelssword.com/ttrpg/assets/d0109c79-5c10-49ac-8fcc-adb5a1e4c190-High_Fae_New_raw.sm.webp"
    },
    {
      "id": "69ea4f7a6be32fced492fb31",
      "name": "Pixie",
      "ancestryId": "pixie",
      "description": "Pixies are the diminutive subrace of the Fae, known for their delicate wings and vibrant presence within the forest canopies of Lyr. These tiny flying beings craft their homes in hollowed-out sections of ancient trees, seamlessly blending with the natural environment to remain elusive and hard to spot. Despite their small stature and physical fragility, Pixies possess incredible agility, allowing them to dart through the air with unparalleled grace. Their ability to soar above the battlefield provides them with strategic advantages, enabling them to outmaneuver larger foes and support their allies from above. Pixies embody a carefree spirit, often approaching life with a playful and lighthearted demeanor, taking challenges as they come without the weight of undue seriousness.Living primarily within Fae communities and scattered throughout the vast forests of Lyr, Pixies maintain an aloof and independent nature, preferring solitude or the company of their kin over the complexities of larger societies. However, their significance transcends their playful exterior, as evidenced by the legendary Pixie Leaflit, a member of the Hero Signum's party that triumphed over the Goddess of Evil, Heira. This historic alliance is immortalized by a statue of the party, the oldest known monument in Lyr, nestled deep within Mt. Merlin. Playing a Pixie means embracing a character that combines agility, and a spirited approach to life. &nbsp;They are perfect for players that enjoy tactical thinking and nimble movements, as they bring unwavering optimism to their allies.Size: Tiny&nbsp;",
      "attributes": "Tiny Pixie, Hover, Flight",
      "proficiencies": [],
      "image": "https://cdn.angelssword.com/ttrpg/assets/26edf9e8-1d56-404a-b1e9-1041c062d5bd-Pixie_new_raw.sm.webp"
    },
    {
      "id": "69ea4f7a6be32fced492fb36",
      "name": "Salamander",
      "ancestryId": "salamander",
      "description": "Salamanders are a proud, fiercely independent race, valuing personal strength and mastery over their innate fire magic. They are artisans at heart, channeling their elemental gifts into crafts that demand intense heat and fine control, such as metalwork, glassblowing, and the forging of enchanted items. In Sorthen, where these arts are highly respected, Salamanders have carved out a niche for themselves as master crafters, known for producing items of rare beauty and resilience.While they have a somewhat insular culture, valuing Salamander kinship and traditions, they are not unwelcoming to outsiders. In Glassteps, their primary settlement, Salamanders coexist harmoniously with Demons and other races.Salamander society places a strong emphasis on self-expression through craft. Each Salamander seeks to leave a mark on the world through their creations, which often hold personal or spiritual significance. Their apprenticeships are long and arduous, as young Salamanders must learn to temper their fiery nature and master their powers before they are considered full artisans. This mastery is symbolized by the ritual creation of a \u201cSoulforge,\u201d a unique piece of art that captures the essence of the Salamander\u2019s inner fire and serves as a testament to their skill and control.Size: MediumWinner of the 2023 Alpha Race Creation Contest (Elementals) by Sabbrewolf.",
      "attributes": "Fireball, Enduring Warmth, Consume Fire",
      "proficiencies": [],
      "image": "https://cdn.angelssword.com/ttrpg/assets/00d216aa-75f5-41e2-9738-2837cedb930a-Salamander_New_raw.sm.webp"
    },
    {
      "id": "69ea4f7a6be32fced492fb43",
      "name": "Selkie",
      "ancestryId": "selkie",
      "description": "Selkies are mesmerizing Aquatic Fae primarily found off the tranquil shores of Houkaina, where their presence enriches the vibrant merfolk society. Although relatively rare, many Selkies have become prominent members of Houkaina, contributing significantly to its cultural and magical tapestry. While a majority of Selkies cherish their seaside abodes, a notable number venture beyond the coast, establishing homes near rivers or lakes to remain close to their beloved water sources. This preference for aquatic environments underscores their deep connection to water, allowing them to seamlessly integrate into various aquatic communities and adapt to both marine and freshwater realms. Central to Selkie identity is the magic seal cloak, a precious item bestowed upon them at birth, much like the Tengu. This cloak grants Selkies the ability to transform into their elusive Seal Form, a transformation shrouded in mystery as it remains unclear whether the seal form or their humanoid appearance came first. In their Seal Form, Selkies exhibit extraordinary speed and agility underwater, making them nearly impossible to capture and allowing them to navigate the depths with unparalleled grace.A defining cultural aspect of the Selkies is the profound significance of their seal cloaks. According to longstanding oral traditions, if a person were to steal a Selkie's cloak, the Selkie is culturally obligated to marry them. Although this obligation is not enforced by law, many Selkies take this tradition seriously, fiercely protecting their sealskin cloaks from theft\u2014with many learning magic methods at an early age to summon and protect this cloak. &nbsp;Additionally, Selkies possess the innate ability to infuse water with their own mana, enabling them to manipulate it for various magical applications, which makes them exceptional Hydromancers and Cryomancers. Their early mastery of spells related to hiding and summoning their magic items further enhances their mystical prowess. Players who choose to play a Selkie character will appreciate the blend of aquatic grace and magical versatility, making Selkies ideal for those who wish to explore the freedom of the ocean and mystery of an aquatic Fae society.Size: Medium",
      "attributes": "Aquatic Fae, Seal Cloak, Aqua Drill",
      "proficiencies": [],
      "image": "https://cdn.angelssword.com/ttrpg/assets/62453f7f-970c-4675-bd26-5528477cf4ae-Selkie_1_raw.sm.webp"
    },
    {
      "id": "6a1f53686be32fced4930c30",
      "name": "Sylph",
      "ancestryId": "sylph",
      "description": "The Sylph are a subrace of Fae that are particularly blessed by the Wind. Said to have been born of the breeze that danced through the branches and leaves of Yggdrasil herself, there are no beings on Lyr that are more attuned to the wind than a Sylph. To the Sylph, the sky and the wind are their natural companions and hold all the joys and secrets of the world. Sylph villages and cities are built high in the treetops of Easter, wrapping naturally around the massive ancient trees and they rarely have any way of accessing them without flight. These villages can be uncomfortable for visitors as they sway and flex naturally with the trees they\u2019re a part of. The hovering farms are one of the many spectacles of their villages, unique vertical farmland suspended high above the forest floor and are the only place Starlight Berries can be grown, one of the most coveted fruits in Easter. With their close connection to the sky, Sylph\u2019s first developed the method to pluck stars from above as Starcallers, although they rarely used these skills for harm. Sylph Starcallers are the centerpiece for all manner of celebrations in Easter, providing a spectacle of falling starlight that not even the most elaborate fireworks displays of Kirara can rival. Sylph adventurers tend to be free spirits, enamored with exploration and discovering all the ways the wind can rush over the stones or twist through distant forests. They have long traditions of archery and agile swordsmanship and they often scoff at the proclaimed control aeromancers boast over the wind and delight in watching their supposed master of the winds fail in the face of the Blessing of Wind. Sylph companions can be trusted to be skilled and focused in their chosen profession although they can sometimes be distracted by an interesting curl of wind through the leaves. Size: Medium",
      "attributes": "Elemental Mastery: Wind, Fly, Consume Wind",
      "proficiencies": [],
      "image": "https://cdn.angelssword.com/ttrpg/assets/dc5cbccc-fb71-4454-b465-b6258cc88b36-Sylph.sm.webp"
    },
    {
      "id": "69ea4f7a6be32fced492fb4b",
      "name": "Unseelie",
      "ancestryId": "unseelie",
      "description": "The Unseelie are a feared and infamous branch of the Fae, marked by their dark complexions, dagger-thin features, and eyes that shimmer like oil in moonlight. The Unseelie dwell in eternal gloom, deep in the heart of the Eastern Forests where sunlight never reaches, and where even other Fae dare not tread.Unseelie society is one of discipline, cruelty, and control. Though they rarely harm each other, their reputation for depravity is well-earned. They take great pride in the art of suffering, perfecting pain as both punishment and expression. Captives brought into the dark woods are not killed quickly, if at all. They are kept, their torment prolonged by methods that are as surgical as they are sadistic. To the Unseelie, mercy is wasteful, and empathy is an affliction to be corrected.Despite this darkness, or perhaps because of it, Unseelie adventurers are not rare. They often leave the forest not out of exile, but ambition. In the wider world, their talents for interrogation, infiltration, and assassination find both fear and value. While some become little more than thugs or enforcers, others integrate into adventuring parties, happy to do the \"dirty work\" others shy from.&nbsp;Unseelie adventurers gravitate toward melee combat, preferring to witness an enemy\u2019s suffering from up close, though many also learn some form of healing. They typically excel at sabotage, torture, and covert operations. Unseelie also generally have no moral restrictions and will use whatever tactic ensures victory.While some Unseelie may suppress their darker instincts, most do not apologize for what they are. Those who travel with an Unseelie should always keep that in mind, lest they find themselves with a dagger in the back.\u201cDeath is not punishment. It is a mercy.\u201dSize: Medium",
      "attributes": "Darkvision (passive), Elemental Mastery: Dark, Torture Techniques",
      "proficiencies": [],
      "image": "https://cdn.angelssword.com/ttrpg/assets/21049a01-d7ca-4e0c-a793-77084ba0d948-Unseelie_-_Copy.sm.webp"
    },
    {
      "id": "69ea4f7a6be32fced492fb32",
      "name": "Willo Wisp",
      "ancestryId": "willo-wisp",
      "description": "Willo Wisps are mischievous faeries of light, known for their playful nature and enchanting presence within the forests of Lyr. Primarily nocturnal, these elusive beings possess the innate ability to emit and manipulate light, creating mesmerizing displays that captivate all who witness them. While most Willo Wisps thrive under the cover of darkness, a select few have adapted to living during the daytime, blending their luminous abilities with the natural light to remain hidden yet active. Their strong connection with Faerie Light Eyes grants them the power to weave intricate illusions, allowing them to strike at the minds of their targets and manipulate perceptions with ease. Historically, before relations between the Fae and other races improved, many adventurers who dared to explore the Eastern forests were lured to their doom by Willo Wisps. Those unfortunate souls whose eyes met the fiery blue glow of activated Faerie Light Eyes were ensnared in illusions, guiding them toward their deaths to never be seen again.Despite the legends and cautionary tales passed down through generations, Willo Wisps themselves harbor no ill will toward these prejudices; in fact, many revel in the fear and mystery surrounding them. Stories among Human and Chimera alike continue to warn children against venturing into the woods at night, lest a Willo Wisp lead them to an early demise. This enigmatic behavior adds a layer of allure and intrigue to the Willo Wisps, making them a compelling choice for players who wish to embody a race with inherent magical eye powers or embody the classic mischievous fae who delight in the fearful tales spun about them.Size: Small",
      "attributes": "Hearthlight, Hover, Faerie Eyes: Calling",
      "proficiencies": [],
      "image": "https://cdn.angelssword.com/ttrpg/assets/29b6fbd8-d105-4aa1-84cc-f07f88e993d3-willowisp_raw.sm.webp"
    }
  ],
  "Chimera": [
    {
      "id": "69ea4f7a6be32fced492fb4e",
      "name": "Bearfolk",
      "ancestryId": "bearfolk",
      "description": "Bearfolk are a proud and enduring branch of the Chimera, towering humanoids with dense fur, heavy frames, and deep, resonant voices. Most stand a head taller than the average human and carry the strength to match it, yet behind their massive build lies a quiet and thoughtful nature. Bearfolk are often the last to speak up and do so in short sentences, not speaking any more words than are necessary.Their culture prizes food, patience, community, and comfort. To a bearfolk, food shared is a sacred bond. Most live in small family holds scattered through the colder reaches of Northi. Their settlements, half-buried in snow and stone, are renowned for their hospitality.Despite their imposing nature, bearfolk often display surprising cunning. They are famous, perhaps infamous, for their uncanny ability to blend into society. Through sheer confidence or a kind of cosmic absurdity, a bearfolk in a robe and hat can convince entire villages that they are \u201cdefinitely not a bear.\u201d Scholars call this phenomenon&nbsp;Bear Shock, and no one has yet figured out how or why it works.Bearfolk have an uncomplicated and big love for food. To them, a good meal is one of life\u2019s purest pleasures and a sign of prosperity hard-earned through long winters and heavy labor. They\u2019ll eat nearly anything that fills the belly, but they have an undeniable fondness for sweets: honey, candied fruits, and rare confections that melt on the tongue. Many bearfolk adventurers quietly hoard local delicacies from the regions they visit, trading stories and bites of food with the same enthusiasm others reserve for treasure.Bearfolk adventurers are often wanderers who leave their homes to test their might or seek rare foods from distant lands. Some serve as guardians and caravan escorts, others simply follow their instincts wherever they lead. Their role in parties is usually that of a frontliner, delivering heavy blows with their paws.\u201cFull belly, calm heart.\u201dSize: M",
      "attributes": "Hibernate, Bear Shock, Bear Maul",
      "proficiencies": [],
      "image": "https://cdn.angelssword.com/ttrpg/assets/5a23f930-a766-4d5b-9221-1b542a366145-Bearfolk.sm.webp"
    },
    {
      "id": "69ea4f7a6be32fced492fb52",
      "name": "Bullfolk",
      "ancestryId": "bullfolk",
      "description": "Bullfolk are a sub-race of Chimera, native to the rolling foothills around the northern mountains of Northi. Technically the same sub-race as Cowfolk, the extreme sexual dimorphism between Bullfolk and Cowfolk make them physically and visibly distinct. While Cowfolk possess short and curvy figures, Bullfolk tower over those around them with muscular builds. However, it is only the foolish that believe the hulking stature of Bullfolk is a sign of brutish agility and intelligence, as they are quite nimble and some of the most clever architects.&nbsp;Bullfolk culture prizes bonds more than any one thing. Bonds between friends, family, and partners. If a Bullfolk offers you their honest friendship, it is a friendship they will maintain and protect fiercely. If they offer you their partnership, they will never stray. This level of devotion can be off putting to some as it is often devoid of any need or requirement for reciprocation. Sometimes, especially for those used to betrayal in their lives, it feels \u201ctoo good to be true\u201d. And many don\u2019t get the full extent of their devotion until their Bullfolk friend follows them on a harrowing journey or stands defiantly in front of a monster to protect them. But beware betraying a Bullfolk that has formed that bond with you. Because it is not your friend you will have to worry about, but their family should they ever learn about it.&nbsp;Bullfolk are often craftsmen of some kind and it is common for Bullfolk in a community to be the go-to for any construction needs. Even Bullfolk that never take up the professions of hammer, saw, and forge often have hobbies in whittling, weaving, or even painting. The most untrained Bullfolk will still have a knack for the lay of a foundation, the set of a roof, or the plane of a chair. Handmade and personal gifts are common to receive from a Bullfolk during birthdays, holidays, or special occasions.Bullfolk adventurers are almost always a friend joining someone they care for on a journey, although some simply travel from their homes for the sheer novelty of seeing the rest of the world. They are at home in the frontline, using their size and stature to guard and protect their allies with sheer mass and devastating blows.And importantly: headbutt a Bullfolk at your own risk.Male only.Size: M",
      "attributes": "Thick Skull, Goring Charge",
      "proficiencies": [],
      "image": "https://cdn.angelssword.com/ttrpg/assets/e40bff9a-b70d-4eaf-8fa8-ab03c91539fa-Bullfolk.sm.webp"
    },
    {
      "id": "69ea4f7a6be32fced492fb35",
      "name": "Catfolk",
      "ancestryId": "catfolk",
      "description": "The Catfolk, a subrace of the Chimera, are the most populous inhabitants of the world, surpassing even Humans in numbers. Predominantly hailing from the nation of Northi, their agile and instinctual nature once allowed them to dominate vast continents through swift and strategic warfare. Today, their presence is found everywhere, thriving from the enchanted Fae forests of Easter to the tranquil Kiraran Islands. This widespread distribution showcases their remarkable adaptability and resilience, enabling them to flourish in diverse environments and integrate seamlessly with various cultures.Playing a Catfolk means embodying grace, agility, and a keen survival instinct. Their heritage as former rulers and fierce warriors grants them a natural prowess in both combat and leadership, making them ideal for roles that require quick thinking and dexterity. Catfolk are fiercely independent yet deeply communal, valuing both personal achievement and the strength of their kin. Whether navigating the political landscapes of Northi\u2019s cities or exploring uncharted wilds, Catfolk characters bring a dynamic blend of tradition and innovation, resilience and adaptability, to any adventuring partySize: Medium",
      "attributes": "Nightvision, Fast Runner, Graceful Landing",
      "proficiencies": [],
      "image": "https://cdn.angelssword.com/ttrpg/assets/29021f50-7d80-438a-bd41-04fbe0167bc1-Catfolk_New_raw.sm.webp"
    },
    {
      "id": "69ea4f7a6be32fced492fb3f",
      "name": "Centaur",
      "ancestryId": "centaur",
      "description": "Centaurs, a proud subrace of the Chimera, predominantly inhabit the expansive great plains of Northi and extend into the rugged Nuren territories of Axias. Renowned for their formidable size and unmatched speed, Centaurs thrive in open landscapes where they can harness their natural agility to navigate the vast expanses effortlessly. Their preference for the untamed wilderness often keeps them apart from bustling city life, though resilient individuals can be found adapting to urban environments despite the challenges their stature presents. Centaurs live in tight-knit tribal villages, valuing strong familial bonds within their specific tribes over a unified racial identity. This tribal allegiance fosters a deep sense of loyalty and reliability, making each Centaur a steadfast ally and a formidable presence on the battlefield.Historically, Centaurs played a crucial role during the Great Divine War by joining the Susururu Rebellion, where their strength and speed were indispensable in both medical evacuation and logistical support. Their legacy as dependable warriors and medics underscores their reputation for being strong, fast, and reliable. However, a dark chapter in their history\u2014enslavement by the Catfolk as mounts\u2014has left lingering distrust towards the Catfolk, shaping their interactions and alliances in the present day. Playing a Centaur means embodying resilience and independence, drawing upon their tribal heritage to navigate both the challenges of the wild and the complexities of a world still healing from past conflicts. Centaur characters bring a unique blend of physical prowess and unwavering loyalty, making them ideal for roles that require both strength and strategic support within any adventuring party.Size: Large",
      "attributes": "Charge, Horse Body, Own Mount",
      "proficiencies": [],
      "image": "https://cdn.angelssword.com/ttrpg/assets/2d6acf01-9565-48cf-a1ab-8d43f5d3d6fe-Centaur_raw.sm.webp"
    },
    {
      "id": "69ea4f7a6be32fced492fb51",
      "name": "Cowfolk",
      "ancestryId": "cowfolk",
      "description": "Cowfolk are a sub-race of Chimera, native to the rolling foothills around the northern mountains of Northi. Technically the same sub-race as Bullfolk, the extreme sexual dimorphism between Cowfolk and Bullfolk make them physically and visibly distinct. While Bullfolk tower over those around them with muscular builds, Cowfolk possess short and curvy figures. However, it is only the foolish that believe the dainty stature of Cowfolk is a vulnerability, as they are deceptively resilient and strong for their size.Cowfolk culture prizes bonds more than any one thing. Bonds between friends, family, and partners. If a Cowfolk offers you their honest friendship, it is a friendship they will maintain and protect fiercely. If they offer you their partnership, they will never stray. This level of devotion can be off putting to some as it is often devoid of any need or requirement for reciprocation. Sometimes, especially for those used to betrayal in their lives, it feels \u201ctoo good to be true\u201d. And many don\u2019t get the full extent of their devotion until their Cowfolk friend follows them on a harrowing journey or stands defiantly in front of a monster to protect them. But beware betraying a Cowfolk that has formed that bond with you. Because it is not your friend you will have to worry about, but their family should they ever learn about it.&nbsp;When they settle in one place for long enough, Cowfolk often get incredibly domestic and there has never been an account of an uncomfortable or unwelcoming Cowfolk home. It doesn\u2019t matter if it\u2019s a home, an inn room, or a long term camp site, leave a Cowfolk in one place for long enough and you\u2019ll begin to find trinkets, warm blankets, hand made cushions, and well stocked food supplies building up over time. However, they are rarely tied down to any location and will cheerfully pack everything up or even leave things behind to continue traveling.Cowfolk adventurers are almost always a friend joining someone they care for on a journey, although some simply travel from their homes for the sheer novelty of seeing the rest of the world. They often take up frontline roles to directly support or protect their friends as a sturdy foundation of any party\u2019s composition.And most importantly: never, ever ask a Cowfolk for her milk unless you share a very, very close bond with her.Female onlySize: M",
      "attributes": "Provide Milk, Dense Frame, Ruminant Metabolism",
      "proficiencies": [],
      "image": "https://cdn.angelssword.com/ttrpg/assets/7f085395-6d99-496c-bfdc-ebd00bb52f90-cowfolk.sm.webp"
    },
    {
      "id": "69ea4f7a6be32fced492fb42",
      "name": "Dogfolk",
      "ancestryId": "dogfolk",
      "description": "Dogfolk are renowned for their unwavering culture of loyalty and honor, embodying the virtues that make them esteemed allies and steadfast companions within the realm of Lyr. Their deep-seated sense of duty often leads them to trust and support those to whom they have sworn allegiance, even in the face of betrayal. This inherent trustworthiness has, unfortunately, made Dogfolk susceptible to exploitation throughout history. Prior to the reign of King Leo of Northi, the fragmented kingdoms and city-states of the Catfolk frequently abused the Dogfolk\u2019s loyalty, coercing them into servitude and neglecting their rightful honor. King Leo's ascension marked a pivotal shift, as he championed the protection of Dogfolk rights and endeavored to eradicate the oppressive practices that had long plagued them. While Queen Renia has largely upheld King Leo\u2019s reforms, some remnants of the old abuses linger, maintaining a delicate balance of power and respect.Due to their intense culture of loyalty and honor, Dogfolk are celebrated as the finest bodyguards in all of Lyr, their dedication making them virtually impervious to bribery or betrayal. This steadfastness ensures that they remain reliable protectors, whether guarding noble estates or adventuring parties traversing treacherous landscapes. &nbsp;Those Dogfolk who do commit betrayal, are properly dealt with by their own\u2014bearing the mark of a torn or cropped ears. Players who choose to embody a Dogfolk character can expect to play roles that emphasize loyalty, protection, and honor, making them ideal for those who wish to portray loyal retainers or powerful guardians.Size: Medium",
      "attributes": "Loyalty, Guard Dog",
      "proficiencies": [],
      "image": "https://cdn.angelssword.com/ttrpg/assets/f9683abe-e632-4f5c-a8ca-68213901ecfb-Dog_Folk_1_raw.sm.webp"
    },
    {
      "id": "69ea4f7a6be32fced492fb47",
      "name": "Harpy",
      "ancestryId": "harpy",
      "description": "Harpies are a prideful race of Chimera, originally inhabiting the foothills of Mt. Merlin, where their natural command over the skies first took flight.&nbsp; Renowned for their aerial prowess, every Harpy child is given a swallow to raise as a pet, carefully studying the birds' unpredictable aerial acrobatics to hone their own flying skills.&nbsp; This early training instills young Harpies with a fierce pride and confidence in their wings, reinforcing the significance of flight to their cultural identity.&nbsp; As they mature, they become adept aerial hunters, using their keen perception and swift reflexes to hunt various hard to reach game on the sheer cliffs.In the lower elevations of their homes, the Harpy clans maintain a steady relationship with the Tengu, who dwell in the colder, snowier peaks of Mt. Merlin.&nbsp; Both groups gather periodically to train together, testing their skills in friendly competitions and forging bonds through trade.&nbsp; Because Harpies reside closer to the more accessible areas of Lyr, they are often the more visible face of this winged alliance, facilitating most interactions between the Tengu and the main population.Players that want to express skyborne freedom will find Harpies to be an ideal choice.Size: Medium",
      "attributes": "Flight, Swallow Acrobatics, Downburst",
      "proficiencies": [],
      "image": "https://cdn.angelssword.com/ttrpg/assets/99a9bd79-fb97-4298-abf9-331d6d78d652-Harpy_raw.sm.webp"
    },
    {
      "id": "69ea4f7a6be32fced492fb4d",
      "name": "Horse-Folk",
      "ancestryId": "horse-folk",
      "description": "Horse-folk are Kanolith versions of Centaurs. (Placeholder)",
      "attributes": "Horse Step Acceleration, Explosive Advance",
      "proficiencies": [],
      "image": "https://cdn.angelssword.com/ttrpg/assets/5bab2c6b-68df-49e1-827b-2bc13d44dcde-Horsefolk4tmp.sm.webp"
    },
    {
      "id": "69ea4f7a6be32fced492fb34",
      "name": "Lamiafolk",
      "ancestryId": "lamiafolk",
      "description": "Lamia are a subrace of the Chimera, native to the expansive great plains of Northi, though some communities have also established themselves within the dense forests. These graceful beings are characterized by their serpentine lower bodies, which, while imposing, present challenges in mobility within urban settings. To overcome this, many Lamia adventurers master transformative spells that allow them to adopt a more humanoid form, enhancing their versatility and adaptability in urban environments. Lamia society places immense value on family, with large family units sharing expansive homes that serve as both living spaces and communal hubs. This strong emphasis on familial bonds fosters a deep sense of loyalty and cooperation within their tribes, making Lamia individuals steadfast allies and dedicated protectors of their kin.Historically, the Lamia have forged strong alliances with Centaur tribes, cohabiting in harmonious co-species settlements such as the renowned city of Nuren in Dacquoise, Axia. During the Great Divine War, Lamia phalanxes, in tandem with Centaur flanking tactics, played a pivotal role in stalling Northi's conquest of Nuren, showcasing their exceptional prowess in melee combat. Lamia excel in close-quarters battle, utilizing their powerful tails to grapple and constrict enemies with lethal efficiency. Additionally, their coiling tactics have been employed defensively, allowing them to coil around allies in peril to shield them with their armored scales. Playing a Lamia means embracing a character of formidable strength, strategic combat skills, and unwavering dedication to family and tribe. Their unique blend of melee expertise and defensive adaptability offers players the opportunity to craft characters who are both resilient warriors and compassionate protectors, enriching any adventuring party with their dual heritage of strength and unity.Size: Large",
      "attributes": "Warm Together, Just a hug, Hug tight",
      "proficiencies": [],
      "image": "https://cdn.angelssword.com/ttrpg/assets/477ad1a6-d8f3-4910-9c69-bf03f594e82b-Lamia_New_raw.sm.webp"
    },
    {
      "id": "69ea4f7a6be32fced492fb48",
      "name": "Lizardfolk",
      "ancestryId": "lizardfolk",
      "description": "Lizardfolk are a subspecies of Chimera native to the marshes and wetlands west of Sorthen. Their settlements are built with elegant hydromantic engineering, blending magic and design to rise above the flooded terrain\u2014floating walkways, moisture-shielded libraries, and algae-filtered alchemical workshops are common. Though geographically remote, Lizardfolk settlements are self-sufficient and technologically sophisticated, designed for longevity in a land where the air hums with decay.They are visually distinct with scaled limbs, slit-pupil eyes, and long muscular tails. This has led them to claim they descend from dragons. Kobolds, who claim the same origin, often reject these assertions outright, calling them fakers, pretenders and other more hostile insults. While there are some disputes regarding their heritage, these conflicts rarely lead to anything more than name calling from both sides.By nature and culture, Lizardfolk are calm, deliberate, and slow to anger. Their society values stability, precision, and patience. Qualities that serve them well in a landscape where impulsiveness leads quickly to sinking mud or venomous fangs. Leadership is typically granted to those who demonstrate long-term vision rather than charisma, and decisions are often made after exhaustive study and debate. Artisans, scholars, and hydromancers hold great respect in their society, particularly those who contribute to the subtle shaping of their ever-changing environment.Lizardfolk adventurers are uncommon but unmistakable. Those who leave the swamps often do so with deliberate purpose, seeking knowledge, reclaiming lost relics, or testing themselves against the wider world to affirm their strength and legacy. Unlike the boastful or glory-driven, Lizardfolk adventurers tend to approach danger with methodical caution and a long-term mindset, favoring preparation over bravado. Many act as medics, scouts, or tacticians within mixed parties, relying on their natural resilience, amphibious mobility, and calm under pressure. While some companions find them difficult to read, those who earn a Lizardfolk\u2019s trust often find themselves with an unwavering ally\u2014patient, perceptive, and quietly formidable.Size: Medium",
      "attributes": "Amphibious, Prehensile Tail, Regrowing Limbs",
      "proficiencies": [],
      "image": "https://cdn.angelssword.com/ttrpg/assets/2e182663-0ab1-49ec-bebe-663abb6cbc66-sirlizard.sm.webp"
    },
    {
      "id": "69ea4f7a6be32fced492fb4a",
      "name": "Mothfolk",
      "ancestryId": "mothfolk",
      "description": "Mothfolk are a rarely seen subspecies of Chimera marked by their gossamer wings, feathery antennae, and luminous red eyes with black sclera.&nbsp;Unlike most Chimera, Mothfolk live startlingly brief lives. They mature within a few years and rarely live past forty. As a result, their society is built not on permanence, but on beauty, memory, and motion. Each generation considers itself a brief candle that is meant to burn brightly, not last forever. While they are generally gentle and introspective, their views on mortality make them eerily calm or even reckless in the face of death.Mothfolk are&nbsp;nomadic, traveling in small groups as they follow seasonal shifts, changes in ambient magic or other signs. They rarely construct permanent dwellings, preferring temporary silk-covered domes or high-hanging cocoons spun between old trees or ruin pillars.Despite their gentle demeanor, Mothfolk face&nbsp;distinct challenges. Their alien appearance, especially the more bestial Zoalith mothfolk, evokes unease in most people. There are many negative rumors and myths surrounding the mothfolk and thus the elusive mothfolk avoid interacting with others unless absolutely necessary.Mothfolk adventurers often embrace the path of a frontliner or scout. Their short lives push them to live boldly, though not always recklessly. They approach danger like a moth approaches flame: fully aware of the risk, but compelled nonetheless. Those who party with a mothfolk should restrain their impulses, or they might find themselves caught in the same inferno.\u201cBetter to burn with brilliance for a moment, than fade forgotten in stillness.\u201dSize: Small",
      "attributes": "Nightvision, Antennae, Blinding Dust",
      "proficiencies": [],
      "image": "https://cdn.angelssword.com/ttrpg/assets/6ccdabf7-a9f4-4f73-86cf-7a27674cc85f-Mothgirl.sm.webp"
    },
    {
      "id": "69ea4f7a6be32fced492fb46",
      "name": "Phoenix",
      "ancestryId": "phoenix",
      "description": "Phoenix Chimera are a rare subrace of Chimera, with only a few families known to exist within Lyr. &nbsp;Most of these families reside in the solitary heights of Mt. Merlin, where their isolation is not driven by culture or pride, but by a constant threat of danger. &nbsp;Legends speak of the miraculous healing power held within Phoenix feathers\u2014the ability to cure all sickness, including death\u2014which has made these unfortunate Chimera the prime targets for bounty hunters. &nbsp;The pursuit of esoteric medicine pushed the Phoenixfolk into hiding, making them mysterious beings when they do venture away from home. To keep themselves safe from exploitation and to increase their chances of survival, Phoenix Chimera often disguise themselves as other avianfolk Chimera, blending into different communities to avoid detection.In some of the darker corners of the world, Phoenixfolk have been kidnapped and forced into cages, their plumes and tears harvested for monetary gain. &nbsp;Taking advantage of their Fiery Rebirth, some of these captured Phoenixfolk are taken to the brink of death repeatedly to have their ashes harvested.Players who decide to play Phoenixfolk should be prepared to engage in themes of concealment and mystery, where the threat of kidnapping could be around any corner.Size: Medium",
      "attributes": "Elemental Mastery: Fire, Phoenix Tears, Fiery Rebirth",
      "proficiencies": [],
      "image": "https://cdn.angelssword.com/ttrpg/assets/2d6e53a4-9cbf-45f2-859e-787b2829f42e-Phoenix_Folk_raw.sm.webp"
    },
    {
      "id": "69ea4f7a6be32fced492fb38",
      "name": "Rabbitfolk",
      "ancestryId": "rabbitfolk",
      "description": "Rabbitfolk are a resilient subrace of the Chimera, predominantly hailing from the slums of Northi and Westria. Historically looked down on by the Catfolk, they continue to face prejudice from some older-minded individuals who view them as inferior. Rabbitfolk often have incredibly large families and very deep ties to community and to support themselves, they tend to take on less desirable jobs throughout the city. It is not uncommon for entire businesses to be run by extended families of Rabbitfolk or by joint community ventures. Due to this focus on family and community, Rabbitfolk tend to create very strong bonds with any companions they spend long periods of time with. It is not unheard of for long-time coworkers, school friends, or adventuring companions to suddenly find themselves as \u201cpart of the family\u201d and inducted into an expansive extended family. However, despite their industrious nature, persistent social stigma has driven many Rabbitfolk to seek alternative means of livelihood, sometimes turning to crime as a desperate measure to ensure their families' well-being.At the helm of Mothergreen's infamous Lorenz Mafia is Fiona MacCocairy, a determined Rabbitfolk girl who strives to bring honor to the underworld. Fiona has initiated a battle of optics, working tirelessly to clean up the Mafia and institute strict codes of honor, thereby bringing a semblance of respect and legitimacy to even their criminal trade. Her efforts highlight the tragic reality that many Rabbitfolk's involvement in crime stems from a profound desire to provide for their loved ones at any cost. Playing a Rabbitfolk is ideal for players who wish to embody characters with large, extended families, expansive communities, and explore the underworld and adverse conditions.Size: Medium",
      "attributes": "Fast Runner, Instinct, Escape Artist",
      "proficiencies": [],
      "image": "https://cdn.angelssword.com/ttrpg/assets/c6143f74-80cd-4115-a655-f48dd40d86fc-RabbitFolk_New_raw.sm.webp"
    },
    {
      "id": "69ea4f7a6be32fced492fb3b",
      "name": "Ratfolk",
      "ancestryId": "ratfolk",
      "description": "Ratfolk are a versatile subrace of the Chimera, seamlessly integrated into all walks of life throughout the vast lands of Lyr. Found all over from the bustling cities like Westria to the expansive plains of Axias, Ratfolk are renowned for their exceptional adaptability and resourcefulness. Their prehensile tails grant them unparalleled dexterity, making them adept laborers and specialists in performing a wide array of odd jobs. Whether working as carpenters in the city, or tracking down dungeons as adventurers, they can be found living their day to day lives with a sense of purpose, taking it one day at a time. Ratfolk are agile experts being incredibly hard to catch. Despite their presence in diverse environments, Ratfolk maintain a strong sense of community through large family units, though they often venture out to pursue individual endeavors, returning periodically to reunite with their kin.Playing a Ratfolk means embodying a character that excels in versatility and everyday practicality. Ideal for players who enjoy characters skilled in various tasks and adept at handling diverse challenges, Ratfolk bring a unique blend of hardworking efficiency and laid-back charm to any adventuring party. Their ability to perform multiple roles with ease makes them invaluable in both combat and non-combat scenarios, while their relaxed demeanor fosters a harmonious and approachable presence within the group. Whether taking on the role of a diligent craftsman, a cunning scout, or a dependable support character, Ratfolk offer players the opportunity to create relatable and multifaceted personas. For those seeking to portray a character that balances productivity with a relaxed, everyday person feel, Ratfolk are the perfect choice, adding practicality to an adventuring party.Size: Small",
      "attributes": "Prehensile Tail, Plaguebringer, Scurry Away",
      "proficiencies": [],
      "image": "https://cdn.angelssword.com/ttrpg/assets/e38f4317-1911-4ba0-8bdf-a28429f25370-Ratfolk_raw.sm.webp"
    },
    {
      "id": "69ea4f7a6be32fced492fb40",
      "name": "Red Pandafolk",
      "ancestryId": "red-pandafolk",
      "description": "Red Pandas are a solitary subrace of Chimera, renowned for their ability to seamlessly integrate into diverse cultures across the expansive realm of Lyr. Unlike other races that form tight-knit communities, Red Pandas prefer to forge individual paths, often immersing themselves in the societies they inhabit rather than clustering with their kin. Their aloof and relaxed demeanor masks a deep-seated competence, as they approach every task with a lightheartedness that not only enhances their own resilience but also uplifts the morale of those around them. This carefree attitude does not diminish their effectiveness; rather, it complements their exceptional agility and acrobatic prowess, making them elusive and unpredictable in both social interactions and combat scenarios.Despite their easygoing nature, Red Pandas are inherently cautious and can be easily spooked, a trait that paradoxically transforms them into formidable fighters. Their heightened awareness and instinctual fear responses enable them to navigate and survive even the most perilous situations with remarkable dexterity and strategic finesse. Those who underestimate the Red Panda's seemingly detached attitude often find themselves outmaneuvered and defeated by these slippery warriors. In gameplay, Red Pandas are ideal for players who wish to embody characters that have a \"my pace\" attitude, utilizing their acrobatic skills and evasive techniques to outsmart opponents. Embracing a Red Panda character offers a unique blend of aloof charm and combat versatility, providing both strategic advantages and a dynamic presence.Size: Medium",
      "attributes": "Panda Stance, Panda Roll",
      "proficiencies": [],
      "image": "https://cdn.angelssword.com/ttrpg/assets/f8abd986-8dfe-4084-bea4-11e4af0cf4bb-Red_Panda_raw.sm.webp"
    },
    {
      "id": "69ea4f7a6be32fced492fb55",
      "name": "Sheepfolk",
      "ancestryId": "sheepfolk",
      "description": "Sheepfolk are a sub-race of Chimera, native to the plains and lake coastline of what is now southern Axias, most sheepfolk now live in the plains area within Northi between Axias and Eisenstadt. Born with a natural sensitivity to magic, Sheepfolk have historically built settlements and migrated along major leylines. They were of critical help to sages in mapping and studying these invisible rivers of magical energy and many airship captains today feel it is good luck to have a sheepfolk on board. This deep sensitivity to magic comes from unique spirit circuits linked to their hair follicles, allowing unprecedented detection ability to magical energies and signals. Additionally, this sensitivity (and the natural talent to send magical signals as well) allows a sheepfolk to sense and smooth away the chaotic magical rhythm of physical exhaustion and mental fatigue. It\u2019s said that the best night sleep a person can get is in the arms of or resting on the lap of a sheepfolk.However, this magical sensitivity made sheepfolk uniquely useful in one very critical field: communications. With their innate ability to sense and send magical signals, they are commonly hired, trained, or conscripted into militaries. Historically, the use of sheepfolk and advancing artifice communication technology allowed Northi to dominate conflicts with accurate maneuver warfare. Only the overwhelming might of Westrian paladins and the scouting and aerial advantages of the demon aerial mages prevented Northi domination of the peninsula in full. This paradigm nearly changed radically during the Four Swords War. Sheepfolk communication specialists began utilizing new jamming artifices. Not only were these specialists key in continuing Northi\u2019s domination of communication range and quality, but they were also able to use these new tools to isolate Sorthen communication signals and adaptively jam them. This removal of critical communication ability combined with the joint strike with Westrian forces and newly implemented aeromancers finally allowed the demons to be pushed back.A major setback in the conflict drew the attention of sheepfolk after the war\u2019s conclusion. Somehow, someway, the demons had briefly established completely untraceable and secure communications between their command posts in the south and their last general in the field. This limited communication allowed the demons to organize a blocking action at the Battle of Three Passes where General Ar\u2019Golan\u2019s battalion was able to hold back the invasion for weeks, allowing the evacuation of the remaining demon forces to Marlone Bay. This feat, which suddenly failed at the end of the battle, was investigated and the work of Aetherie Lu\u2019Pana was discovered. Since the end of the war, the techniques and technology of the Aetherie has spread like a blaze through the sheepfolk communities, building on and allowing them to improve their own innate abilities to levels they\u2019d never gone before. It is commonly thought among the sheepfolk that the late Aetherie Lu\u2019Pana must have had sheepfolk help or had studied sheepfolk extensively to develop what she had.Sheepfolk adventurers are often quiet, having grown up where needing to speak up to be heard was unnecessary, and they tend to shy away from those who are loud (both in actual volume and in showing off their magical energy). They will also think it is quite normal for groups to request them to act as a communication hub, even among new parties or strangers. But their comforting embrace and comfortable dreams are only for friends.",
      "attributes": "Sweet Dreams, Highly Sensitive to Magic, Mind Connection",
      "proficiencies": [],
      "image": "https://cdn.angelssword.com/ttrpg/assets/358ecfc9-4aef-46b6-b219-0d9ab68e71a0-sheep.sm.webp"
    },
    {
      "id": "69ea4f7a6be32fced492fb37",
      "name": "Slimefolk",
      "ancestryId": "slimefolk",
      "description": "Slimefolk are a rare subrace of Chimera, tracing their lineage back to slime creatures that inhabit every corner of Lyr. Despite their gelatinous origins, Slimefolk possess a humanoid form that mirrors their unique personalities, and while this can change over time, it cannot be willingly altered without great strain and training. To better integrate into diverse societies and mitigate the unsettling responses to the nature of their true forms, many Slimefolk's first exposure to magic is a basic glamour spell, allowing them to seamlessly blend in and navigate social landscapes with ease.Highly independent by nature, Slimefolk typically do not form tight-knit communities with other Slimefolk, largely due to their rarity and solitary tendencies. While they do not possess an inherent sex, Slimefolk have developed the ability to emulate sexual characteristics to facilitate social interactions and relationships. Their exceptional ability to blend into any society means that others often perceive them as members of different, more humanoid races, unaware of their true slimy heritage. This chameleon-like quality makes Slimefolk ideal for players who wish to navigate complex social environments undetected, while also having access to unique techniques that can surprise and outmaneuver others when needed. Embracing a Slimefolk character means valuing independence and adaptability, offering both strategic advantages and a versatile role.Size: Medium",
      "attributes": "Store/Consume Item, Slime Body",
      "proficiencies": [],
      "image": "https://cdn.angelssword.com/ttrpg/assets/b98ee1c4-9982-4439-9851-9bc3e150ec9a-Slime_GIrl_New_raw_1.sm.webp"
    },
    {
      "id": "69ea4f7a6be32fced492fb3c",
      "name": "Spiderfolk",
      "ancestryId": "spiderfolk",
      "description": "Spiderfolk are a unique and industrious subrace of the Chimera, descended from ground spiders that mutated into a more humanoid direction. Their multiple arms enhance their dexterity, making them exceptional at multitasking and performing a wide array of tasks simultaneously. While they do not naturally use webs beyond utility purposes, a few Spiderfolk have trained to imbue their webs with mana, transforming them into incredibly durable tools for combat and defense.In the heart of Northi City, Spiderfolk often purchase small, seemingly uninhabitable plots of land and build their homes vertically, creating spider houses that are architectural marvels with furniture often bolted sideways into the walls. Many Spiderfolk are renowned as masterful chefs, such as Master Chef Vinia Lalune, who runs Northi's most luxurious restaurant, \"Silk And Kettle.\" Her culinary creations have earned her widespread acclaim, showcasing the Spiderfolk's exceptional multitasking abilities in the kitchen. Players who wish to embody characters skilled in object interaction and vertical gameplay, will find Spiderfolk to be an ideal choice.&nbsp;Size: Medium",
      "attributes": "Spider Climb, Extra Arms",
      "proficiencies": [],
      "image": "https://cdn.angelssword.com/ttrpg/assets/bcbd0587-bc0f-430c-9e27-fc30009a600b-Spider_Girl_1_raw.sm.webp"
    },
    {
      "id": "69ea4f7a6be32fced492fb41",
      "name": "Wolf-folk",
      "ancestryId": "wolf-folk",
      "description": "Wolf-folk are a distinguished subrace of Chimera, inhabiting the rugged snowy peaks of Mt. Merlin and extending their presence to the vast expanses of Susururu Forest, where the largest populations thrive. These resilient beings have developed a predatory instinct that enables them to meticulously hone in on and swiftly eliminate their prey, striking decisively when they detect any sign of weakness. Renowned as some of the finest hunters in the realm, Wolf-folk sustain themselves by thriving on nature's bounty, establishing and maintaining small, tightly-knit villages among their own kind. Their exceptional hunting prowess is complemented by their remarkable teamwork; Wolf-folk excel in collaborating with trusted allies, skillfully exploiting any openings their companions create to maximize their effectiveness in both combat and survival scenarios.The hunting skill of Wolf-folk is highly esteemed, particularly their animal furs, which are considered the best in the realm. These furs are meticulously prepared and sought after by merchants who journey to the remote, forested, and mountainous villages where Wolf-folk reside. The quality and durability of their furs make them invaluable commodities, enhancing the reputation of Wolf-folk artisans across Lyr. Despite their isolated habitats, the Wolf-folk maintain a robust network of trade and interaction with outside merchants, ensuring that their villages remain prosperous and their skills highly regarded. Players that want to play keen hunters who work well with others would enjoy what Wolf-folk have to offer.Size: Medium",
      "attributes": "Hunting Wolf, Pack Tactics, Scent of Blood",
      "proficiencies": [],
      "image": "https://cdn.angelssword.com/ttrpg/assets/bbc0991c-0884-48cb-8df2-5bd76ddfd8c5-Wolf_Folk_raw.sm.webp"
    }
  ],
  "Demon": [
    {
      "id": "demon-house-wi",
      "name": "House Wi",
      "ancestryId": "house-wi",
      "description": "House Wi - Saboteurs: Masters of stealth and subterfuge, the Wi are the shadow operatives of Sorthen society.",
      "attributes": "Presence Concealment",
      "proficiencies": ["Saboteur Thread Daggers"],
      "image": "https://cdn.angelssword.com/ttrpg/assets/primary_races/demon_raw.sm.webp"
    },
    {
      "id": "demon-house-lir",
      "name": "House Lir",
      "ancestryId": "house-lir",
      "description": "House Lir - Oracles: Seers and fortune-tellers who can predict and counter enemy actions on the battlefield.",
      "attributes": "Predict",
      "proficiencies": [],
      "image": "https://cdn.angelssword.com/ttrpg/assets/primary_races/demon_raw.sm.webp"
    },
    {
      "id": "demon-house-d",
      "name": "House D'",
      "ancestryId": "house-d",
      "description": "House D' - Soldiers: The frontline warriors of Sorthen, channeling raw mana into devastating attacks.",
      "attributes": "Mana Burst",
      "proficiencies": [],
      "image": "https://cdn.angelssword.com/ttrpg/assets/primary_races/demon_raw.sm.webp"
    },
    {
      "id": "demon-house-ar",
      "name": "House Ar",
      "ancestryId": "house-ar",
      "description": "House Ar - Tacticians: Strategic masters with the ability to perceive the optimal course of action in any encounter.",
      "attributes": "Mind's Eye",
      "proficiencies": [],
      "image": "https://cdn.angelssword.com/ttrpg/assets/primary_races/demon_raw.sm.webp"
    },
    {
      "id": "demon-house-lu",
      "name": "House Lu",
      "ancestryId": "house-lu",
      "description": "House Lu - Mages: Arcane specialists with dense mana pools that amplify their magical potency.",
      "attributes": "Dense Mana",
      "proficiencies": [],
      "image": "https://cdn.angelssword.com/ttrpg/assets/primary_races/demon_raw.sm.webp"
    },
    {
      "id": "demon-house-ni",
      "name": "House Ni",
      "ancestryId": "house-ni",
      "description": "House Ni - Engineers: Masters of airship technology and emergency maneuvers.",
      "attributes": "Emergency Maneuvers",
      "proficiencies": [],
      "image": "https://cdn.angelssword.com/ttrpg/assets/primary_races/demon_raw.sm.webp"
    },
    {
      "id": "demon-house-un",
      "name": "House Un",
      "ancestryId": "house-un",
      "description": "House Un - Maids and Butlers: Graceful servants who provide invaluable support to their allies.",
      "attributes": "Graceful Service",
      "proficiencies": [],
      "image": "https://cdn.angelssword.com/ttrpg/assets/primary_races/demon_raw.sm.webp"
    },
    {
      "id": "demon-house-vi",
      "name": "House Vi",
      "ancestryId": "house-vi",
      "description": "House Vi - Healers: Medical specialists with rapid response capabilities in the field.",
      "attributes": "First Response",
      "proficiencies": [],
      "image": "https://cdn.angelssword.com/ttrpg/assets/primary_races/demon_raw.sm.webp"
    },
    {
      "id": "demon-house-none",
      "name": "No Clan",
      "ancestryId": "house-none",
      "description": "Those without family skills: Demons who have stepped outside the traditional house system.",
      "attributes": "Instinct",
      "proficiencies": [],
      "image": "https://cdn.angelssword.com/ttrpg/assets/primary_races/demon_raw.sm.webp"
    }
  ]
};

const TRAIT_DESCRIPTIONS = {
  "Presence Concealment": "By suppressing your mana output you conceal your presence, gaining Presence Concealment. You cannot use any abilities that cost mana or any abilities with the aura keyword while in Presence Concealment. You can end this effect for 0 RP but the inability to use abilities that cost mana or abilities with the aura keyword persists until the end of your next turn.",
  "Predict": "You may take the Dodge action and remove the Lock On effect from the triggering attack.",
  "Mana Burst": "You augment your next attack, increasing accuracy by 3 and dealing 3 bonus damage on hit. You may use AP for this attack instead.",
  "Mind's Eye": "You may ask the GM for the rough best course of action during an encounter based on the information you have. The GM should answer truthfully, but does not need to go in depth.",
  "Dense Mana": "You augment your next ability, increasing the Potency of your next ability by 2.",
  "Emergency Maneuvers": "When you fail a check when operating an airship, you may use this to reroll the check. You must accept the new result and cannot reroll it again.",
  "Graceful Service": "You assist a target character, giving them 1 additional encounter conclusion action. This uses up your own encounter conclusion action.",
  "First Response": "If you have a Medical Kit, you may use your encounter conclusion to give the Second Wind encounter conclusion effect to someone else. You heal for an additional 1d6 when doing this.",
  "Absorb Ice": "You gain Absorb Ice, which gives you Damage Reduction 100 Frost against the triggering damage. After the damage resolves, if the caster is not you, someone allied to you or from an effect made by you or an ally, you gain Temporary HP until the end of the encounter equal to the amount of damage this ability reduces.",
  "Adaptive Defense": "You take the Block Action. You then gain 4 Adaptive Defense (Type) which grants you Damage Reduction 4 against that damage type until the end of your next turn. You can only have one instance of Adaptive Defense at a time.",
  "Amphibious": "You can swim up to your speed and can hold your breath underwater for up to an hour.",
  "Antennae": "You are able to detect creatures by sensing the vibrations in the air. You gain a +10 expertise bonus to Perception (Vibration Sense) which works up to 40ft from you, but only detects creatures.",
  "Aqua Drill": "You infuse water with your mana firing a spiraling blast of high pressure water, making a heavy attack that deals Water damage against a target within range. You can use either the RP or AP cost for the ability. The water is used as a projectile and spills anywhere within 5ft of the target at your choice. If you use an RP for this ability, the mana cost increases by 1.",
  "Aquatic Fae": "While swimming, your base movement speed becomes 30, in addition you gain Elemental Mastery: Water. Your Aqua Drill costs 0 mana when used as RP ability while in natural water.",
  "Bear Maul": "You swing your paw at the target and make a Heavy attack against it that deals maximum damage. If the target dodges, this attack automatically misses. You are considered proficient in unarmed attacks for this attack.",
  "Bear Shock": "You gain a +20 bonus to Deception checks when disguising yourself as something other than a bearfolk.",
  "Blinding Dust": "You flap your wings and blow dust in the eyes of the attacker, making them Blinded 6 until the end of their attack. If their attack against you misses, you may Sidestep 5ft.",
  "Cat Form": "You transform into cat form, reducing your Guard to 0 but increasing your Evasion by +3 and Dodge by +6. Your size is tiny and you are able to occupy the same square as an ally. While in Cat form the only attack you can make is Light Melee Attack. If you take damage in Cat Form, you immediately return to your normal form. You can dispel this form for 0 AP or 1 RP.",
  "Charge": "You may spend 2 or 4 AP on this ability and move as though you had spent that AP on movement. After you finish moving, you may spend half of the AP you used on this ability on Light, Heavy or Precise Melee Attacks.",
  "Chilling Cold": "You can emit a cooling wind within 30ft that counters the effects of most hot weather. You can enable or disable this every 1 second. In addition you gain Elemental Mastery: Frost.",
  "Consume Enemy": "You eat the body of a deceased enemy, healing you for your Toughness x 2, regaining 1 mana and preventing a single injury.",
  "Consume Fire": "You gain Consume Fire, which gives you Damage Reduction 100 Fire against the triggering damage. If the attacker is not yourself or from an effect caused by you, you can then spend 2 Mana to heal for the original damage amount, up to 100 HP.",
  "Consume Lightning": "You gain Consume Lightning, which gives you Damage Reduction 100 Lightning for the triggering damage. If you reduce damage in any way from this ability and the cause of this damage is not you or from an effect caused by you, you gain Lightning Boost. Lightning Boost grants a damage bonus on your next Lightning Elemental Attack equal to the attacker's power.",
  "Consume Wind": "You gain Consume Wind, which gives you Damage Reduction 100 Wind for the triggering damage. If you reduce damage in any way from this ability and the cause of this damage is not you or from an effect caused by you, you gain Wind Boost. Wind Boost gives you an increase to your movement speed for the next turn equal to the damage reduced by this ability.",
  "Corpse Puppetry": "You may control a corpse less than a week old within 30ft of you to perform simple actions, such as moving or talking. A corpse used this way has no combat stats and cannot attack.",
  "Darkvision (passive)": "You gain 60ft darkvision, allowing you to see perfectly in the dark even without a source of light.",
  "Dense Frame": "When you would be pushed back by an effect, you are shoved for 5ft less.",
  "Destroy Ground": "You destroy natural earth with magical speed, creating up to a 10ft x 10ft x 10ft hole in most natural earth. Those caught in the effect may spend 1 RP to Sidestep 5ft out of the effect. All caught in the effect fall down 10ft into the hole and take falling damage as normal.",
  "Dog Form": "You transform into your Dog Form, becoming a medium size dog. You lose 2 guard and 4 block, but gain a +1 Size bonus to Evasion and Dodge. While in Dog Form, you can only make melee unarmed attacks and you are considered proficient in these attacks. If you take damage in Dog Form, you immediately return to your normal form. You can dispel this form for 0 AP or 1 RP.",
  "Downburst": "You may make a Heavy Attack that deals Wind damage against the target. On damage, the target immediately plummets to the ground and takes falling damage.",
  "Draconic Presence": "You gain a +10 bonus to Negotiation and Intimidation checks against Grunts and against Heroics that have a lower Spirit Core than you.",
  "Dragon's Breath": "You exhale a devastating breath attack, making a ranged Light attack against all targets in a 30ft long 60 degree cone. This attack deals the same type of damage as your element chosen in Ryujin's Mastery.",
  "Drink to Battle": "You drink some Alcohol in preparation for a battle, granting you 1 stack of Tipsy.",
  "Dullahan's Mount": "You conjure up a black horse that becomes part of you. You immediately mount when using this ability and upon dismounting, the horse vanishes. While mounted, your movement speed is increased by 30ft and you are considered a large creature, but you may only move in a straight line.",
  "Elemental Mastery: Dark": "You gain Elemental Mastery: Dark",
  "Elemental Mastery: Fire": "You gain Elemental Mastery: Fire",
  "Elemental Mastery: Holy": "You gain Elemental Mastery: Holy",
  "Elemental Mastery: Lightning": "You gain Elemental Mastery: Lightning.",
  "Elemental Mastery: Wind": "You gain Elemental Mastery: Wind.",
  "Enduring Warmth": "You can emit comforting heat within 30feet that counters the effects of most cold weather. You can activate or deactivate this heat every 1 second.",
  "Escape Artist": "You immediately escape the grapple by twisting and kicking. May be used by spending either AP or RP.",
  "Eternal Vigil": "While in statue mode and sleeping, you make perception checks as if you were awake.",
  "Explosive Advance": "You immediately activate Horse Step Acceleration and it becomes active for the entire first round of combat. Immediately make up to 1 AP of movement actions.",
  "Extra Arms": "Your next interact with object costs 1 less AP.",
  "Fading Counter": "When the enemy attacks you in melee, they instead attack an illusionary clone, missing you. You may then immediately attack the enemy with a basic Light Melee Attack. You may then move up to 5ft in any direction and this movement does not provoke attacks of opportunity.",
  "Faerie Eyes: Calling": "You activate your Faerie Eyes, charming a target to move their Speed towards you. If your Focus is higher than the target's the target moves up to its speed towards you.",
  "Faerie Flash II": "You Teleport up to twice your Speed to an unoccupied space that you can see.",
  "Fast Runner": "Your base movement speed is 25ft instead of 20ft.",
  "Feign Death": "The first time you enter the Downed state in an encounter, you may use Play Dead as a reaction for 0 RP. In addition, you gain a +10 bonus to playing dead.",
  "Fiery Rebirth": "You regain HP until you are at 1 HP, stand up from prone and deal Light full pierce fire damage to all enemies within 5ft of you. All buffs and debuffs on you are removed. After using this ability, the mortal wound condition is removed from you and you cannot use Fiery Rebirth again for the rest of the arc.",
  "Fireball": "You hurl a Fireball at a 15x15ft area, making a Light Attack that deals Fire Damage against all units in the area.",
  "Flight": "You gain controlled Flight up to your speed. If you take damage while flying higher than 5ft above the ground, your altitude drops by 20ft.",
  "Fly": "You or the creature you touch gains Fly, which gives them controlled Flight, Hover and their movement speed is doubled while flying until the end of the encounter.",
  "Forest Walker": "You ignore difficult terrain created by vines, foliage and similar natural phenomena.",
  "Gnome Claws": "You burrow into natural earth ground, granting Burrow, making you move underground at your normal speed. While you are not attacking, you gain a +10/+20 bonus to your dodge except against other burrowed creatures.",
  "Goring Charge": "You lower your head and charge in a direction with your horns. You move X times your speed in a straight line. If you move at least 15 feet, you make a Heavy attack against the first target in your path.",
  "Graceful Landing": "You gain Graceful Landing until the start of your next turn, treating all fall distance as 50ft lower.",
  "Gravitational Ki": "You target one unit and either push them away from you 5ft or pull them towards you 5ft. Cannot move a creature or object that's bigger than 5ft and automatically fails against enemy heroic creatures.",
  "Grudge": "You curse the attacker and make a Light attack that deals Dark(Curse) damage against them.",
  "Guard Dog": "You redirect the attack towards you instead of your ally and may take the Block action against it for 0 RP. You may use this even if you're also a target of the attack and both attacks will resolve against you.",
  "Haunting Bark": "You bark at an enemy forcing them to make a Save or become shaken until the end of their next turn. The third time in a combat you use this against the same target, they also take Light Full Pierce Lightning damage.",
  "Headless": "Critical hits rolled against you do not gain Full Pierce and do not automatically deal maximum damage.",
  "Hearthlight": "You can glow, emitting a comforting light within 30 feet. You can activate or deactivate this light every 1 second.",
  "Hibernate": "When you take the rest IP action, the temporary HP gained is doubled. When you rest during the night as a rest action, you recover an additional toughness HP.",
  "Highly Sensitive to Magic": "You may enter the Aetherie class without meeting its requirements and the cost for doing so is reduced by 100 exp.",
  "Hopping Zombie": "You gain +20 to any checks that involve jumping.",
  "Horse Body": "You may carry an ally on your back without lowering your movement speed and your Burden is increased by 2. However, you are considered a large creature.",
  "Horse Step Acceleration": "You gain Horse Step Acceleration until the start of your next turn, which increases movement speed by 30. All of your movement is now Line Movement.",
  "Hover": "You can passively hover up to 5ft above the ground.",
  "Hug tight": "You deal Light Damage to the target.",
  "Hunting Wolf": "You may move towards the target as if you had spent X AP on movement. Your movement speed is doubled for this movement.",
  "Icicle Nail": "You fire a shard of ice at a target unit, making a Light Attack that deals Frost Damage. On hit, the target is Slowed until the end of their next turn.",
  "Instinct": "The first time per encounter that you are attacked by a Stealth attack, that attack does not gain the Trick Attack benefit. If you become the target of an attack while you're surprised, you may still react to it.",
  "Just a hug": "You coil and grapple a non-heroic enemy that is not larger than you, rooting both of you and rendering the target incapable of any attacks. You automatically guard against any attacks made towards the target as if using Block.",
  "Last Rites": "You deal +1 damage to undead creatures. This is increased to a +2 bonus on Heavy attacks.",
  "Lightning Weapon": "When attacking with a weapon, you may choose to have the weapon deal Lightning Damage instead of its normal damage type.",
  "Loyalty": "When standing within 5ft of a heroic ally, your Guard is increased by 1 and your Block is increased by 2.",
  "Lucid Sleep": "High Fae remain aware of their surroundings while they sleep and do not suffer from Surprised from being asleep.",
  "Mana Eater": "You cannot consume biological food and instead consume equal monetary value of Magical Fuel for sustenance. You do not need to breathe.",
  "Mind Connection": "You physically touch up to five willing people, granting them Mind Connection—creating a mind link through you. While linked, each creature can speak through telepathy to all other creatures linked to the same caster.",
  "Mining Expertise": "You may unlock the miner class for 0 EXP. You must still spend the IP on it.",
  "Nature's Grasp": "You shoot out a vine that wraps around the target and make a Light Attack against the target that only deals 1 Earth damage. On damage, the target becomes Rooted until the start of your next turn.",
  "Nightvision": "As long as there is a source of weak light (even a weak moon) you do not suffer penalties to your vision due to darkness up to 120ft.",
  "Own Mount": "You count as mounted for the purposes of abilities that require you to be mounted. This does not let you be a mount to other creatures.",
  "Pack Tactics": "Select a target within range. Until the end of your turn, while the target has one of your allies within 5ft of it, you gain a +2 bonus on accuracy checks for melee attacks against that target.",
  "Panda Roll": "You prepare to roll from an incoming attack. Your next Dodge action before the start of your next turn costs 0 RP. If you successfully avoid an attack with this Dodge action, you may Sidestep 5ft.",
  "Panda Stance": "You enter a stance in which you use your tail for extra balance. When you would be knocked back or prone, you may end this stance to negate the effect.",
  "Phoenix Tears": "At the end of combat you may use 1 Encounter Conclusion action to heal a single target other than yourself for Power and prevent one injury on them.",
  "Plaguebringer": "When you damage an enemy with a melee attack while infected with a disease or suffering from poison, you inflict that disease or poison on the enemy.",
  "Prehensile Tail": "You may carry objects with your tail, allowing you to interact with objects as normal even when you have both hands full.",
  "Provide Milk": "You may spend an EP to produce 400u worth of milk.",
  "Regrowing Limbs": "You regrow a lost limb, restoring it to full use.",
  "Revealing Light": "You clap your hands and send out a pulse of solar light in a 40ft radius around you. All creatures within that range are immediately revealed, canceling any stealth, invisibility or similar technique.",
  "Ruminant Metabolism": "You can go a day without eating before starvation applies.",
  "Ryujin's Mastery": "You gain one of Elemental Mastery of your choice from the following options: Fire, Water, Ice, Wind, Lightning, or Earth.",
  "Scent": "You gain a +5 Expertise bonus to Perception (Smell).",
  "Scent of Blood": "You sniff the air and become aware of all targets within range that have below half of their maximum HP.",
  "Scurry Away": "After using the Disengage or Feint action, your movement speed increases by 10ft until the end of your turn.",
  "Seal Cloak": "You manifest and don a seal cloak that has been with you since you were born, transforming you into your Seal Form. While in seal form you gain a swim speed of 80 feet but you can only take basic actions while in Seal Form.",
  "Slime Body": "You gain Slime Body, which gives Damage Reduction 100 against physical damage against the next attack.",
  "Solar Radiance": "You shine brightly like the sun in a 60ft radius around you. You cannot turn this off, but you can lower the range to just 5ft. This light counts as sunlight.",
  "Soul Strike": "After landing a killing blow, you can use Soul Strike once on that target. If they are still at 0 HP or less, you raise an orb of divine energy out of the target, killing them instantly. You then use that orb against a second target, making a light attack that deals dark damage.",
  "Speak with dead": "You attempt to communicate with the soul of a person who has died recently. This requires you to perform a ritual that takes an hour, that must be performed next to the corpse or where the person died.",
  "Spider Climb": "You do not suffer any penalties from moving across webs. You may climb up walls without using any tools or making any checks at half your normal movement speed.",
  "Spirited Bravado": "When you are under the effect of Tipsy, you gain +1 Power.",
  "Statue Form": "You turn yourself into a statue, petrifying yourself and the items on you. While in this mode, you gain a +5 bonus to your guard but cannot take any actions except Block.",
  "Stoneskin": "You gain Stoneskin, which grants +1 guard and +4 block, but also -2 evasion and dodge.",
  "Store/Consume Item": "You store a consumable item within your body, this item still counts towards weight limits. Without needing to equip the item, you can consume an item to gain its effects.",
  "Swallow Acrobatics": "Your next movement before the end of your turn does not provoke attacks of opportunity.",
  "Sweet Dreams": "As a rest action, you may choose an ally other than yourself to heal for 5 + Toughness after their rest has finished. Doesn't stack with Medical Kit.",
  "Tengu Aura Weapon": "Your infuse your weapons with fiend killing aura, making them equivalent to Silver weapons for the purposes of harming fiends.",
  "Tengu Mask": "You manifest and don a Tengu Mask of your desired design, granting Presence Concealment. You cannot use any mana abilities or Aura abilities while in Presence Concealment.",
  "Thermal Vision": "You can perfectly see and detect heat sources up to 120ft away, including stealthed creatures. This cannot detect things hidden by magical means.",
  "Thick Skull": "When you would get Dazed, you may make a Save against the effect even if it would normally not allow for one.",
  "Tiny Pixie": "Your size is tiny and you are able to occupy the same square as an ally or enemy. Your Toughness is reduced by 2 and your Agility is increased by 2.",
  "Tireless Undead": "Jiangshi do not know pain or fatigue. You are always counted as rested despite the most inhospitable conditions. You also do not need to sleep.",
  "Torture Techniques": "You twist the knife and inflict a debilitating wound on the enemy. You inflict one of the following conditions: Slowed, Unbalanced or Bleeding.",
  "Warm Together": 'When you have "Just A Hug" active. You and the target gain resistance to cold from environmental effects.',
  "Weighing the Heart": "You get a +5 Expertise bonus to insight checks when looking to discern if someone is lying to you."
};
