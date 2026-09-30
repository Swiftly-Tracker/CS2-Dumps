"use strict";
/// <reference path="../csgo.d.ts" />
//
// The photo file name format, in one place. The booth writes names through Compose, the book reads them
// through Parse and Matches, the library through Describe.
//
//   pet_<ms>_p<pose>_f<filter>_s<stage>_g<growth>_a<aspect>_z<zoom>_v<activity>_e<worn>.jpg
//   book_<same fields>_k<page>_y<layout>_l<slot>.jpg
//
// The name is the database: it is what the book matches its holes against and what outlives the pet's
// econ item. Every value in it is permanent - a photo on disk means whatever its fields meant when it
// was written.
//
// Three hard constraints on anything added here:
//
//   1. BIsValidPetPhotoName in uicomponent_gameinterface.cpp allows letters, digits and '_' only.
//   2. Names live inside MAX_PATH. Worst case is about 75 characters, and they sit under a pet
//      folder now, so a deep Steam path runs to about 155.
//   3. The extension is EXT here and k_szPhotoExt in uicomponent_gameinterface.cpp. They move
//      together, or every photo on disk disappears from the UI.
//
var PetPhotoTag;
(function (PetPhotoTag) {
    PetPhotoTag.EXT = '.jpg';
    PetPhotoTag.FILTERS = [
        { id: 0, name: 'normal' },
        { id: 1, name: 'bw' },
        { id: 2, name: 'sepia' },
        { id: 3, name: 'warm' },
        { id: 4, name: 'cool' },
        { id: 5, name: 'crisp' },
        { id: 6, name: 'moonlight' },
        { id: 7, name: 'silvertone' },
        { id: 8, name: 'psychedelic' },
    ];
    // variation is the clip the anim graph's selector picks, so reordering clips there reshuffles these.
    // Id 3 was rollover, dropped from the booth - ids are permanent, so it stays spent.
    PetPhotoTag.ACTIVITIES = [
        { id: 2, name: 'sit', activity: 'trick', variation: 2, icon: 'pet_activity_sit',
            sound: { Chick: 'Chicken.Idle.Single.Chick.PhotoBooth',
                Pullet: 'Chicken.Idle.Single.PhotoBooth',
                Hen: 'Chicken.Idle.Single.PhotoBooth' } },
        { id: 0, name: 'panic', activity: 'panic', icon: 'pet_activity_panic',
            sound: { Chick: 'Chicken.Panic.Chick.PhotoBooth',
                Pullet: 'Chicken.Panic.Pullet.PhotoBooth',
                Hen: 'Chicken.Panic.Hen.PhotoBooth' } },
        { id: 6, name: 'wag', activity: 'trick', variation: 9, icon: 'pet_activity_wag' },
        { id: 4, name: 'moonwalk', activity: 'trick', variation: 5, icon: 'pet_activity_dance' },
        { id: 5, name: 'jump', activity: 'trick', variation: 11, icon: 'pet_activity_jump' },
        { id: 7, name: 'kick', activity: 'trick', variation: 12, icon: 'pet_activity_kick' },
        { id: 1, name: 'fly', activity: 'trick', variation: 1, icon: 'pet_activity_fly' },
    ];
    // The id is the pet's upgrade level and the name is EChickenLifeStage's spelling of it. The bird's map
    // entity is still called teen; that name is the map's to pick, not this file's.
    const GROWTHS = [
        { id: 0, name: 'egg' },
        { id: 1, name: 'chick' },
        { id: 2, name: 'adolescent' },
        { id: 3, name: 'adult' },
    ];
    // 1 -> 'growth:chick', the term a hole asks for at that life stage.
    function GrowthTerm(nGrowth) {
        const aFound = GROWTHS.filter(row => row.id === nGrowth);
        return aFound.length > 0 ? 'growth:' + aFound[0].name : '';
    }
    PetPhotoTag.GrowthTerm = GrowthTerm;
    PetPhotoTag.HEADWEAR = [
        { id: 0, name: 'helmet', model: 'models/photobooth/silly_hats/helmet.vmdl' },
        { id: 1, name: 'armor', model: 'models/photobooth/silly_hats/armor_helmet.vmdl' },
        { id: 2, name: 'alien', model: 'models/photobooth/silly_hats/alien.vmdl' },
        { id: 3, name: 'banana', model: 'models/photobooth/silly_hats/banana.vmdl' },
        { id: 4, name: 'glasses', model: 'models/photobooth/silly_hats/glasses.vmdl' },
        { id: 5, name: 'nose_glasses', model: 'models/photobooth/silly_hats/nose_glasses.vmdl' },
        { id: 6, name: 'party', model: 'models/photobooth/silly_hats/party.vmdl' },
        { id: 7, name: 'sprout', model: 'models/photobooth/silly_hats/sprout.vmdl' },
        { id: 8, name: 'top_hat', model: 'models/photobooth/silly_hats/top_hat.vmdl' },
        { id: 9, name: 'wizard_hat', model: 'models/photobooth/silly_hats/wizard_hat.vmdl' },
    ];
    const ZOOMS = [
        { name: 'wide', band: [0, 9] },
        { name: 'mid', band: [10, 19] },
        { name: 'closeup', band: [20, 25] },
    ];
    PetPhotoTag.STAGES = [
        { id: 0, name: 'studio', map: 'ui/pet_photo_studio', word: '#SFUI_MAP_pet_photo_studio' },
        { id: 1, name: 'picnic', map: 'ui/pet_photo_park', word: '#SFUI_MAP_pet_photo_park' },
        { id: 4, name: 'warehouse', map: 'warehouse_vanity', word: '#SFUI_Map_warehouse', age_requirement: 2 },
        { id: 3, name: 'airport', map: 'ar_baggage_vanity', word: '#SFUI_Map_ar_baggage', achievement: 'visited-ar_baggage' },
        { id: 2, name: 'dust2', map: 'de_dust2_vanity', word: '#SFUI_Map_de_dust2', achievement: 'visited-de_dust2' },
        { id: 5, name: 'mirage', map: 'de_mirage_vanity', word: '#SFUI_Map_de_mirage', achievement: 'visited-de_mirage' },
        { id: 6, name: 'inferno', map: 'de_inferno_vanity', word: '#SFUI_Map_de_inferno', achievement: 'visited-de_inferno' },
        { id: 7, name: 'nuke', map: 'de_nuke_vanity', word: '#SFUI_Map_de_nuke', achievement: 'visited-de_nuke' },
        { id: 8, name: 'cache', map: 'de_cache_vanity', word: '#SFUI_Map_de_cache', achievement: 'visited-de_cache' },
        { id: 9, name: 'train', map: 'de_train_vanity', word: '#SFUI_Map_de_train', achievement: 'visited-de_train' },
        { id: 10, name: 'ancient', map: 'de_ancient_vanity', word: '#SFUI_Map_de_ancient', achievement: 'visited-de_ancient' },
    ];
    PetPhotoTag.ASPECTS = [
        { id: 3, name: '1x1', ratio: 1 },
        { id: 1, name: '4x3', ratio: 4 / 3 },
        { id: 2, name: '5x4', ratio: 5 / 4 },
        { id: 0, name: '16x9', ratio: 16 / 9 },
        { id: 5, name: '3x4', ratio: 3 / 4 },
        { id: 4, name: '4x5', ratio: 4 / 5 },
        { id: 6, name: '9x16', ratio: 9 / 16 },
    ];
    // Which of the two lists a shape belongs to. Square is in neither, so it leaves both buttons off.
    function Orientation(strAspect) {
        const aFound = PetPhotoTag.ASPECTS.filter(row => row.name === strAspect);
        if (aFound.length === 0 || aFound[0].ratio === 1) {
            return '';
        }
        return aFound[0].ratio > 1 ? 'horizontal' : 'vertical';
    }
    PetPhotoTag.Orientation = Orientation;
    // A name is width by height, so standing the shape on its end is swapping the two.
    function FlipAspect(strAspect) {
        return strAspect.split('x').reverse().join('x');
    }
    PetPhotoTag.FlipAspect = FlipAspect;
    PetPhotoTag.POSES = [
        { name: '0' },
        { name: '8', orbit: 80 },
        { name: '9', orbit: 80 },
        { name: '10', orbit: 80 },
        { name: '2', orbit: 100 },
        { name: '4', orbit: 110 },
        { name: '5', orbit: 80 },
        { name: '6', orbit: 90 },
        { name: '1', orbit: 100 },
        { name: '3', orbit: 100 },
        { name: '7', orbit: 100 }, // hat
    ];
    const FIELDS = [
        { letter: 'p', require: ['pose'], words: PetPhotoTag.POSES, caption: '#pet_photo_caption_pose',
            loc: '#pet_photo_booth_pose_' },
        { letter: 'f', require: ['filter'], codes: PetPhotoTag.FILTERS, caption: '#pet_photo_caption_filter',
            loc: '#pet_photo_booth_filter_' },
        { letter: 's', require: ['stage', 'scene'], codes: PetPhotoTag.STAGES, caption: '#pet_photo_caption_stage' },
        { letter: 'g', require: ['growth'], codes: GROWTHS, caption: '#pet_photo_caption_growth',
            loc: '#pet_growth_' },
        { letter: 'a', require: ['aspect'], codes: PetPhotoTag.ASPECTS,
            loc: '#pet_photo_booth_aspect_' },
        // Raw, so the bands can be retuned without making a liar of every photo already on disk.
        { letter: 'z', require: ['zoom'], bands: ZOOMS, caption: '#pet_photo_caption_zoom',
            loc: '#pet_photo_booth_zoom_' },
        // What the bird was doing, read off it as the shutter fires. Left out while it idles.
        { letter: 'v', require: ['activity'], codes: PetPhotoTag.ACTIVITIES, caption: '#pet_photo_caption_activity',
            loc: '#pet_photo_booth_activity_' },
        // Left out when it has nothing on its head.
        { letter: 'e', require: ['headwear'], codes: PetPhotoTag.HEADWEAR, caption: '#pet_photo_caption_headwear',
            loc: '#pet_photo_booth_headwear_' },
    ];
    // field name a layout may use -> the row it means
    function _RequireIndex() {
        const byName = {};
        FIELDS.forEach(field => { field.require.forEach(name => { byName[name] = field; }); });
        return byName;
    }
    const REQUIRE = _RequireIndex();
    // A name back to its id, out of the rows at the top.
    function _IdOf(aValues, strName) {
        const aFound = aValues.filter(value => value.name === strName);
        return aFound.length > 0 ? String(aFound[0].id) : '';
    }
    // A value with no id is left off rather than written as 'undefined', and the message names its table.
    function _Coded(strLetter, strId, strValue, strTable) {
        if (strId === '') {
            $.Msg('pet photo: "' + strValue + '" has no id in ' + strTable + ', so field ' + strLetter + ' is being left off.');
            return '';
        }
        return '_' + strLetter + strId;
    }
    // The booth holds a map name, not a stage name.
    function _StageId(strMap) {
        const aFound = PetPhotoTag.STAGES.filter(stage => stage.map === strMap);
        return aFound.length > 0 ? String(aFound[0].id) : '';
    }
    // The booth holds the attached model's path, for the same reason.
    function _HeadwearId(strModel) {
        const aFound = PetPhotoTag.HEADWEAR.filter(row => row.model === strModel);
        return aFound.length > 0 ? String(aFound[0].id) : '';
    }
    // Everything after the capture time, ready to sit between 'pet_<ms>' and EXT.
    function Compose(shot) {
        const strFilter = shot.filter || 'normal';
        const strAspect = shot.aspect || '1x1';
        return '_p' + shot.pose +
            _Coded('f', _IdOf(PetPhotoTag.FILTERS, strFilter), strFilter, 'FILTERS') +
            _Coded('s', _StageId(shot.stageMap), shot.stageMap, 'STAGES') +
            '_g' + shot.growth +
            _Coded('a', _IdOf(PetPhotoTag.ASPECTS, strAspect), strAspect, 'ASPECTS') +
            '_z' + shot.zoom +
            (shot.activity === '' ? '' : _Coded('v', _IdOf(PetPhotoTag.ACTIVITIES, shot.activity), shot.activity, 'ACTIVITIES')) +
            (shot.headwear === '' ? '' : _Coded('e', _HeadwearId(shot.headwear), shot.headwear, 'HEADWEAR'));
    }
    PetPhotoTag.Compose = Compose;
    //----------------------------------------------------------------------------------
    // Reading
    //----------------------------------------------------------------------------------
    // letter -> value, for every field the name carries. A field that did not exist yet has no entry.
    function Parse(strFileName) {
        const fields = {};
        // [0] is the prefix, [1] the capture time, the rest <letter><value>
        const aTokens = strFileName.replace(PetPhotoTag.EXT, '').split('_');
        for (let i = 2; i < aTokens.length; i++) {
            if (aTokens[i].length > 1) {
                fields[aTokens[i].charAt(0)] = aTokens[i].substring(1);
            }
        }
        return fields;
    }
    // The '<ms>' out of pet_<ms>_p0_... The one part of a name that never changes, so it is its id.
    function CaptureMS(strFileName) {
        return strFileName.replace(PetPhotoTag.EXT, '').split('_')[1] || '';
    }
    PetPhotoTag.CaptureMS = CaptureMS;
    // Width over height, 1 for anything unrecognised.
    function Aspect(strFileName) {
        const aFound = PetPhotoTag.ASPECTS.filter(row => String(row.id) === Parse(strFileName)['a']);
        return aFound.length > 0 ? aFound[0].ratio : 1;
    }
    PetPhotoTag.Aspect = Aspect;
    // Wiped when a photo is placed somewhere new - a frame only means anything against its own hole.
    const PLACE_LETTERS = ['k', 'y', 'l', 'x', 'w', 'm'];
    // In the book but not on a page. A swap parks whatever it displaced here.
    PetPhotoTag.SLOT_UNPLACED = 255;
    function IsBookName(strFileName) {
        return strFileName.indexOf('book_') === 0;
    }
    PetPhotoTag.IsBookName = IsBookName;
    // One folder per pet, named for its item id, with the camera roll and the book inside it. The same
    // two paths PetLibraryDir and PetBookDir compose in uicomponent_gameinterface.cpp.
    function LibraryFolder(strPetKey) {
        return 'pet/' + strPetKey + '/library';
    }
    PetPhotoTag.LibraryFolder = LibraryFolder;
    function BookFolder(strPetKey) {
        return 'pet/' + strPetKey + '/book';
    }
    PetPhotoTag.BookFolder = BookFolder;
    // Camera roll photos and book photos sit in different folders. The name says which.
    function PhotoUrl(strPetKey, strFileName) {
        return 'file://{pet}/' + strPetKey + (IsBookName(strFileName) ? '/book/' : '/library/') + strFileName;
    }
    PetPhotoTag.PhotoUrl = PhotoUrl;
    // undefined for a name that carries no placement, which is any camera roll photo.
    function PlaceOf(strFileName) {
        const fields = Parse(strFileName);
        const nPage = Number(fields['k']);
        const nLayout = Number(fields['y']);
        const nSlot = Number(fields['l']);
        if (isNaN(nPage) || isNaN(nLayout) || isNaN(nSlot)) {
            return undefined;
        }
        return { page: nPage, layout: nLayout, slot: nSlot };
    }
    PetPhotoTag.PlaceOf = PlaceOf;
    PetPhotoTag.FRAME_DEFAULT = { x: 50, y: 50, zoom: 100 };
    PetPhotoTag.FRAME_ZOOM_MAX = 300;
    function _Clamp(n, min, max) {
        return isNaN(n) ? min : Math.max(min, Math.min(max, Math.round(n)));
    }
    // The default for a name that carries no frame.
    function FrameOf(strFileName) {
        const fields = Parse(strFileName);
        return {
            x: fields['x'] === undefined ? PetPhotoTag.FRAME_DEFAULT.x : _Clamp(Number(fields['x']), 0, 100),
            y: fields['w'] === undefined ? PetPhotoTag.FRAME_DEFAULT.y : _Clamp(Number(fields['w']), 0, 100),
            zoom: fields['m'] === undefined ? PetPhotoTag.FRAME_DEFAULT.zoom : _Clamp(Number(fields['m']), 100, PetPhotoTag.FRAME_ZOOM_MAX),
        };
    }
    PetPhotoTag.FrameOf = FrameOf;
    function IsDefaultFrame(frame) {
        return frame.x === PetPhotoTag.FRAME_DEFAULT.x && frame.y === PetPhotoTag.FRAME_DEFAULT.y && frame.zoom === PetPhotoTag.FRAME_DEFAULT.zoom;
    }
    PetPhotoTag.IsDefaultFrame = IsDefaultFrame;
    // Left off entirely while it is the default, so a name written before framing stays as it was.
    function _FrameFields(frame) {
        return IsDefaultFrame(frame) ? '' :
            '_x' + _Clamp(frame.x, 0, 100) +
                '_w' + _Clamp(frame.y, 0, 100) +
                '_m' + _Clamp(frame.zoom, 100, PetPhotoTag.FRAME_ZOOM_MAX);
    }
    // The same copy in the same hole, framed differently. Everything else about the name is kept.
    function WithFrame(strFileName, frame) {
        const place = PlaceOf(strFileName);
        return place === undefined ? strFileName : BookName(strFileName, place, frame);
    }
    PetPhotoTag.WithFrame = WithFrame;
    // A name with its placement stripped: the capture time and the fields the booth wrote. Both name
    // builders start from this, because a photo is only ever rewritten from its capture fields out.
    function _Stem(strFileName) {
        const aTokens = strFileName.replace(PetPhotoTag.EXT, '').split('_');
        // [0] is the prefix and [1] the capture time; drop any placement the name already carries
        const aFields = aTokens.filter((strToken, i) => i >= 2 && PLACE_LETTERS.indexOf(strToken.charAt(0)) < 0);
        return aFields.length === 0 ? aTokens[1] : aTokens[1] + '_' + aFields.join('_');
    }
    // The name a photo goes home to, which is the one the booth wrote. Both builders work off the same
    // stem, so a photo taken out of the book is byte for byte the file that went in - which is what keeps
    // it sorting back into the place it left in the camera roll.
    function RollName(strFileName) {
        return 'pet_' + _Stem(strFileName) + PetPhotoTag.EXT;
    }
    PetPhotoTag.RollName = RollName;
    function BookName(strFileName, place, frame) {
        return 'book_' + _Stem(strFileName) +
            '_k' + place.page + '_y' + place.layout + '_l' + place.slot +
            _FrameFields(frame === undefined ? PetPhotoTag.FRAME_DEFAULT : frame) + PetPhotoTag.EXT;
    }
    PetPhotoTag.BookName = BookName;
    //----------------------------------------------------------------------------------
    // Describing
    //----------------------------------------------------------------------------------
    function _LetterIndex() {
        const byLetter = {};
        FIELDS.forEach(field => { byLetter[field.letter] = field; });
        return byLetter;
    }
    const BY_LETTER = _LetterIndex();
    // A stored value as the name this code knows it by: an id through its table, a quantity through its bands.
    function _Word(field, strHas) {
        if (field.codes) {
            const aFound = field.codes.filter(value => value.id === Number(strHas));
            return aFound.length > 0 ? aFound[0].name : strHas;
        }
        if (field.bands) {
            const nHas = Number(strHas);
            const aIn = field.bands.filter(row => nHas >= row.band[0] && nHas <= row.band[1]);
            return aIn.length > 0 ? aIn[0].name : strHas;
        }
        return strHas;
    }
    // The order a photo's settings are listed in. What each one is called is on its field.
    const DESCRIBE_ORDER = ['g', 'z', 's', 'v', 'e', 'f', 'p'];
    // Takes the stored value, so the booth can ask what a setting will be recorded as before there is a name.
    function WordFor(strLetter, strValue) {
        const field = BY_LETTER[strLetter];
        return field === undefined ? strValue : _NameWord(strLetter, _Word(field, strValue));
    }
    PetPhotoTag.WordFor = WordFor;
    // Html because the labels that show it are, and a newline there would collapse to a space.
    function Describe(strFileName) {
        const fields = Parse(strFileName);
        const aLines = [];
        DESCRIBE_ORDER.forEach(strLetter => {
            const field = BY_LETTER[strLetter];
            const strHas = fields[strLetter];
            if (field !== undefined && field.caption !== undefined && strHas !== undefined) {
                aLines.push($.Localize(field.caption) + ': <b>' + WordFor(strLetter, strHas) + '</b>');
            }
        });
        return aLines.join('<br>');
    }
    PetPhotoTag.Describe = Describe;
    // One value of one term. Anything unrecognised passes: an authoring typo must not lock a page shut.
    function _Satisfies(field, strName, strHas, strAsked) {
        if (field.bands) {
            const aBand = field.bands.filter(row => row.name === strAsked);
            if (aBand.length === 0) {
                $.Msg('pet photo: a hole asks for the "' + strAsked + '" band of ' + strName + ', which is not a band.');
                return true;
            }
            // a malformed value gives NaN, which fails both ends
            const nHas = Number(strHas);
            return nHas >= aBand[0].band[0] && nHas <= aBand[0].band[1];
        }
        if (field.codes) {
            const strWanted = _IdOf(field.codes, strAsked);
            if (strWanted === '') {
                $.Msg('pet photo: a hole asks for ' + strName + ':' + strAsked + ', which is not one of them.');
                return true;
            }
            return strHas === strWanted;
        }
        return strHas === strAsked;
    }
    // A hole's terms. Anything unrecognised is dropped rather than passed on, which is what makes an
    // authoring typo harmless: it cannot lock a page shut, and no hole can name it as a reason.
    function _Terms(strRequire) {
        if (strRequire === '') {
            return [];
        }
        const aTerms = [];
        strRequire.split(',').forEach(strTerm => {
            const aParts = strTerm.split(':');
            const field = REQUIRE[aParts[0]];
            if (aParts.length !== 2 || field === undefined) {
                $.Msg('pet photo: a hole requires "' + strTerm + '", which is not a rule this code knows.');
                return;
            }
            aTerms.push({ name: aParts[0], field: field, asked: aParts[1].split('|') });
        });
        return aTerms;
    }
    // Which of a hole's terms the photo fails, as the field names the layout wrote. Empty means it fits.
    function Unmet(strFileName, strRequire) {
        const fields = Parse(strFileName);
        // Missing is a no, not a maybe: a photo taken before a field existed does not fit a hole that asks
        // for it. Alternatives are within one term - growth:chick,pose:8|9 means both terms, either pose.
        function bHolds(term) {
            const strHas = fields[term.field.letter];
            return strHas !== undefined &&
                term.asked.some(strAsked => _Satisfies(term.field, term.name, strHas, strAsked));
        }
        return _Terms(strRequire).filter(term => !bHolds(term)).map(term => term.name);
    }
    PetPhotoTag.Unmet = Unmet;
    // data-require is a comma list of <field>:<value>, every one of which has to hold. '|' between values
    // means any one of them does.
    function Matches(strFileName, strRequire) {
        return Unmet(strFileName, strRequire).length === 0;
    }
    PetPhotoTag.Matches = Matches;
    //----------------------------------------------------------------------------------
    // A hole's hint
    //----------------------------------------------------------------------------------
    // A require value as the word to show for it: 'chick' -> 'Chick'. The name itself where there is none.
    function _NameWord(strLetter, strName) {
        const field = BY_LETTER[strLetter];
        if (field === undefined) {
            return strName;
        }
        const aValues = field.codes || field.bands || field.words || [];
        const aFound = aValues.filter(value => value.name === strName);
        // Nothing in the table goes by that name: a retired id, or a quantity off the end of the bands.
        // Shown as it stands rather than as a token nobody wrote.
        if (aFound.length === 0) {
            return strName;
        }
        if (field.loc !== undefined) {
            return $.Localize(field.loc + strName);
        }
        const strWord = aFound[0].word || strName;
        // A row can carry a token of its own where the words are not ours to pick. The map names are
        // irregular, so no prefix could derive them.
        return strWord.charAt(0) === '#' ? $.Localize(strWord) : strWord;
    }
    // The words for each term a hole asks for, met or not. A field's inline form is preferred, since
    // these read inside a sentence rather than labelling a button.
    function TermWords(strRequire) {
        return _Terms(strRequire).map(term => ({
            name: term.name,
            word: term.asked.map(strAsked => _InlineWord(term.field, strAsked)).join(' or '),
        }));
    }
    PetPhotoTag.TermWords = TermWords;
    function _InlineWord(field, strName) {
        const strInline = field.loc === undefined ? '' : field.loc + strName + '_inline';
        return (strInline !== '' && $.CanLocalize(strInline)) ?
            $.Localize(strInline) : _NameWord(field.letter, strName);
    }
})(PetPhotoTag || (PetPhotoTag = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGV0X3Bob3RvX3RhZy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL2NvbnRlbnQvY3Nnby9wYW5vcmFtYS9zY3JpcHRzL3BvcHVwcy9wZXRfcGhvdG9fdGFnLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSxxQ0FBcUM7QUFFckMsRUFBRTtBQUNGLHdHQUF3RztBQUN4RywyREFBMkQ7QUFDM0QsRUFBRTtBQUNGLDRGQUE0RjtBQUM1RixxREFBcUQ7QUFDckQsRUFBRTtBQUNGLHNHQUFzRztBQUN0RyxzR0FBc0c7QUFDdEcsZUFBZTtBQUNmLEVBQUU7QUFDRixpREFBaUQ7QUFDakQsRUFBRTtBQUNGLGtHQUFrRztBQUNsRywrRkFBK0Y7QUFDL0YsMkRBQTJEO0FBQzNELDhGQUE4RjtBQUM5RixnRUFBZ0U7QUFDaEUsRUFBRTtBQUNGLElBQVUsV0FBVyxDQThyQnBCO0FBOXJCRCxXQUFVLFdBQVc7SUFFUCxlQUFHLEdBQUcsTUFBTSxDQUFDO0lBZWIsbUJBQU8sR0FDcEI7UUFDQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRTtRQUN6QixFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRTtRQUNyQixFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsSUFBSSxFQUFFLE9BQU8sRUFBRTtRQUN4QixFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRTtRQUN2QixFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRTtRQUN2QixFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsSUFBSSxFQUFFLE9BQU8sRUFBRTtRQUN4QixFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsSUFBSSxFQUFFLFdBQVcsRUFBRTtRQUM1QixFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsSUFBSSxFQUFFLFlBQVksRUFBRTtRQUM3QixFQUFF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