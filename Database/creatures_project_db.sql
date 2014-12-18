-- Check
-- Proficiency : effect_param2

-- --------------------------------------------------
-- Entity Designer DDL Script for SQL Server 2005, 2008, and Azure
-- --------------------------------------------------
-- Date Created: 02/05/2011 13:45:44
-- Generated from EDMX file: D:\Projects\Creatures Editor\Creatures Editor\CreaturesModel.edmx
-- --------------------------------------------------

SET QUOTED_IDENTIFIER OFF;
GO
USE [Creatures];
GO
IF SCHEMA_ID(N'dbo') IS NULL EXECUTE(N'CREATE SCHEMA [dbo]');
GO

-- --------------------------------------------------
-- Dropping existing FOREIGN KEY constraints
-- --------------------------------------------------

IF OBJECT_ID(N'[dbo].[FK__Classe__subclass1]', 'F') IS NOT NULL
    ALTER TABLE [dbo].[Classe] DROP CONSTRAINT [FK__Classe__subclass1];
GO
IF OBJECT_ID(N'[dbo].[FK__Classe__subclass2]', 'F') IS NOT NULL
    ALTER TABLE [dbo].[Classe] DROP CONSTRAINT [FK__Classe__subclass2];
GO
IF OBJECT_ID(N'[dbo].[FK__Classe__subclass3]', 'F') IS NOT NULL
    ALTER TABLE [dbo].[Classe] DROP CONSTRAINT [FK__Classe__subclass3];
GO
IF OBJECT_ID(N'[dbo].[FK__Creature__alignment_id]', 'F') IS NOT NULL
    ALTER TABLE [dbo].[Creature] DROP CONSTRAINT [FK__Creature__alignment_id];
GO
IF OBJECT_ID(N'[dbo].[FK__Creature__allegiance_id]', 'F') IS NOT NULL
    ALTER TABLE [dbo].[Creature] DROP CONSTRAINT [FK__Creature__allegiance_id];
GO
IF OBJECT_ID(N'[dbo].[FK__Creature__animation_id]', 'F') IS NOT NULL
    ALTER TABLE [dbo].[Creature] DROP CONSTRAINT [FK__Creature__animation_id];
GO
IF OBJECT_ID(N'[dbo].[FK__Creature__apr_id]', 'F') IS NOT NULL
    ALTER TABLE [dbo].[Creature] DROP CONSTRAINT [FK__Creature__apr_id];
GO
IF OBJECT_ID(N'[dbo].[FK__Creature__class_script_id]', 'F') IS NOT NULL
    ALTER TABLE [dbo].[Creature] DROP CONSTRAINT [FK__Creature__class_script_id];
GO
IF OBJECT_ID(N'[dbo].[FK__Creature__classe_id]', 'F') IS NOT NULL
    ALTER TABLE [dbo].[Creature] DROP CONSTRAINT [FK__Creature__classe_id];
GO
IF OBJECT_ID(N'[dbo].[FK__Creature__default_script_id]', 'F') IS NOT NULL
    ALTER TABLE [dbo].[Creature] DROP CONSTRAINT [FK__Creature__default_script_id];
GO
IF OBJECT_ID(N'[dbo].[FK__Creature__gender_id]', 'F') IS NOT NULL
    ALTER TABLE [dbo].[Creature] DROP CONSTRAINT [FK__Creature__gender_id];
GO
IF OBJECT_ID(N'[dbo].[FK__Creature__general_id]', 'F') IS NOT NULL
    ALTER TABLE [dbo].[Creature] DROP CONSTRAINT [FK__Creature__general_id];
GO
IF OBJECT_ID(N'[dbo].[FK__Creature__general_script_id]', 'F') IS NOT NULL
    ALTER TABLE [dbo].[Creature] DROP CONSTRAINT [FK__Creature__general_script_id];
GO
IF OBJECT_ID(N'[dbo].[FK__Creature__groupe_id]', 'F') IS NOT NULL
    ALTER TABLE [dbo].[Creature] DROP CONSTRAINT [FK__Creature__groupe_id];
GO
IF OBJECT_ID(N'[dbo].[FK__Creature__kit_id]', 'F') IS NOT NULL
    ALTER TABLE [dbo].[Creature] DROP CONSTRAINT [FK__Creature__kit_id];
GO
IF OBJECT_ID(N'[dbo].[FK__Creature__monster_id]', 'F') IS NOT NULL
    ALTER TABLE [dbo].[Creature] DROP CONSTRAINT [FK__Creature__monster_id];
GO
IF OBJECT_ID(N'[dbo].[FK__Creature__override_script_id]', 'F') IS NOT NULL
    ALTER TABLE [dbo].[Creature] DROP CONSTRAINT [FK__Creature__override_script_id];
GO
IF OBJECT_ID(N'[dbo].[FK__Creature__race_id]', 'F') IS NOT NULL
    ALTER TABLE [dbo].[Creature] DROP CONSTRAINT [FK__Creature__race_id];
GO
IF OBJECT_ID(N'[dbo].[FK__Creature__race_script_id]', 'F') IS NOT NULL
    ALTER TABLE [dbo].[Creature] DROP CONSTRAINT [FK__Creature__race_script_id];
GO
IF OBJECT_ID(N'[dbo].[FK__Creature__sexe_id]', 'F') IS NOT NULL
    ALTER TABLE [dbo].[Creature] DROP CONSTRAINT [FK__Creature__sexe_id];
GO
IF OBJECT_ID(N'[dbo].[FK__Creature_effect__creature_id]', 'F') IS NOT NULL
    ALTER TABLE [dbo].[Creature_effect] DROP CONSTRAINT [FK__Creature_effect__creature_id];
GO
IF OBJECT_ID(N'[dbo].[FK__Creature_effect__effect_type_id]', 'F') IS NOT NULL
    ALTER TABLE [dbo].[Creature_effect] DROP CONSTRAINT [FK__Creature_effect__effect_type_id];
GO
IF OBJECT_ID(N'[dbo].[FK__Creature_item__creature_id]', 'F') IS NOT NULL
    ALTER TABLE [dbo].[Creature_item] DROP CONSTRAINT [FK__Creature_item__creature_id];
GO
IF OBJECT_ID(N'[dbo].[FK__Creature_item__item_id]', 'F') IS NOT NULL
    ALTER TABLE [dbo].[Creature_item] DROP CONSTRAINT [FK__Creature_item__item_id];
GO
IF OBJECT_ID(N'[dbo].[FK__Creature_item__slot_id]', 'F') IS NOT NULL
    ALTER TABLE [dbo].[Creature_item] DROP CONSTRAINT [FK__Creature_item__slot_id];
GO
IF OBJECT_ID(N'[dbo].[FK__Creature_proficiency__creature_id]', 'F') IS NOT NULL
    ALTER TABLE [dbo].[Creature_proficiency] DROP CONSTRAINT [FK__Creature_proficiency__creature_id];
GO
IF OBJECT_ID(N'[dbo].[FK__Creature_proficiency__proficiency_id]', 'F') IS NOT NULL
    ALTER TABLE [dbo].[Creature_proficiency] DROP CONSTRAINT [FK__Creature_proficiency__proficiency_id];
GO
IF OBJECT_ID(N'[dbo].[FK__Creature_spell__creature_id]', 'F') IS NOT NULL
    ALTER TABLE [dbo].[Creature_spell] DROP CONSTRAINT [FK__Creature_spell__creature_id];
GO
IF OBJECT_ID(N'[dbo].[FK__Creature_spell__spell_id]', 'F') IS NOT NULL
    ALTER TABLE [dbo].[Creature_spell] DROP CONSTRAINT [FK__Creature_spell__spell_id];
GO
IF OBJECT_ID(N'[dbo].[FK__Item__category_id]', 'F') IS NOT NULL
    ALTER TABLE [dbo].[Item] DROP CONSTRAINT [FK__Item__category_id];
GO
IF OBJECT_ID(N'[dbo].[FK__Kit__classe_id]', 'F') IS NOT NULL
    ALTER TABLE [dbo].[Kit] DROP CONSTRAINT [FK__Kit__classe_id];
GO
IF OBJECT_ID(N'[dbo].[FK__Monster__groupe_id]', 'F') IS NOT NULL
    ALTER TABLE [dbo].[Monster] DROP CONSTRAINT [FK__Monster__groupe_id];
GO
IF OBJECT_ID(N'[dbo].[FK__Saving_throw__classe_id]', 'F') IS NOT NULL
    ALTER TABLE [dbo].[Saving_throw] DROP CONSTRAINT [FK__Saving_throw__classe_id];
GO
IF OBJECT_ID(N'[dbo].[FK__Script_child__parent_id]', 'F') IS NOT NULL
    ALTER TABLE [dbo].[Script_child] DROP CONSTRAINT [FK__Script_child__parent_id];
GO
IF OBJECT_ID(N'[dbo].[FK__Script_child__root_id]', 'F') IS NOT NULL
    ALTER TABLE [dbo].[Script_child] DROP CONSTRAINT [FK__Script_child__root_id];
GO
IF OBJECT_ID(N'[dbo].[FK__Script_child__script_id]', 'F') IS NOT NULL
    ALTER TABLE [dbo].[Script_child] DROP CONSTRAINT [FK__Script_child__script_id];
GO
IF OBJECT_ID(N'[dbo].[FK__Spell__priest_type_id]', 'F') IS NOT NULL
    ALTER TABLE [dbo].[Spell] DROP CONSTRAINT [FK__Spell__priest_type_id];
GO
IF OBJECT_ID(N'[dbo].[FK__Spell__school_id]', 'F') IS NOT NULL
    ALTER TABLE [dbo].[Spell] DROP CONSTRAINT [FK__Spell__school_id];
