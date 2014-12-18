CREATE TABLE [dbo].[Classe] (
    [id] int  NOT NULL,
    [name] varchar(50)  NULL,
    [prof_first_level] int  NULL,
    [prof_rate] int  NULL,
    [prof_max] int  NULL,
    [SubClasse1_id] int  NULL,
    [SubClasse2_id] int  NULL,
    [SubClasse3_id] int  NULL
);
GO

CREATE TABLE [dbo].[Creature_spell] (
    [creature_id] varchar(8)  NOT NULL,
    [spell_id] varchar(8)  NOT NULL,
    [memorized] int  NULL,
    [origin] int  NULL
);
GO

CREATE TABLE [dbo].[Kit] (
    [id] int  NOT NULL,
    [name] varchar(50)  NULL,
    [abilities] varchar(8)  NULL,
    [label] varchar(200)  NULL,
    [description] varchar(4000)  NULL,
    [Classe_id] int  NULL
);
GO

CREATE TABLE [dbo].[Proficiency] (
    [id] int IDENTITY(1,1) NOT NULL,
    [name] varchar(50)  NULL,
    [effect_param2] int  NULL
);
GO

CREATE TABLE [dbo].[Entity] (
    [id] varchar(30)  NOT NULL,
    [name] varchar(100)  NULL,
    [type] varchar(8)  NOT NULL
);
GO

CREATE TABLE [dbo].[Movement] (
    [ingame] int  NOT NULL,
    [value_2nd] int  NOT NULL,
    [value_3rd] int  NULL
);
GO

CREATE TABLE [dbo].[Category] (
    [id] int  NOT NULL,
    [name] varchar(250)  NULL
);
GO

CREATE TABLE [dbo].[Item] (
    [id] varchar(8)  NOT NULL,
    [name] varchar(50)  NULL,
    [unsellable] bit  NULL,
    [twohanded] bit  NULL,
    [droppable] bit  NULL,
    [displayable] bit  NULL,
    [cursed] bit  NULL,
    [notcopyable] bit  NULL,
    [magical] bit  NULL,
    [bow] bit  NULL,
    [silverweapon] bit  NULL,
    [stolen] bit  NULL,
    [conversable] bit  NULL,
    [description] varchar(4000)  NULL,
    [coldiron] bit  NULL,
    [Category_id] int  NULL
);
GO

-- Creating table 'Slot'
CREATE TABLE [dbo].[Slot] (
    [id] int  NOT NULL,
    [name] varchar(50)  NULL
);
GO

CREATE TABLE [dbo].[Spell] (
    [id] varchar(8)  NOT NULL,
    [name] varchar(50)  NULL,
    [level] int  NULL,
    [description] varchar(4000)  NULL,
    [exclude_ChaoticPriest] bit  NULL,
    [exclude_EvilPriest] bit  NULL,
    [exclude_GoodPriest] bit  NULL,
    [exclude_GENeutralPriest] bit  NULL,
    [exclude_LawfulPriest] bit  NULL,
    [exclude_LCNeutralPriest] bit  NULL,
    [exclude_Abjurer] bit  NULL,
    [exclude_Conjurer] bit  NULL,
    [exclude_Diviner] bit  NULL,
    [exclude_Enchanter] bit  NULL,
    [exclude_Illusionist] bit  NULL,
    [exclude_Invoker] bit  NULL,
    [exclude_Necromancer] bit  NULL,
    [exclude_Transmuter] bit  NULL,
    [exclude_WildMagic] bit  NULL,
    [exclude_Unknown] bit  NULL,
    [Priest_type_id] int  NULL,
    [School_id] int  NULL,
    [Spell_type_id] int  NULL
);
GO

CREATE TABLE [dbo].[Creature_item] (
    [creature_id] varchar(8)  NOT NULL,
    [item_id] varchar(8)  NOT NULL,
    [quantity] int  NULL,
    [Slot_id] int  NULL
);
GO

CREATE TABLE [dbo].[Effect_type] (
    [id] int  NOT NULL,
    [name] varchar(200)  NULL
);
GO