GO
IF OBJECT_ID(N'[dbo].[FK__Spell__spell_type_id]', 'F') IS NOT NULL
    ALTER TABLE [dbo].[Spell] DROP CONSTRAINT [FK__Spell__spell_type_id];
GO
IF OBJECT_ID(N'[dbo].[FK__Spellcast__classe_id]', 'F') IS NOT NULL
    ALTER TABLE [dbo].[Spellcast] DROP CONSTRAINT [FK__Spellcast__classe_id];
GO
IF OBJECT_ID(N'[dbo].[FK__Spellknown__classe_id]', 'F') IS NOT NULL
    ALTER TABLE [dbo].[Spellknown] DROP CONSTRAINT [FK__Spellknown__classe_id];
GO
IF OBJECT_ID(N'[dbo].[FK__Thac0__classe_id]', 'F') IS NOT NULL
    ALTER TABLE [dbo].[Thac0] DROP CONSTRAINT [FK__Thac0__classe_id];
GO

-- --------------------------------------------------
-- Dropping existing tables
-- --------------------------------------------------

IF OBJECT_ID(N'[dbo].[Alignment]', 'U') IS NOT NULL
    DROP TABLE [dbo].[Alignment];
GO
IF OBJECT_ID(N'[dbo].[Allegiance]', 'U') IS NOT NULL
    DROP TABLE [dbo].[Allegiance];
GO
IF OBJECT_ID(N'[dbo].[Animation]', 'U') IS NOT NULL
    DROP TABLE [dbo].[Animation];
GO
IF OBJECT_ID(N'[dbo].[Attack_per_round]', 'U') IS NOT NULL
    DROP TABLE [dbo].[Attack_per_round];
GO
IF OBJECT_ID(N'[dbo].[Category]', 'U') IS NOT NULL
    DROP TABLE [dbo].[Category];
GO
IF OBJECT_ID(N'[dbo].[Classe]', 'U') IS NOT NULL
    DROP TABLE [dbo].[Classe];
GO
IF OBJECT_ID(N'[dbo].[Constitution]', 'U') IS NOT NULL
    DROP TABLE [dbo].[Constitution];
GO
IF OBJECT_ID(N'[dbo].[Cre]', 'U') IS NOT NULL
    DROP TABLE [dbo].[Cre];
GO
IF OBJECT_ID(N'[dbo].[Creature]', 'U') IS NOT NULL
    DROP TABLE [dbo].[Creature];
GO
IF OBJECT_ID(N'[dbo].[Creature_effect]', 'U') IS NOT NULL
    DROP TABLE [dbo].[Creature_effect];
GO
IF OBJECT_ID(N'[dbo].[Creature_item]', 'U') IS NOT NULL
    DROP TABLE [dbo].[Creature_item];
GO
IF OBJECT_ID(N'[dbo].[Creature_proficiency]', 'U') IS NOT NULL
    DROP TABLE [dbo].[Creature_proficiency];
GO
IF OBJECT_ID(N'[dbo].[Creature_spell]', 'U') IS NOT NULL
    DROP TABLE [dbo].[Creature_spell];
GO
IF OBJECT_ID(N'[dbo].[Effect_type]', 'U') IS NOT NULL
    DROP TABLE [dbo].[Effect_type];
GO
IF OBJECT_ID(N'[dbo].[Gender]', 'U') IS NOT NULL
    DROP TABLE [dbo].[Gender];
GO
IF OBJECT_ID(N'[dbo].[General]', 'U') IS NOT NULL
    DROP TABLE [dbo].[General];
GO
IF OBJECT_ID(N'[dbo].[Groupe]', 'U') IS NOT NULL
    DROP TABLE [dbo].[Groupe];
GO
IF OBJECT_ID(N'[dbo].[Item]', 'U') IS NOT NULL
    DROP TABLE [dbo].[Item];
GO
IF OBJECT_ID(N'[dbo].[Kit]', 'U') IS NOT NULL
    DROP TABLE [dbo].[Kit];
GO
IF OBJECT_ID(N'[dbo].[Monster]', 'U') IS NOT NULL
    DROP TABLE [dbo].[Monster];
GO
IF OBJECT_ID(N'[dbo].[Movement]', 'U') IS NOT NULL
    DROP TABLE [dbo].[Movement];
GO
IF OBJECT_ID(N'[dbo].[Param]', 'U') IS NOT NULL
    DROP TABLE [dbo].[Param];
GO
IF OBJECT_ID(N'[dbo].[Priest_type]', 'U') IS NOT NULL
    DROP TABLE [dbo].[Priest_type];
GO
IF OBJECT_ID(N'[dbo].[Proficiency]', 'U') IS NOT NULL
    DROP TABLE [dbo].[Proficiency];
GO
IF OBJECT_ID(N'[dbo].[Race]', 'U') IS NOT NULL
    DROP TABLE [dbo].[Race];
GO
IF OBJECT_ID(N'[dbo].[Saving_throw]', 'U') IS NOT NULL
    DROP TABLE [dbo].[Saving_throw];
GO
IF OBJECT_ID(N'[dbo].[School]', 'U') IS NOT NULL
    DROP TABLE [dbo].[School];
GO
IF OBJECT_ID(N'[dbo].[Script]', 'U') IS NOT NULL
    DROP TABLE [dbo].[Script];
GO
IF OBJECT_ID(N'[dbo].[Script_child]', 'U') IS NOT NULL
    DROP TABLE [dbo].[Script_child];
GO
IF OBJECT_ID(N'[dbo].[Sexe]', 'U') IS NOT NULL
    DROP TABLE [dbo].[Sexe];
GO
IF OBJECT_ID(N'[dbo].[Slot]', 'U') IS NOT NULL
    DROP TABLE [dbo].[Slot];
GO
IF OBJECT_ID(N'[dbo].[Spell]', 'U') IS NOT NULL
    DROP TABLE [dbo].[Spell];
GO
IF OBJECT_ID(N'[dbo].[Spell_type]', 'U') IS NOT NULL
    DROP TABLE [dbo].[Spell_type];
GO
IF OBJECT_ID(N'[dbo].[Spellcast]', 'U') IS NOT NULL
    DROP TABLE [dbo].[Spellcast];
GO
IF OBJECT_ID(N'[dbo].[Spellknown]', 'U') IS NOT NULL
    DROP TABLE [dbo].[Spellknown];
GO
IF OBJECT_ID(N'[dbo].[Strength]', 'U') IS NOT NULL
    DROP TABLE [dbo].[Strength];
GO
IF OBJECT_ID(N'[dbo].[Thac0]', 'U') IS NOT NULL
    DROP TABLE [dbo].[Thac0];
GO
IF OBJECT_ID(N'[dbo].[Wisdom_SpellBonus]', 'U') IS NOT NULL
    DROP TABLE [dbo].[Wisdom_SpellBonus];
GO
IF OBJECT_ID(N'[CreaturesModelStoreContainer].[Entity]', 'U') IS NOT NULL
    DROP TABLE [CreaturesModelStoreContainer].[Entity];
GO

-- --------------------------------------------------
-- Creating all tables
-- --------------------------------------------------

-- Creating table 'Alignment'
CREATE TABLE [dbo].[Alignment] (
    [id] varchar(10)  NOT NULL,
    [name] varchar(50)  NULL
);
GO

-- Creating table 'Allegiance'
CREATE TABLE [dbo].[Allegiance] (
    [id] int  NOT NULL,
    [name] varchar(50)  NULL
);
GO

-- Creating table 'Animation'
CREATE TABLE [dbo].[Animation] (
    [id] varchar(10)  NOT NULL,
    [name] varchar(50)  NULL
);
GO

-- Creating table 'Classe'
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

-- Creating table 'Constitution'
CREATE TABLE [dbo].[Constitution] (
    [value] int  NOT NULL,
    [hp_bonus] int  NULL
);
GO

-- Creating table 'Cre'
CREATE TABLE [dbo].[Cre] (
    [id] varchar(8)  NOT NULL,
    [name] varchar(250)  NULL
);
GO

-- Creating table 'Creature_proficiency'
CREATE TABLE [dbo].[Creature_proficiency] (
    [creature_id] varchar(8)  NOT NULL,
    [proficiency_id] int  NOT NULL,
    [star] tinyint  NULL
);
GO

-- Creating table 'Creature_spell'
CREATE TABLE [dbo].[Creature_spell] (
    [creature_id] varchar(8)  NOT NULL,
    [spell_id] varchar(8)  NOT NULL,
    [memorized] int  NULL,
    [origin] int  NULL
);
GO

-- Creating table 'Gender'
CREATE TABLE [dbo].[Gender] (
    [id] int  NOT NULL,
    [name] varchar(50)  NULL
);
GO

-- Creating table 'General'
CREATE TABLE [dbo].[General] (
    [id] int  NOT NULL,
    [name] varchar(50)  NULL
);
GO

-- Creating table 'Groupe'
CREATE TABLE [dbo].[Groupe] (
    [id] int IDENTITY(1,1) NOT NULL,
    [name] varchar(100)  NULL,
    [location] varchar(100)  NULL
);
GO

-- Creating table 'Kit'
CREATE TABLE [dbo].[Kit] (
    [id] int  NOT NULL,
    [name] varchar(50)  NULL,
    [abilities] varchar(8)  NULL,
    [label] varchar(200)  NULL,
    [description] varchar(4000)  NULL,
    [Classe_id] int  NULL
);
GO

-- Creating table 'Monster'
CREATE TABLE [dbo].[Monster] (
    [id] int IDENTITY(1,1) NOT NULL,
    [name] varchar(50)  NULL,
    [Groupe_id] int  NULL
);
GO

-- Creating table 'Param'
CREATE TABLE [dbo].[Param] (
    [name] varchar(30)  NOT NULL,
    [value] varchar(255)  NULL
);
GO

-- Creating table 'Priest_type'
CREATE TABLE [dbo].[Priest_type] (
    [id] int  NOT NULL,
    [name] varchar(50)  NULL
);
GO

-- Creating table 'Proficiency'
CREATE TABLE [dbo].[Proficiency] (
    [id] int IDENTITY(1,1) NOT NULL,
    [name] varchar(50)  NULL,
    [effect_param2] int  NULL
);
GO

-- Creating table 'Race'
CREATE TABLE [dbo].[Race] (
    [id] int  NOT NULL,
    [name] varchar(50)  NULL
);
GO

-- Creating table 'Saving_throw'
CREATE TABLE [dbo].[Saving_throw] (
    [classe_id] int  NOT NULL,
    [type] varchar(10)  NOT NULL,
    [level] int  NOT NULL,
    [value] int  NULL
);
GO

-- Creating table 'School'
CREATE TABLE [dbo].[School] (
    [id] int  NOT NULL,
    [name] varchar(50)  NULL
);
GO

-- Creating table 'Script'
CREATE TABLE [dbo].[Script] (
    [id] varchar(50)  NOT NULL,
    [description] varchar(100)  NULL
);
GO

-- Creating table 'Script_child'
CREATE TABLE [dbo].[Script_child] (
    [script_id] varchar(50)  NOT NULL,
    [parent_id] varchar(50)  NOT NULL,
    [root_id] varchar(50)  NOT NULL,
    [num_order] int  NULL
);
GO

-- Creating table 'Sexe'
CREATE TABLE [dbo].[Sexe] (
    [id] int  NOT NULL,
    [name] varchar(50)  NULL
);
GO

-- Creating table 'Spell_type'
CREATE TABLE [dbo].[Spell_type] (
    [id] int  NOT NULL,
    [name] varchar(50)  NULL
);
GO

-- Creating table 'Spellcast'
CREATE TABLE [dbo].[Spellcast] (
    [classe_id] int  NOT NULL,
    [level] int  NOT NULL,
    [spell_level] int  NOT NULL,
    [spell_count] int  NOT NULL
);
GO

-- Creating table 'Spellknown'
CREATE TABLE [dbo].[Spellknown] (
    [classe_id] int  NOT NULL,
    [level] int  NOT NULL,
    [spell_level] int  NOT NULL,
    [spell_count] int  NOT NULL
);
GO

-- Creating table 'Strength'
CREATE TABLE [dbo].[Strength] (
    [value_2nd] int  NULL,
    [exc] int  NULL,
    [value_3rd] int  NOT NULL
);
GO

-- Creating table 'Thac0'
CREATE TABLE [dbo].[Thac0] (
    [classe_id] int  NOT NULL,
    [level] int  NOT NULL,
    [value] int  NOT NULL
);
GO

-- Creating table 'Wisdom_SpellBonus'
CREATE TABLE [dbo].[Wisdom_SpellBonus] (
    [value] int  NOT NULL,
    [level1] int  NULL,
    [level2] int  NULL,
    [level3] int  NULL,
    [level4] int  NULL,
    [level5] int  NULL,
    [level6] int  NULL,
    [level7] int  NULL
);
GO