CREATE TABLE [dbo].[Attack_per_round] (
    [real_apr] float  NOT NULL,
    [ingame_apr] int  NULL,
    [double_apr] bit  NULL
);
GO

CREATE TABLE [dbo].[Creature_effect] (
    [id] int IDENTITY(1,1) NOT NULL,
    [target] int  NULL,
    [power] int  NULL,
    [param1] int  NULL,
    [param2] int  NULL,
    [timing] int  NULL,
    [duration] int  NULL,
    [probability1] int  NULL,
    [probability2] int  NULL,
    [resource] varchar(8)  NULL,
    [dispel] int  NULL,
    [origin] int  NULL,
    [Creature_id] varchar(8)  NULL,
    [Effect_type_id] int  NULL
);
GO

-- Creating table 'Creature'
CREATE TABLE [dbo].[Creature] (
    [id] varchar(8)  NOT NULL,
    [name] varchar(30)  NULL,
    [experience] int  NULL,
    [level1] int  NULL,
    [level2] int  NULL,
    [level3] int  NULL,
    [caster_level] int  NULL,
    [strength] int  NULL,
    [strength_bonus] int  NULL,
    [dexterity] int  NULL,
    [constitution] int  NULL,
    [intelligence] int  NULL,
    [wisdom] int  NULL,
    [charisma] int  NULL,
    [morale] int  NULL,
    [morale_break] int  NULL,
    [current_hp] int  NULL,
    [max_hp] int  NULL,
    [hp_bonus] int  NULL,
    [armor_class] int  NULL,
    [thaco] int  NULL,
    [hide_shadow] int  NULL,
    [move_silently] int  NULL,
    [detect_illusion] int  NULL,
    [crushing_ac] int  NULL,
    [missile_ac] int  NULL,
    [piercing_ac] int  NULL,
    [slashing_ac] int  NULL,
    [resist_cold] int  NULL,
    [resist_magic_cold] int  NULL,
    [resist_fire] int  NULL,
    [resist_magic_fire] int  NULL,
    [resist_electricity] int  NULL,
    [resist_acid] int  NULL,
    [resist_magic] int  NULL,
    [resist_slashing] int  NULL,
    [resist_crushing] int  NULL,
    [resist_piercing] int  NULL,
    [resist_missile] int  NULL,
    [save_death] int  NULL,
    [save_wands] int  NULL,
    [save_poly] int  NULL,
    [save_breath] int  NULL,
    [save_spell] int  NULL,
    [movement_speed] int  NULL,
    [informations] varchar(4000)  NULL,
    [strength_3rd] int  NULL,
    [constitution_3rd] int  NULL,
    [dexterity_3rd] int  NULL,
    [class_flag] int  NULL,
    [equiped_weapon] int  NULL,
    [delete_innate] bit  NOT NULL,
    [delete_priest] bit  NOT NULL,
    [delete_wizard] bit  NOT NULL,
    [prof_lsword] int  NULL,
    [prof_ssword] int  NULL,
    [prof_bow] int  NULL,
    [prof_spear] int  NULL,
    [prof_blunt] int  NULL,
    [prof_spike] int  NULL,
    [prof_axe] int  NULL,
    [prof_missile] int  NULL,
    [set_trap] int  NULL,
    [Alignment_id] varchar(10)  NULL,
    [Allegiance_id] int  NULL,
    [Animation_id] varchar(10)  NULL,
    [Classe_id] int  NULL,
    [Class_Script_id] varchar(50)  NULL,
    [Default_Script_id] varchar(50)  NULL,
    [Gender_id] int  NULL,
    [General_id] int  NULL,
    [General_Script_id] varchar(50)  NULL,
    [Groupe_id] int  NULL,
    [Kit_id] int  NULL,
    [Monster_id] int  NULL,
    [Override_Script_id] varchar(50)  NULL,
    [Race_id] int  NULL,
    [Race_Script_id] varchar(50)  NULL,
    [Sexe_id] int  NULL,
    [Attack_per_round_real_apr] float  NULL
);
GO