-- Creating table 'Movement'
CREATE TABLE [dbo].[Movement] (
    [ingame] int  NOT NULL,
    [value_2nd] int  NOT NULL,
    [value_3rd] int  NULL
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

-- Creating table 'Category'
CREATE TABLE [dbo].[Category] (
    [id] int  NOT NULL,
    [name] varchar(250)  NULL
);
GO

-- Creating table 'Item'
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

-- Creating table 'Spell'
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

-- Creating table 'Creature_item'
CREATE TABLE [dbo].[Creature_item] (
    [creature_id] varchar(8)  NOT NULL,
    [item_id] varchar(8)  NOT NULL,
    [quantity] int  NULL,
    [Slot_id] int  NULL
);
GO

-- Creating table 'Effect_type'
CREATE TABLE [dbo].[Effect_type] (
    [id] int  NOT NULL,
    [name] varchar(200)  NULL
);
GO

-- Creating table 'Attack_per_round'
CREATE TABLE [dbo].[Attack_per_round] (
    [real_apr] float  NOT NULL,
    [ingame_apr] int  NULL,
    [double_apr] bit  NULL
);
GO

-- Creating table 'Creature_effect'
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

-- --------------------------------------------------
-- Creating all PRIMARY KEY constraints
-- --------------------------------------------------

-- Creating primary key on [id] in table 'Alignment'
ALTER TABLE [dbo].[Alignment]
ADD CONSTRAINT [PK_Alignment]
    PRIMARY KEY CLUSTERED ([id] ASC);
GO

-- Creating primary key on [id] in table 'Allegiance'
ALTER TABLE [dbo].[Allegiance]
ADD CONSTRAINT [PK_Allegiance]
    PRIMARY KEY CLUSTERED ([id] ASC);
GO

-- Creating primary key on [id] in table 'Animation'
ALTER TABLE [dbo].[Animation]
ADD CONSTRAINT [PK_Animation]
    PRIMARY KEY CLUSTERED ([id] ASC);
GO

-- Creating primary key on [id] in table 'Classe'
ALTER TABLE [dbo].[Classe]
ADD CONSTRAINT [PK_Classe]
    PRIMARY KEY CLUSTERED ([id] ASC);
GO

-- Creating primary key on [value] in table 'Constitution'
ALTER TABLE [dbo].[Constitution]
ADD CONSTRAINT [PK_Constitution]
    PRIMARY KEY CLUSTERED ([value] ASC);
GO

-- Creating primary key on [id] in table 'Cre'
ALTER TABLE [dbo].[Cre]
ADD CONSTRAINT [PK_Cre]
    PRIMARY KEY CLUSTERED ([id] ASC);
GO

-- Creating primary key on [creature_id], [proficiency_id] in table 'Creature_proficiency'
ALTER TABLE [dbo].[Creature_proficiency]
ADD CONSTRAINT [PK_Creature_proficiency]
    PRIMARY KEY CLUSTERED ([creature_id], [proficiency_id] ASC);
GO

-- Creating primary key on [creature_id], [spell_id] in table 'Creature_spell'
ALTER TABLE [dbo].[Creature_spell]
ADD CONSTRAINT [PK_Creature_spell]
    PRIMARY KEY CLUSTERED ([creature_id], [spell_id] ASC);
GO

-- Creating primary key on [id] in table 'Gender'
ALTER TABLE [dbo].[Gender]
ADD CONSTRAINT [PK_Gender]
    PRIMARY KEY CLUSTERED ([id] ASC);
GO

-- Creating primary key on [id] in table 'General'
ALTER TABLE [dbo].[General]
ADD CONSTRAINT [PK_General]
    PRIMARY KEY CLUSTERED ([id] ASC);
GO

-- Creating primary key on [id] in table 'Groupe'
ALTER TABLE [dbo].[Groupe]
ADD CONSTRAINT [PK_Groupe]
    PRIMARY KEY CLUSTERED ([id] ASC);
GO

-- Creating primary key on [id] in table 'Kit'
ALTER TABLE [dbo].[Kit]
ADD CONSTRAINT [PK_Kit]
    PRIMARY KEY CLUSTERED ([id] ASC);
GO

-- Creating primary key on [id] in table 'Monster'
ALTER TABLE [dbo].[Monster]
ADD CONSTRAINT [PK_Monster]
    PRIMARY KEY CLUSTERED ([id] ASC);
GO

-- Creating primary key on [name] in table 'Param'
ALTER TABLE [dbo].[Param]
ADD CONSTRAINT [PK_Param]
    PRIMARY KEY CLUSTERED ([name] ASC);
GO

-- Creating primary key on [id] in table 'Priest_type'
ALTER TABLE [dbo].[Priest_type]
ADD CONSTRAINT [PK_Priest_type]
    PRIMARY KEY CLUSTERED ([id] ASC);
GO

-- Creating primary key on [id] in table 'Proficiency'
ALTER TABLE [dbo].[Proficiency]
ADD CONSTRAINT [PK_Proficiency]
    PRIMARY KEY CLUSTERED ([id] ASC);
GO

-- Creating primary key on [id] in table 'Race'
ALTER TABLE [dbo].[Race]
ADD CONSTRAINT [PK_Race]
    PRIMARY KEY CLUSTERED ([id] ASC);
GO

-- Creating primary key on [classe_id], [type], [level] in table 'Saving_throw'
ALTER TABLE [dbo].[Saving_throw]
ADD CONSTRAINT [PK_Saving_throw]
    PRIMARY KEY CLUSTERED ([classe_id], [type], [level] ASC);
GO

-- Creating primary key on [id] in table 'School'
ALTER TABLE [dbo].[School]
ADD CONSTRAINT [PK_School]
    PRIMARY KEY CLUSTERED ([id] ASC);
GO

-- Creating primary key on [id] in table 'Script'
ALTER TABLE [dbo].[Script]
ADD CONSTRAINT [PK_Script]
    PRIMARY KEY CLUSTERED ([id] ASC);
GO

-- Creating primary key on [script_id], [parent_id], [root_id] in table 'Script_child'
ALTER TABLE [dbo].[Script_child]
ADD CONSTRAINT [PK_Script_child]
    PRIMARY KEY CLUSTERED ([script_id], [parent_id], [root_id] ASC);
GO

-- Creating primary key on [id] in table 'Sexe'
ALTER TABLE [dbo].[Sexe]
ADD CONSTRAINT [PK_Sexe]
    PRIMARY KEY CLUSTERED ([id] ASC);
GO

-- Creating primary key on [id] in table 'Spell_type'
ALTER TABLE [dbo].[Spell_type]
ADD CONSTRAINT [PK_Spell_type]
    PRIMARY KEY CLUSTERED ([id] ASC);
GO

-- Creating primary key on [classe_id], [level], [spell_level] in table 'Spellcast'
ALTER TABLE [dbo].[Spellcast]
ADD CONSTRAINT [PK_Spellcast]
    PRIMARY KEY CLUSTERED ([classe_id], [level], [spell_level] ASC);
GO

-- Creating primary key on [classe_id], [level], [spell_level] in table 'Spellknown'
ALTER TABLE [dbo].[Spellknown]
ADD CONSTRAINT [PK_Spellknown]
    PRIMARY KEY CLUSTERED ([classe_id], [level], [spell_level] ASC);
GO

-- Creating primary key on [value_3rd] in table 'Strength'
ALTER TABLE [dbo].[Strength]
ADD CONSTRAINT [PK_Strength]
    PRIMARY KEY CLUSTERED ([value_3rd] ASC);
GO

-- Creating primary key on [classe_id], [level] in table 'Thac0'
ALTER TABLE [dbo].[Thac0]
ADD CONSTRAINT [PK_Thac0]
    PRIMARY KEY CLUSTERED ([classe_id], [level] ASC);
GO

-- Creating primary key on [value] in table 'Wisdom_SpellBonus'
ALTER TABLE [dbo].[Wisdom_SpellBonus]
ADD CONSTRAINT [PK_Wisdom_SpellBonus]
    PRIMARY KEY CLUSTERED ([value] ASC);
GO

-- Creating primary key on [type], [id] in table 'Entity'
ALTER TABLE [dbo].[Entity]
ADD CONSTRAINT [PK_Entity]
    PRIMARY KEY CLUSTERED ([type], [id] ASC);
GO

-- Creating primary key on [value_2nd] in table 'Movement'
ALTER TABLE [dbo].[Movement]
ADD CONSTRAINT [PK_Movement]
    PRIMARY KEY CLUSTERED ([value_2nd] ASC);
GO

-- Creating primary key on [id] in table 'Creature'
ALTER TABLE [dbo].[Creature]
ADD CONSTRAINT [PK_Creature]
    PRIMARY KEY CLUSTERED ([id] ASC);
GO

-- Creating primary key on [id] in table 'Category'
ALTER TABLE [dbo].[Category]
ADD CONSTRAINT [PK_Category]
    PRIMARY KEY CLUSTERED ([id] ASC);
GO

-- Creating primary key on [id] in table 'Item'
ALTER TABLE [dbo].[Item]
ADD CONSTRAINT [PK_Item]
    PRIMARY KEY CLUSTERED ([id] ASC);
GO

-- Creating primary key on [id] in table 'Slot'
ALTER TABLE [dbo].[Slot]
ADD CONSTRAINT [PK_Slot]
    PRIMARY KEY CLUSTERED ([id] ASC);
GO

-- Creating primary key on [id] in table 'Spell'
ALTER TABLE [dbo].[Spell]
ADD CONSTRAINT [PK_Spell]
    PRIMARY KEY CLUSTERED ([id] ASC);
GO

-- Creating primary key on [creature_id], [item_id] in table 'Creature_item'
ALTER TABLE [dbo].[Creature_item]
ADD CONSTRAINT [PK_Creature_item]
    PRIMARY KEY CLUSTERED ([creature_id], [item_id] ASC);
GO

-- Creating primary key on [id] in table 'Effect_type'
ALTER TABLE [dbo].[Effect_type]
ADD CONSTRAINT [PK_Effect_type]
    PRIMARY KEY CLUSTERED ([id] ASC);
GO

-- Creating primary key on [real_apr] in table 'Attack_per_round'
ALTER TABLE [dbo].[Attack_per_round]
ADD CONSTRAINT [PK_Attack_per_round]
    PRIMARY KEY CLUSTERED ([real_apr] ASC);
GO

-- Creating primary key on [id] in table 'Creature_effect'
ALTER TABLE [dbo].[Creature_effect]
ADD CONSTRAINT [PK_Creature_effect]
    PRIMARY KEY CLUSTERED ([id] ASC);
GO

-- --------------------------------------------------
-- Creating all FOREIGN KEY constraints
-- --------------------------------------------------

-- Creating foreign key on [SubClasse1_id] in table 'Classe'
ALTER TABLE [dbo].[Classe]
ADD CONSTRAINT [FK__Classe__subclass1]
    FOREIGN KEY ([SubClasse1_id])
    REFERENCES [dbo].[Classe]
        ([id])
    ON DELETE NO ACTION ON UPDATE NO ACTION;

-- Creating non-clustered index for FOREIGN KEY 'FK__Classe__subclass1'
CREATE INDEX [IX_FK__Classe__subclass1]
ON [dbo].[Classe]
    ([SubClasse1_id]);
GO

-- Creating foreign key on [SubClasse2_id] in table 'Classe'
ALTER TABLE [dbo].[Classe]
ADD CONSTRAINT [FK__Classe__subclass2]
    FOREIGN KEY ([SubClasse2_id])
    REFERENCES [dbo].[Classe]
        ([id])
    ON DELETE NO ACTION ON UPDATE NO ACTION;

-- Creating non-clustered index for FOREIGN KEY 'FK__Classe__subclass2'
CREATE INDEX [IX_FK__Classe__subclass2]
ON [dbo].[Classe]
    ([SubClasse2_id]);
GO

-- Creating foreign key on [SubClasse3_id] in table 'Classe'
ALTER TABLE [dbo].[Classe]
ADD CONSTRAINT [FK__Classe__subclass3]
    FOREIGN KEY ([SubClasse3_id])
    REFERENCES [dbo].[Classe]
        ([id])
    ON DELETE NO ACTION ON UPDATE NO ACTION;

-- Creating non-clustered index for FOREIGN KEY 'FK__Classe__subclass3'
CREATE INDEX [IX_FK__Classe__subclass3]
ON [dbo].[Classe]
    ([SubClasse3_id]);
GO

-- Creating foreign key on [Classe_id] in table 'Kit'
ALTER TABLE [dbo].[Kit]
ADD CONSTRAINT [FK__Kit__classe_id]
    FOREIGN KEY ([Classe_id])
    REFERENCES [dbo].[Classe]
        ([id])
    ON DELETE NO ACTION ON UPDATE NO ACTION;

-- Creating non-clustered index for FOREIGN KEY 'FK__Kit__classe_id'
CREATE INDEX [IX_FK__Kit__classe_id]
ON [dbo].[Kit]
    ([Classe_id]);
GO

-- Creating foreign key on [classe_id] in table 'Saving_throw'
ALTER TABLE [dbo].[Saving_throw]
ADD CONSTRAINT [FK__Saving_throw__classe_id]
    FOREIGN KEY ([classe_id])
    REFERENCES [dbo].[Classe]
        ([id])
    ON DELETE NO ACTION ON UPDATE NO ACTION;
GO

-- Creating foreign key on [classe_id] in table 'Spellcast'
ALTER TABLE [dbo].[Spellcast]
ADD CONSTRAINT [FK__Spellcast__classe_id]
    FOREIGN KEY ([classe_id])
    REFERENCES [dbo].[Classe]
        ([id])
    ON DELETE NO ACTION ON UPDATE NO ACTION;
GO

-- Creating foreign key on [classe_id] in table 'Spellknown'
ALTER TABLE [dbo].[Spellknown]
ADD CONSTRAINT [FK__Spellknown__classe_id]
    FOREIGN KEY ([classe_id])
    REFERENCES [dbo].[Classe]
        ([id])
    ON DELETE NO ACTION ON UPDATE NO ACTION;
GO

-- Creating foreign key on [classe_id] in table 'Thac0'
ALTER TABLE [dbo].[Thac0]
ADD CONSTRAINT [FK__Thac0__classe_id]
    FOREIGN KEY ([classe_id])
    REFERENCES [dbo].[Classe]
        ([id])
    ON DELETE NO ACTION ON UPDATE NO ACTION;
GO

-- Creating foreign key on [proficiency_id] in table 'Creature_proficiency'
ALTER TABLE [dbo].[Creature_proficiency]
ADD CONSTRAINT [FK__Creature_proficiency__proficiency_id]
    FOREIGN KEY ([proficiency_id])
    REFERENCES [dbo].[Proficiency]
        ([id])
    ON DELETE NO ACTION ON UPDATE NO ACTION;

-- Creating non-clustered index for FOREIGN KEY 'FK__Creature_proficiency__proficiency_id'
CREATE INDEX [IX_FK__Creature_proficiency__proficiency_id]
ON [dbo].[Creature_proficiency]
    ([proficiency_id]);
GO

-- Creating foreign key on [Groupe_id] in table 'Monster'
ALTER TABLE [dbo].[Monster]
ADD CONSTRAINT [FK__Monster__groupe_id]
    FOREIGN KEY ([Groupe_id])
    REFERENCES [dbo].[Groupe]
        ([id])
    ON DELETE NO ACTION ON UPDATE NO ACTION;

-- Creating non-clustered index for FOREIGN KEY 'FK__Monster__groupe_id'
CREATE INDEX [IX_FK__Monster__groupe_id]
ON [dbo].[Monster]
    ([Groupe_id]);
GO

-- Creating foreign key on [parent_id] in table 'Script_child'
ALTER TABLE [dbo].[Script_child]
ADD CONSTRAINT [FK__Script_child__parent_id]
    FOREIGN KEY ([parent_id])
    REFERENCES [dbo].[Script]
        ([id])
    ON DELETE NO ACTION ON UPDATE NO ACTION;

-- Creating non-clustered index for FOREIGN KEY 'FK__Script_child__parent_id'
CREATE INDEX [IX_FK__Script_child__parent_id]
ON [dbo].[Script_child]
    ([parent_id]);
GO

-- Creating foreign key on [root_id] in table 'Script_child'
ALTER TABLE [dbo].[Script_child]
ADD CONSTRAINT [FK__Script_child__root_id]
    FOREIGN KEY ([root_id])
    REFERENCES [dbo].[Script]
        ([id])
    ON DELETE NO ACTION ON UPDATE NO ACTION;

-- Creating non-clustered index for FOREIGN KEY 'FK__Script_child__root_id'
CREATE INDEX [IX_FK__Script_child__root_id]
ON [dbo].[Script_child]
    ([root_id]);
GO

-- Creating foreign key on [script_id] in table 'Script_child'
ALTER TABLE [dbo].[Script_child]
ADD CONSTRAINT [FK__Script_child__script_id]
    FOREIGN KEY ([script_id])
    REFERENCES [dbo].[Script]
        ([id])
    ON DELETE NO ACTION ON UPDATE NO ACTION;
GO

-- Creating foreign key on [Alignment_id] in table 'Creature'
ALTER TABLE [dbo].[Creature]
ADD CONSTRAINT [FK__Creature__alignment_id]
    FOREIGN KEY ([Alignment_id])
    REFERENCES [dbo].[Alignment]
        ([id])
    ON DELETE NO ACTION ON UPDATE NO ACTION;

-- Creating non-clustered index for FOREIGN KEY 'FK__Creature__alignment_id'
CREATE INDEX [IX_FK__Creature__alignment_id]
ON [dbo].[Creature]
    ([Alignment_id]);
GO

-- Creating foreign key on [Allegiance_id] in table 'Creature'
ALTER TABLE [dbo].[Creature]
ADD CONSTRAINT [FK__Creature__allegiance_id]
    FOREIGN KEY ([Allegiance_id])
    REFERENCES [dbo].[Allegiance]
        ([id])
    ON DELETE NO ACTION ON UPDATE NO ACTION;

-- Creating non-clustered index for FOREIGN KEY 'FK__Creature__allegiance_id'
CREATE INDEX [IX_FK__Creature__allegiance_id]
ON [dbo].[Creature]
    ([Allegiance_id]);
GO

-- Creating foreign key on [Animation_id] in table 'Creature'
ALTER TABLE [dbo].[Creature]
ADD CONSTRAINT [FK__Creature__animation_id]
    FOREIGN KEY ([Animation_id])
    REFERENCES [dbo].[Animation]
        ([id])
    ON DELETE NO ACTION ON UPDATE NO ACTION;

-- Creating non-clustered index for FOREIGN KEY 'FK__Creature__animation_id'
CREATE INDEX [IX_FK__Creature__animation_id]
ON [dbo].[Creature]
    ([Animation_id]);
GO

-- Creating foreign key on [Classe_id] in table 'Creature'
ALTER TABLE [dbo].[Creature]
ADD CONSTRAINT [FK__Creature__classe_id]
    FOREIGN KEY ([Classe_id])
    REFERENCES [dbo].[Classe]
        ([id])
    ON DELETE NO ACTION ON UPDATE NO ACTION;

-- Creating non-clustered index for FOREIGN KEY 'FK__Creature__classe_id'
CREATE INDEX [IX_FK__Creature__classe_id]
ON [dbo].[Creature]
    ([Classe_id]);
GO

-- Creating foreign key on [Class_Script_id] in table 'Creature'
ALTER TABLE [dbo].[Creature]
ADD CONSTRAINT [FK__Creature__class_script_id]
    FOREIGN KEY ([Class_Script_id])
    REFERENCES [dbo].[Script]
        ([id])
    ON DELETE NO ACTION ON UPDATE NO ACTION;

-- Creating non-clustered index for FOREIGN KEY 'FK__Creature__class_script_id'
CREATE INDEX [IX_FK__Creature__class_script_id]
ON [dbo].[Creature]
    ([Class_Script_id]);
GO

-- Creating foreign key on [Default_Script_id] in table 'Creature'
ALTER TABLE [dbo].[Creature]
ADD CONSTRAINT [FK__Creature__default_script_id]
    FOREIGN KEY ([Default_Script_id])
    REFERENCES [dbo].[Script]
        ([id])
    ON DELETE NO ACTION ON UPDATE NO ACTION;

-- Creating non-clustered index for FOREIGN KEY 'FK__Creature__default_script_id'
CREATE INDEX [IX_FK__Creature__default_script_id]
ON [dbo].[Creature]
    ([Default_Script_id]);
GO

-- Creating foreign key on [Gender_id] in table 'Creature'
ALTER TABLE [dbo].[Creature]
ADD CONSTRAINT [FK__Creature__gender_id]
    FOREIGN KEY ([Gender_id])
    REFERENCES [dbo].[Gender]
        ([id])
    ON DELETE NO ACTION ON UPDATE NO ACTION;

-- Creating non-clustered index for FOREIGN KEY 'FK__Creature__gender_id'
CREATE INDEX [IX_FK__Creature__gender_id]
ON [dbo].[Creature]
    ([Gender_id]);
GO

-- Creating foreign key on [General_id] in table 'Creature'
ALTER TABLE [dbo].[Creature]
ADD CONSTRAINT [FK__Creature__general_id]
    FOREIGN KEY ([General_id])
    REFERENCES [dbo].[General]
        ([id])
    ON DELETE NO ACTION ON UPDATE NO ACTION;

-- Creating non-clustered index for FOREIGN KEY 'FK__Creature__general_id'
CREATE INDEX [IX_FK__Creature__general_id]
ON [dbo].[Creature]
    ([General_id]);
GO

-- Creating foreign key on [General_Script_id] in table 'Creature'
ALTER TABLE [dbo].[Creature]
ADD CONSTRAINT [FK__Creature__general_script_id]
    FOREIGN KEY ([General_Script_id])
    REFERENCES [dbo].[Script]
        ([id])
    ON DELETE NO ACTION ON UPDATE NO ACTION;

-- Creating non-clustered index for FOREIGN KEY 'FK__Creature__general_script_id'
CREATE INDEX [IX_FK__Creature__general_script_id]
ON [dbo].[Creature]
    ([General_Script_id]);
GO

-- Creating foreign key on [Groupe_id] in table 'Creature'
ALTER TABLE [dbo].[Creature]
ADD CONSTRAINT [FK__Creature__groupe_id]
    FOREIGN KEY ([Groupe_id])
    REFERENCES [dbo].[Groupe]
        ([id])
    ON DELETE NO ACTION ON UPDATE NO ACTION;

-- Creating non-clustered index for FOREIGN KEY 'FK__Creature__groupe_id'
CREATE INDEX [IX_FK__Creature__groupe_id]
ON [dbo].[Creature]
    ([Groupe_id]);
GO

-- Creating foreign key on [Kit_id] in table 'Creature'
ALTER TABLE [dbo].[Creature]
ADD CONSTRAINT [FK__Creature__kit_id]
    FOREIGN KEY ([Kit_id])
    REFERENCES [dbo].[Kit]
        ([id])
    ON DELETE NO ACTION ON UPDATE NO ACTION;

-- Creating non-clustered index for FOREIGN KEY 'FK__Creature__kit_id'
CREATE INDEX [IX_FK__Creature__kit_id]
ON [dbo].[Creature]
    ([Kit_id]);
GO

-- Creating foreign key on [Monster_id] in table 'Creature'
ALTER TABLE [dbo].[Creature]
ADD CONSTRAINT [FK__Creature__monster_id]
    FOREIGN KEY ([Monster_id])
    REFERENCES [dbo].[Monster]
        ([id])
    ON DELETE NO ACTION ON UPDATE NO ACTION;

-- Creating non-clustered index for FOREIGN KEY 'FK__Creature__monster_id'
CREATE INDEX [IX_FK__Creature__monster_id]
ON [dbo].[Creature]
    ([Monster_id]);
GO

-- Creating foreign key on [Override_Script_id] in table 'Creature'
ALTER TABLE [dbo].[Creature]
ADD CONSTRAINT [FK__Creature__override_script_id]
    FOREIGN KEY ([Override_Script_id])
    REFERENCES [dbo].[Script]
        ([id])
    ON DELETE NO ACTION ON UPDATE NO ACTION;

-- Creating non-clustered index for FOREIGN KEY 'FK__Creature__override_script_id'
CREATE INDEX [IX_FK__Creature__override_script_id]
ON [dbo].[Creature]
    ([Override_Script_id]);
GO

-- Creating foreign key on [Race_id] in table 'Creature'
ALTER TABLE [dbo].[Creature]
ADD CONSTRAINT [FK__Creature__race_id]
    FOREIGN KEY ([Race_id])
    REFERENCES [dbo].[Race]
        ([id])
    ON DELETE NO ACTION ON UPDATE NO ACTION;

-- Creating non-clustered index for FOREIGN KEY 'FK__Creature__race_id'
CREATE INDEX [IX_FK__Creature__race_id]
ON [dbo].[Creature]
    ([Race_id]);
GO

-- Creating foreign key on [Race_Script_id] in table 'Creature'
ALTER TABLE [dbo].[Creature]
ADD CONSTRAINT [FK__Creature__race_script_id]
    FOREIGN KEY ([Race_Script_id])
    REFERENCES [dbo].[Script]
        ([id])
    ON DELETE NO ACTION ON UPDATE NO ACTION;

-- Creating non-clustered index for FOREIGN KEY 'FK__Creature__race_script_id'
CREATE INDEX [IX_FK__Creature__race_script_id]
ON [dbo].[Creature]
    ([Race_Script_id]);
GO

-- Creating foreign key on [Sexe_id] in table 'Creature'
ALTER TABLE [dbo].[Creature]
ADD CONSTRAINT [FK__Creature__sexe_id]
    FOREIGN KEY ([Sexe_id])
    REFERENCES [dbo].[Sexe]
        ([id])
    ON DELETE NO ACTION ON UPDATE NO ACTION;

-- Creating non-clustered index for FOREIGN KEY 'FK__Creature__sexe_id'
CREATE INDEX [IX_FK__Creature__sexe_id]
ON [dbo].[Creature]
    ([Sexe_id]);
GO

-- Creating foreign key on [creature_id] in table 'Creature_proficiency'
ALTER TABLE [dbo].[Creature_proficiency]
ADD CONSTRAINT [FK__Creature_proficiency__creature_id]
    FOREIGN KEY ([creature_id])
    REFERENCES [dbo].[Creature]
        ([id])
    ON DELETE NO ACTION ON UPDATE NO ACTION;
GO

-- Creating foreign key on [creature_id] in table 'Creature_spell'
ALTER TABLE [dbo].[Creature_spell]
ADD CONSTRAINT [FK__Creature_spell__creature_id]
    FOREIGN KEY ([creature_id])
    REFERENCES [dbo].[Creature]
        ([id])
    ON DELETE NO ACTION ON UPDATE NO ACTION;
GO

-- Creating foreign key on [Category_id] in table 'Item'
ALTER TABLE [dbo].[Item]
ADD CONSTRAINT [FK__Item__category_id]
    FOREIGN KEY ([Category_id])
    REFERENCES [dbo].[Category]
        ([id])
    ON DELETE NO ACTION ON UPDATE NO ACTION;

-- Creating non-clustered index for FOREIGN KEY 'FK__Item__category_id'
CREATE INDEX [IX_FK__Item__category_id]
ON [dbo].[Item]
    ([Category_id]);
GO

-- Creating foreign key on [spell_id] in table 'Creature_spell'
ALTER TABLE [dbo].[Creature_spell]
ADD CONSTRAINT [FK__Creature_spell__spell_id]
    FOREIGN KEY ([spell_id])
    REFERENCES [dbo].[Spell]
        ([id])
    ON DELETE NO ACTION ON UPDATE NO ACTION;

-- Creating non-clustered index for FOREIGN KEY 'FK__Creature_spell__spell_id'
CREATE INDEX [IX_FK__Creature_spell__spell_id]
ON [dbo].[Creature_spell]
    ([spell_id]);
GO

-- Creating foreign key on [Priest_type_id] in table 'Spell'
ALTER TABLE [dbo].[Spell]
ADD CONSTRAINT [FK__Spell__priest_type_id]
    FOREIGN KEY ([Priest_type_id])
    REFERENCES [dbo].[Priest_type]
        ([id])
    ON DELETE NO ACTION ON UPDATE NO ACTION;

-- Creating non-clustered index for FOREIGN KEY 'FK__Spell__priest_type_id'
CREATE INDEX [IX_FK__Spell__priest_type_id]
ON [dbo].[Spell]
    ([Priest_type_id]);
GO

-- Creating foreign key on [School_id] in table 'Spell'
ALTER TABLE [dbo].[Spell]
ADD CONSTRAINT [FK__Spell__school_id]
    FOREIGN KEY ([School_id])
    REFERENCES [dbo].[School]
        ([id])
    ON DELETE NO ACTION ON UPDATE NO ACTION;

-- Creating non-clustered index for FOREIGN KEY 'FK__Spell__school_id'
CREATE INDEX [IX_FK__Spell__school_id]
ON [dbo].[Spell]
    ([School_id]);
GO

-- Creating foreign key on [Spell_type_id] in table 'Spell'
ALTER TABLE [dbo].[Spell]
ADD CONSTRAINT [FK__Spell__spell_type_id]
    FOREIGN KEY ([Spell_type_id])
    REFERENCES [dbo].[Spell_type]
        ([id])
    ON DELETE NO ACTION ON UPDATE NO ACTION;

-- Creating non-clustered index for FOREIGN KEY 'FK__Spell__spell_type_id'
CREATE INDEX [IX_FK__Spell__spell_type_id]
ON [dbo].[Spell]
    ([Spell_type_id]);
GO

-- Creating foreign key on [creature_id] in table 'Creature_item'
ALTER TABLE [dbo].[Creature_item]
ADD CONSTRAINT [FK__Creature_item__creature_id]
    FOREIGN KEY ([creature_id])
    REFERENCES [dbo].[Creature]
        ([id])
    ON DELETE NO ACTION ON UPDATE NO ACTION;
GO

-- Creating foreign key on [item_id] in table 'Creature_item'
ALTER TABLE [dbo].[Creature_item]
ADD CONSTRAINT [FK__Creature_item__item_id]
    FOREIGN KEY ([item_id])
    REFERENCES [dbo].[Item]
        ([id])
    ON DELETE NO ACTION ON UPDATE NO ACTION;

-- Creating non-clustered index for FOREIGN KEY 'FK__Creature_item__item_id'
CREATE INDEX [IX_FK__Creature_item__item_id]
ON [dbo].[Creature_item]
    ([item_id]);
GO

-- Creating foreign key on [Slot_id] in table 'Creature_item'
ALTER TABLE [dbo].[Creature_item]
ADD CONSTRAINT [FK__Creature_item__slot_id]
    FOREIGN KEY ([Slot_id])
    REFERENCES [dbo].[Slot]
        ([id])
    ON DELETE NO ACTION ON UPDATE NO ACTION;

-- Creating non-clustered index for FOREIGN KEY 'FK__Creature_item__slot_id'
CREATE INDEX [IX_FK__Creature_item__slot_id]
ON [dbo].[Creature_item]
    ([Slot_id]);
GO

-- Creating foreign key on [Attack_per_round_real_apr] in table 'Creature'
ALTER TABLE [dbo].[Creature]
ADD CONSTRAINT [FK__Creature__apr_id]
    FOREIGN KEY ([Attack_per_round_real_apr])
    REFERENCES [dbo].[Attack_per_round]
        ([real_apr])
    ON DELETE NO ACTION ON UPDATE NO ACTION;

-- Creating non-clustered index for FOREIGN KEY 'FK__Creature__apr_id'
CREATE INDEX [IX_FK__Creature__apr_id]
ON [dbo].[Creature]
    ([Attack_per_round_real_apr]);
GO

-- Creating foreign key on [Creature_id] in table 'Creature_effect'
ALTER TABLE [dbo].[Creature_effect]
ADD CONSTRAINT [FK__Creature_effect__creature_id]
    FOREIGN KEY ([Creature_id])
    REFERENCES [dbo].[Creature]
        ([id])
    ON DELETE NO ACTION ON UPDATE NO ACTION;

-- Creating non-clustered index for FOREIGN KEY 'FK__Creature_effect__creature_id'
CREATE INDEX [IX_FK__Creature_effect__creature_id]
ON [dbo].[Creature_effect]
    ([Creature_id]);
GO

-- Creating foreign key on [Effect_type_id] in table 'Creature_effect'
ALTER TABLE [dbo].[Creature_effect]
ADD CONSTRAINT [FK__Creature_effect__effect_type_id]
    FOREIGN KEY ([Effect_type_id])
    REFERENCES [dbo].[Effect_type]
        ([id])
    ON DELETE NO ACTION ON UPDATE NO ACTION;

-- Creating non-clustered index for FOREIGN KEY 'FK__Creature_effect__effect_type_id'
CREATE INDEX [IX_FK__Creature_effect__effect_type_id]
ON [dbo].[Creature_effect]
    ([Effect_type_id]);
GO

Create View [dbo].[Entity] as
	select cast(id as varchar) as id, name, 'Group' as type from groupe
	union
	select cast(id as varchar), name, 'Monster' from monster
	union
	select id, CASE WHEN name IS NULL THEN id else id + ' (' + name + ')' end, 'Creature' from creature;
GO

INSERT [dbo].[Param] ([name], [value]) VALUES (N'EXPORT_DIR', NULL)
INSERT [dbo].[Param] ([name], [value]) VALUES (N'GAME_DIR', N'c:\jeux\BGT')
INSERT [dbo].[Param] ([name], [value]) VALUES (N'SCRIPT_DIR', N'd:\Projets\Creatures\baf')

insert into constitution(value, hp_bonus) values (1, -3);
insert into constitution(value, hp_bonus) values (2, -2);
insert into constitution(value, hp_bonus) values (3, -2);
insert into constitution(value, hp_bonus) values (4, -1);
insert into constitution(value, hp_bonus) values (5, -1);
insert into constitution(value, hp_bonus) values (6, -1);
insert into constitution(value, hp_bonus) values (7, 0);
insert into constitution(value, hp_bonus) values (8, 0);
insert into constitution(value, hp_bonus) values (9, 0);
insert into constitution(value, hp_bonus) values (10, 0);
insert into constitution(value, hp_bonus) values (11, 0);
insert into constitution(value, hp_bonus) values (12, 0);
insert into constitution(value, hp_bonus) values (13, 0);
insert into constitution(value, hp_bonus) values (14, 0);
insert into constitution(value, hp_bonus) values (15, 1);
insert into constitution(value, hp_bonus) values (16, 2);
insert into constitution(value, hp_bonus) values (17, 3);
insert into constitution(value, hp_bonus) values (18, 4);
insert into constitution(value, hp_bonus) values (19, 5);
insert into constitution(value, hp_bonus) values (20, 5);
insert into constitution(value, hp_bonus) values (21, 6);
insert into constitution(value, hp_bonus) values (22, 6);
insert into constitution(value, hp_bonus) values (23, 6);
insert into constitution(value, hp_bonus) values (24, 7);
insert into constitution(value, hp_bonus) values (25, 7);

insert into strength(value_3rd, value_2nd, exc) values (1, 1, 0);
insert into strength(value_3rd, value_2nd, exc) values (2, 2, 0);
insert into strength(value_3rd, value_2nd, exc) values (3, 3, 0);
insert into strength(value_3rd, value_2nd, exc) values (4, 4, 0);
insert into strength(value_3rd, value_2nd, exc) values (5, 5, 0);
insert into strength(value_3rd, value_2nd, exc) values (6, 6, 0);
insert into strength(value_3rd, value_2nd, exc) values (7, 7, 0);
insert into strength(value_3rd, value_2nd, exc) values (8, 8, 0);
insert into strength(value_3rd, value_2nd, exc) values (9, 9, 0);
insert into strength(value_3rd, value_2nd, exc) values (10, 10, 0);
insert into strength(value_3rd, value_2nd, exc) values (11, 11, 0);
insert into strength(value_3rd, value_2nd, exc) values (12, 12, 0);
insert into strength(value_3rd, value_2nd, exc) values (13, 13, 0);
insert into strength(value_3rd, value_2nd, exc) values (14, 14, 0);
insert into strength(value_3rd, value_2nd, exc) values (15, 15, 0);
insert into strength(value_3rd, value_2nd, exc) values (16, 16, 0);
insert into strength(value_3rd, value_2nd, exc) values (17, 17, 0);
insert into strength(value_3rd, value_2nd, exc) values (18, 18, 0);
insert into strength(value_3rd, value_2nd, exc) values (19, 18, 50);
insert into strength(value_3rd, value_2nd, exc) values (20, 18, 60);
insert into strength(value_3rd, value_2nd, exc) values (21, 18, 80);
insert into strength(value_3rd, value_2nd, exc) values (22, 18, 95);
insert into strength(value_3rd, value_2nd, exc) values (23, 18, 100);
insert into strength(value_3rd, value_2nd, exc) values (24, 19, 0);
insert into strength(value_3rd, value_2nd, exc) values (25, 20, 0);
insert into strength(value_3rd, value_2nd, exc) values (26, 21, 0);
insert into strength(value_3rd, value_2nd, exc) values (27, 22, 0);
insert into strength(value_3rd, value_2nd, exc) values (28, 23, 0);
insert into strength(value_3rd, value_2nd, exc) values (29, 24, 0);
insert into strength(value_3rd, value_2nd, exc) values (30, 25, 0);
insert into strength(value_3rd, value_2nd, exc) values (31, 25, 0);
insert into strength(value_3rd, value_2nd, exc) values (32, 25, 0);
insert into strength(value_3rd, value_2nd, exc) values (33, 25, 0);
insert into strength(value_3rd, value_2nd, exc) values (34, 25, 0);
insert into strength(value_3rd, value_2nd, exc) values (35, 25, 0);
insert into strength(value_3rd, value_2nd, exc) values (36, 25, 0);
insert into strength(value_3rd, value_2nd, exc) values (37, 25, 0);
insert into strength(value_3rd, value_2nd, exc) values (38, 25, 0);
insert into strength(value_3rd, value_2nd, exc) values (39, 25, 0);

SET IDENTITY_INSERT groupe ON
insert into groupe(id, name) values (1, 'Ankheg');
insert into groupe(id, name) values (2, 'Basilisk');
insert into groupe(id, name) values (3, 'Bear');
insert into groupe(id, name) values (4, 'Crawler');
insert into groupe(id, name) values (5, 'Cat');
insert into groupe(id, name) values (6, 'Dog');
insert into groupe(id, name) values (7, 'Construct');
insert into groupe(id, name) values (8, 'Death Knight');
insert into groupe(id, name) values (9, 'Tanarri');
insert into groupe(id, name) values (10, 'Baatezu');
insert into groupe(id, name) values (11, 'Doppelganger');
insert into groupe(id, name) values (12, 'Dryad');
insert into groupe(id, name) values (13, 'Elemental');
insert into groupe(id, name) values (14, 'Ettercap');
insert into groupe(id, name) values (15, 'Genie');
insert into groupe(id, name) values (16, 'Ghost');
insert into groupe(id, name) values (17, 'Ghoul');
insert into groupe(id, name) values (18, 'Gibberling');
insert into groupe(id, name) values (19, 'Gnoll');
insert into groupe(id, name) values (20, 'Golem');
insert into groupe(id, name) values (21, 'Hobgobelin');
insert into groupe(id, name) values (22, 'Kobold');
insert into groupe(id, name) values (23, 'Loup-garou');
insert into groupe(id, name) values (24, 'Nereid');
insert into groupe(id, name) values (25, 'Nymph');
insert into groupe(id, name) values (26, 'Ogre');
insert into groupe(id, name) values (27, 'Ooze');
insert into groupe(id, name) values (28, 'Revenant');
insert into groupe(id, name) values (29, 'Sirine');
insert into groupe(id, name) values (30, 'Skeleton');
insert into groupe(id, name) values (31, 'Spider');
insert into groupe(id, name) values (32, 'Stalker');
insert into groupe(id, name) values (33, 'Tasloi');
insert into groupe(id, name) values (34, 'Werewolf');
insert into groupe(id, name) values (35, 'Wolf');
insert into groupe(id, name) values (36, 'Wolfwere');
insert into groupe(id, name) values (37, 'Wyvern');
insert into groupe(id, name) values (38, 'Xvart');
insert into groupe(id, name) values (39, 'Zombie');
insert into groupe(id, name) values (40, 'Ashiruku');
insert into groupe(id, name) values (41, 'Nishruu');
insert into groupe(id, name) values (42, 'Hakeashar');
SET IDENTITY_INSERT groupe OFF

SET IDENTITY_INSERT monster ON
insert into monster(id, groupe_id, name) values(1, 1, 'Ankheg');
insert into monster(id, groupe_id, name) values(2, 2, 'Greater basilisk');
insert into monster(id, groupe_id, name) values(3, 2, 'Basilisk');
insert into monster(id, groupe_id, name) values(4, 3, 'Black bear');
insert into monster(id, groupe_id, name) values(5, 3, 'Brown bear');
insert into monster(id, groupe_id, name) values(6, 3, 'Cave bear');
insert into monster(id, groupe_id, name) values(7, 3, 'Polar bear');
insert into monster(id, groupe_id, name) values(8, 3, 'Bearwere');
insert into monster(id, groupe_id, name) values(9, 3, 'Greater bearwere');
insert into monster(id, groupe_id, name) values(10, 4, 'Carrion crawler');
insert into monster(id, groupe_id, name) values(11, 4, 'Mutated crawler');
insert into monster(id, groupe_id, name) values(12, 4, 'Crypt crawler');
insert into monster(id, groupe_id, name) values(13, 5, 'Jaguar');
insert into monster(id, groupe_id, name) values(14, 5, 'Spotted Lion');
insert into monster(id, groupe_id, name) values(15, 6, 'Wild Dog');
insert into monster(id, groupe_id, name) values(16, 6, 'Rabid Dog');
insert into monster(id, groupe_id, name) values(17, 6, 'War Dog');
insert into monster(id, groupe_id, name) values(18, 6, 'Blink Dog');
insert into monster(id, groupe_id, name) values(19, 7, 'Helmed horror');
insert into monster(id, groupe_id, name) values(20, 7, 'Doom guard');
insert into monster(id, groupe_id, name) values(21, 7, 'Dwarven doom guard');
insert into monster(id, groupe_id, name) values(22, 7, 'Battle horror');
insert into monster(id, groupe_id, name) values(23, 7, 'Doom slayer');
insert into monster(id, groupe_id, name) values(24, 8, 'Death knight');
insert into monster(id, groupe_id, name) values(26, 9, 'Succubus');
insert into monster(id, groupe_id, name) values(27, 9, 'Nabassu');
insert into monster(id, groupe_id, name) values(29, 9, 'Glabrezu');
insert into monster(id, groupe_id, name) values(30, 10, 'Cornugon');
insert into monster(id, groupe_id, name) values(31, 10, 'Pit Fiend');
insert into monster(id, groupe_id, name) values(32, 11, 'Doppelganger');
insert into monster(id, groupe_id, name) values(33, 11, 'Greater doppelganger');
insert into monster(id, groupe_id, name) values(34, 12, 'Dryad');
insert into monster(id, groupe_id, name) values(35, 12, 'Hamadryad');
insert into monster(id, groupe_id, name) values(36, 13, 'Aerial servant');
insert into monster(id, groupe_id, name) values(37, 13, 'Air aspect');
insert into monster(id, groupe_id, name) values(38, 13, 'Fire elemental');
insert into monster(id, groupe_id, name) values(42, 13, 'Earth elemental');
insert into monster(id, groupe_id, name) values(46, 13, 'Air elemental');
insert into monster(id, groupe_id, name) values(50, 13, 'Fire salamander');
insert into monster(id, groupe_id, name) values(51, 14, 'Ettercap');
insert into monster(id, groupe_id, name) values(52, 15, 'Djinni');
insert into monster(id, groupe_id, name) values(53, 15, 'Efreeti');
insert into monster(id, groupe_id, name) values(54, 16, 'Daitel');
insert into monster(id, groupe_id, name) values(55, 16, 'Ulcaster');
insert into monster(id, groupe_id, name) values(56, 17, 'Ghoul');
insert into monster(id, groupe_id, name) values(57, 17, 'Ghast');
insert into monster(id, groupe_id, name) values(58, 17, 'Ghoul lord');
insert into monster(id, groupe_id, name) values(59, 18, 'Gibberling');
insert into monster(id, groupe_id, name) values(60, 19, 'Gnoll');
insert into monster(id, groupe_id, name) values(61, 19, 'Gnoll Slasher');
insert into monster(id, groupe_id, name) values(62, 19, 'Gnoll Veteran');
insert into monster(id, groupe_id, name) values(63, 19, 'Gnoll Leader');
insert into monster(id, groupe_id, name) values(64, 19, 'Gnoll Elite');
insert into monster(id, groupe_id, name) values(65, 19, 'Gnoll Chieftain');
insert into monster(id, groupe_id, name) values(66, 19, 'Flind');
insert into monster(id, groupe_id, name) values(67, 20, 'Flesh Golem');
insert into monster(id, groupe_id, name) values(68, 21, 'Hobgobelin');
insert into monster(id, groupe_id, name) values(69, 21, 'Elite Hobgobelin');
insert into monster(id, groupe_id, name) values(70, 22, 'Kobold');
insert into monster(id, groupe_id, name) values(71, 22, 'Kobold commando');
insert into monster(id, groupe_id, name) values(72, 22, 'Kobold leader');
insert into monster(id, groupe_id, name) values(73, 23, 'Loup-garou');
insert into monster(id, groupe_id, name) values(74, 23, 'Greater loup-garou');
insert into monster(id, groupe_id, name) values(75, 24, 'Nereid');
insert into monster(id, groupe_id, name) values(76, 25, 'Nymph');
insert into monster(id, groupe_id, name) values(77, 26, 'Half-ogre');
insert into monster(id, groupe_id, name) values(78, 26, 'Ogre');
insert into monster(id, groupe_id, name) values(79, 26, 'Ogremage');
insert into monster(id, groupe_id, name) values(80, 26, 'Ogrezerk');
insert into monster(id, groupe_id, name) values(81, 26, 'Ogrillon');
insert into monster(id, groupe_id, name) values(82, 27, 'Mustard jelly');
insert into monster(id, groupe_id, name) values(83, 27, 'Green slime');
insert into monster(id, groupe_id, name) values(84, 27, 'Gray ooze');
insert into monster(id, groupe_id, name) values(85, 27, 'Ochre jelly');
insert into monster(id, groupe_id, name) values(86, 27, 'Fission slime');
insert into monster(id, groupe_id, name) values(87, 5, 'Panther');
insert into monster(id, groupe_id, name) values(88, 5, 'Lion');
insert into monster(id, groupe_id, name) values(89, 28, 'Revenant');
insert into monster(id, groupe_id, name) values(90, 29, 'Sirine');
insert into monster(id, groupe_id, name) values(91, 29, 'Sirine queen');
insert into monster(id, groupe_id, name) values(92, 30, 'Skeleton');
insert into monster(id, groupe_id, name) values(93, 30, 'Warrior skeleton');
insert into monster(id, groupe_id, name) values(94, 31, 'Huge spider');
insert into monster(id, groupe_id, name) values(95, 31, 'Giant spider');
insert into monster(id, groupe_id, name) values(96, 31, 'Phase spider');
insert into monster(id, groupe_id, name) values(97, 31, 'Astral phase spider');
insert into monster(id, groupe_id, name) values(98, 31, 'Sword spider');
insert into monster(id, groupe_id, name) values(99, 31, 'Wraith spider');
insert into monster(id, groupe_id, name) values(100, 32, 'Stalker');
insert into monster(id, groupe_id, name) values(101, 33, 'Tasloi');
insert into monster(id, groupe_id, name) values(102, 6, 'War Dog');
insert into monster(id, groupe_id, name) values(103, 34, 'Werewolf');
insert into monster(id, groupe_id, name) values(104, 35, 'Wolf');
insert into monster(id, groupe_id, name) values(105, 35, 'Worg');
insert into monster(id, groupe_id, name) values(106, 35, 'Dire wolf');
insert into monster(id, groupe_id, name) values(107, 35, 'Dread wolf');
insert into monster(id, groupe_id, name) values(108, 35, 'Winter wolf');
insert into monster(id, groupe_id, name) values(109, 35, 'Vampiric wolf');
insert into monster(id, groupe_id, name) values(110, 36, 'Wolfwere');
insert into monster(id, groupe_id, name) values(111, 36, 'Greater wolfwere');
insert into monster(id, groupe_id, name) values(112, 37, 'Baby wyvern');
insert into monster(id, groupe_id, name) values(113, 37, 'Wyvern');
insert into monster(id, groupe_id, name) values(114, 37, 'Greater wyvern');
insert into monster(id, groupe_id, name) values(115, 38, 'Xvart');
insert into monster(id, groupe_id, name) values(116, 39, 'Zombie');
insert into monster(id, groupe_id, name) values(117, 40, 'Ashiruku');
insert into monster(id, groupe_id, name) values(118, 41, 'Nishruu');
insert into monster(id, groupe_id, name) values(119, 42, 'Hakeashar');
SET IDENTITY_INSERT monster OFF

insert into sexe(id, name) values (0, 'Unknown');
insert into sexe(id, name) values (1, 'Male');
insert into sexe(id, name) values (2, 'Female');
insert into sexe(id, name) values (3, 'Neither');
insert into sexe(id, name) values (4, 'Both');

insert into school(id, name) values (0, 'Unknown');
insert into school(id, name) values (1, 'Abjurer');
insert into school(id, name) values (2, 'Conjurer');
insert into school(id, name) values (3, 'Diviner');
insert into school(id, name) values (4, 'Enchanter');
insert into school(id, name) values (5, 'Illusionist');
insert into school(id, name) values (6, 'Invoker');
insert into school(id, name) values (7, 'Necromancer');
insert into school(id, name) values (8, 'Transmuter');
insert into school(id, name) values (9, 'Generalist');

insert into spell_type(id, name) values (0, 'Special');
insert into spell_type(id, name) values (1, 'Wizard');
insert into spell_type(id, name) values (2, 'Priest');
insert into spell_type(id, name) values (3, 'Unknown');
insert into spell_type(id, name) values (4, 'Innate');

insert into priest_type(id, name) values (0, 'All priests');
insert into priest_type(id, name) values (32768, 'Cleric-Paladin');
insert into priest_type(id, name) values (16384, 'Druid-Ranger');
insert into priest_type(id, name) values (49152, 'All');

insert into category values (0,'Miscellaneous');
insert into category values (1,'Amulets and necklaces');
insert into category values (2,'Armor');
insert into category values (3,'Belts and girdles');
insert into category values (4,'Boots');
insert into category values (5,'Arrows');
insert into category values (6,'Bracers and gauntlets');
insert into category values (7,'Headgear');
insert into category values (8,'Keys');
insert into category values (9,'Potions');
insert into category values (10,'Rings');
insert into category values (11,'Scrolls');
insert into category values (12,'Shields');
insert into category values (13,'Food');
insert into category values (14,'Bullets');
insert into category values (15,'Bows');
insert into category values (16,'Daggers');
insert into category values (17,'Maces');
insert into category values (18,'Slings');
insert into category values (19,'Small swords');
insert into category values (20,'Large swords');
insert into category values (21,'Hammers');
insert into category values (22,'Morning stars');
insert into category values (23,'Flails');
insert into category values (24,'Darts');
insert into category values (25,'Axes');
insert into category values (26,'Quarterstaves');
insert into category values (27,'Crossbows');
insert into category values (28,'Hand-to-hand weapons');
insert into category values (29,'Spears');
insert into category values (30,'Halberds');
insert into category values (31,'Bolts');
insert into category values (32,'Cloaks and robes');
insert into category values (33,'Gold pieces');
insert into category values (34,'Gems');
insert into category values (35,'Wands');
insert into category values (36,'Containers');
insert into category values (37,'Books');
insert into category values (38,'Familiars');
insert into category values (39,'Tattoos');
insert into category values (40,'Lenses');
insert into category values (41,'Bucklers');
insert into category values (42,'Candles');
insert into category values (43,'Child bodies');
insert into category values (44,'Clubs');
insert into category values (45,'Female bodies');
insert into category values (46,'Keys (old)');
insert into category values (47,'Large shields');
insert into category values (48,'Male bodies');
insert into category values (49,'Medium shields');
insert into category values (50,'Notes');
insert into category values (51,'Rods');
insert into category values (52,'Skulls');
insert into category values (53,'Small shields');
insert into category values (54,'Spider bodies');
insert into category values (55,'Telescopes');
insert into category values (56,'Bottles');
insert into category values (57,'Greatswords');
insert into category values (58,'Bags');
insert into category values (59,'Furs and pelts');
insert into category values (60,'Leather armor');
insert into category values (61,'Studded leather');
insert into category values (62,'Chain mail');
insert into category values (63,'Splint mail');
insert into category values (64,'Plate mail');
insert into category values (65,'Full plate');
insert into category values (66,'Hide armor');
insert into category values (67,'Robes');
insert into category values (68,'Scale mail');
insert into category values (69,'Bastard swords');
insert into category values (70,'Scarves');
insert into category values (71,'Rations');
insert into category values (72,'Hats');
insert into category values (73,'Gloves');

