"use strict";
/// <reference path="../csgo.d.ts" />
/// <reference path="../popups/pet_book_pages.ts" />
/// <reference path="../popups/pet_book_turn.ts" />
//
// Pet Picture Book - the popup. Wires the parts together and owns what sits around the book: the nav
// bar, the chapter strip, the way out and the way over to the booth. How a page turns is
// PetBookTurn's; what is on a page is PetBookPages'.
//
var PetBook;
(function (PetBook) {
    const _m_cp = $.GetContextPanel();
    let _m_bar;
    let _m_hint;
    let _m_prev;
    let _m_next;
    let _m_open;
    let _m_chapters = [];
    function Init() {
        // The book covers the vanity chickens and shows only photographs of them.
        GameInterfaceAPI.SetChickenAudioSuppressed('pet_book', true);
        _m_bar = _m_cp.FindChildInLayoutFile('id-pet-book-bar');
        _m_hint = _m_cp.FindChildInLayoutFile('id-pet-book-hint');
        _m_prev = _m_cp.FindChildInLayoutFile('id-pet-book-prev');
        _m_next = _m_cp.FindChildInLayoutFile('id-pet-book-next');
        _m_open = _m_cp.FindChildInLayoutFile('id-pet-book-open-btn');
        // Hands over the refresh so the authoring side never has to name the turn.
        PetBookPages.Init(PetBookTurn.RefreshSpread);
        // Only shown when opened from the booth.
        _m_cp.FindChildInLayoutFile('id-pet-book-booth-btn').visible =
            _m_cp.GetAttributeInt('from_booth', 0) === 1 && PetBookPages.HasLivePet();
        // Which spread to open on. The booth is handed the one showing when it takes over and hands it
        // back, so a trip out for a photo returns to the page it left. Every other way in passes nothing
        // and gets the closed cover.
        PetBookTurn.Init({
            FillPage: PetBookPages.FillPage,
            // The sliders adjust one hole on one page. Carrying them across a turn would leave them
            // pointed at a photo that is no longer on screen.
            OnBeforeTurn: PetBookPages.CloseFrame,
            OnSpreadChanged: _UpdateNav,
        }, PetBookPages.ShownPages(), _m_cp.GetAttributeInt('spread', 0));
        _MakeChapterButtons();
        _UpdateNav();
        // Back from the booth the book is already open, with no turn to carry the sound.
        if (PetBookTurn.Spread() > 0) {
            $.DispatchEvent('CSGOPlaySoundEffect', 'UI.BookOpen', 'MOUSE');
        }
    }
    PetBook.Init = Init;
    function Next() {
        PetBookTurn.TurnTo(PetBookTurn.Spread() + 1);
    }
    PetBook.Next = Next;
    function Prev() {
        PetBookTurn.TurnTo(PetBookTurn.Spread() - 1);
    }
    PetBook.Prev = Prev;
    // Booth first, then close - the order PopupPetPhotoBooth.OpenBook uses, so the booth's own dim
    // covers this popup before it goes. The booth reads the first two and takes the next two back as
    // it left them, so a hop out for a photo returns to the same page and the same camera.
    function OpenPhotoBooth() {
        // The button is hidden without one, so this is only reached if something else calls in.
        if (!PetBookPages.HasLivePet()) {
            return;
        }
        UiToolkitAPI.ShowCustomLayoutPopupParameters('', 'file://{resources}/layout/popups/popup_pet_photobooth.xml', 'pet_id=' + PetBookPages.PetItemID()
            + '&' + 'upgrade_level=' + PetBookPages.PetStage()
            + '&' + 'book_spread=' + PetBookTurn.Spread()
            + '&' + 'booth_setup=' + _m_cp.GetAttributeString('booth_setup', '')
            + '&' + 'from_book=1');
        Close();
    }
    PetBook.OpenPhotoBooth = OpenPhotoBooth;
    // Esc and the close button both land here, and so does the hand off to the booth.
    function Close() {
        PetBookPages.CancelDrag();
        GameInterfaceAPI.SetChickenAudioSuppressed('pet_book', false);
        $.DispatchEvent('UIPopupButtonClicked', '');
        // Dismissing an open book is a close. Already shut, and it is just a popup going away.
        $.DispatchEvent('CSGOPlaySoundEffect', PetBookTurn.Spread() > 0 ? 'UI.BookClose' : 'UIPanorama.mainmenu_press_quit', 'MOUSE');
    }
    PetBook.Close = Close;
    //----------------------------------------------------------------------------------
    // The chapter strip: jumps to a chapter, and says which one you are in.
    //----------------------------------------------------------------------------------
    function _ChapterBtnId(strName) {
        return 'id-pet-book-chapter-' + strName;
    }
    // Which chip you are on: the last chapter whose own jump has been reached. Worked out through the
    // same page-to-spread step the chips jump with, so the strip cannot highlight one chapter while a
    // click on it lands somewhere else. That matters where a chapter starts on a right page and so
    // shares its spread with the end of the chapter before it. Nothing is on before the cover lifts.
    function _ChapterOfSpread(spread) {
        const aStarted = _m_chapters.filter(chapter => PetBookTurn.SpreadOfPage(chapter.page) <= spread);
        return aStarted[aStarted.length - 1];
    }
    function _MakeChapterButtons() {
        const elParent = _m_cp.FindChildInLayoutFile('id-pet-book-chapters');
        _m_chapters = PetBookPages.Chapters();
        _m_chapters.forEach(chapter => {
            const elBtn = $.CreatePanel('RadioButton', elParent, _ChapterBtnId(chapter.name), {
                class: 'pet-book-chapter',
                group: 'chapters'
            });
            $.CreatePanel('Image', elBtn, '', {
                src: "file://{images}/icons/ui/" + chapter.icon,
                textureheight: "20",
                texturewidth: "-1",
            });
            elBtn.SetPanelEvent('onactivate', () => { PetBookTurn.TurnTo(PetBookTurn.SpreadOfPage(chapter.page)); });
        });
    }
    // Runs as a turn starts, not when it lands, so everything here moves as the cover lifts instead of
    // a turn later.
    function _UpdateNav() {
        const spread = PetBookTurn.Spread();
        const closed = spread === 0;
        _m_prev.enabled = spread > 0;
        _m_next.enabled = spread < PetBookTurn.NumSpreads() - 1;
        // One line under the book with two things taking turns on it. Hidden rather than faded, because
        // a control at zero opacity is still a control, and these two lie on top of each other.
        _m_bar.visible = !closed;
        _m_open.visible = closed;
        // The other half of the closed state.
        _m_hint.style.opacity = closed ? '1' : '0';
        // Set from the spread rather than from the click, so paging across a chapter boundary moves it
        // too. Nothing is checked while the book is shut: a closed book is not in a chapter.
        const chapter = _ChapterOfSpread(spread);
        if (chapter) {
            _m_cp.FindChildTraverse(_ChapterBtnId(chapter.name)).checked = true;
        }
        // Two variables rather than a built string: the separator is the loc file's to pick.
        _m_cp.SetDialogVariableInt('page', spread);
        _m_cp.SetDialogVariableInt('total', PetBookTurn.NumSpreads() - 1);
        _m_cp.SetDialogVariable('label', $.Localize('#pet_book_page_counter', _m_cp));
    }
})(PetBook || (PetBook = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicG9wdXBfcGV0X2Jvb2suanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9jb250ZW50L2NzZ28vcGFub3JhbWEvc2NyaXB0cy9wb3B1cHMvcG9wdXBfcGV0X2Jvb2sudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUNBLHFDQUFxQztBQUNyQyxvREFBb0Q7QUFDcEQsbURBQW1EO0FBQ25ELEVBQUU7QUFDRixxR0FBcUc7QUFDckcseUZBQXlGO0FBQ3pGLHFEQUFxRDtBQUNyRCxFQUFFO0FBQ0YsSUFBVSxPQUFPLENBb0xoQjtBQXBMRCxXQUFVLE9BQU87SUFFaEIsTUFBTSxLQUFLLEdBQUcsQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUFDO0lBRWxDLElBQUksTUFBZSxDQUFDO0lBQ3BCLElBQUksT0FBZ0IsQ0FBQztJQUNyQixJQUFJLE9BQWdCLENBQUM7SUFDckIsSUFBSSxPQUFnQixDQUFDO0lBQ3JCLElBQUksT0FBZ0IsQ0FBQztJQUVyQixJQUFJLFdBQVcsR0FBNkIsRUFBRSxDQUFDO0lBRS9DLFNBQWdCLElBQUk7UUFFbkIsMEVBQTBFO1FBQzFFLGdCQUFnQixDQUFDLHlCQUF5QixDQUFFLFVBQVUsRUFBRSxJQUFJLENBQUUsQ0FBQztRQUUvRCxNQUFNLEdBQUksS0FBSyxDQUFDLHFCQUFxQixDQUFFLGlCQUFpQixDQUFFLENBQUM7UUFDM0QsT0FBTyxHQUFHLEtBQUssQ0FBQyxxQkFBcUIsQ0FBRSxrQkFBa0IsQ0FBRSxDQUFDO1FBQzVELE9BQU8sR0FBRyxLQUFLLENBQUMscUJBQXFCLENBQUUsa0JBQWtCLENBQUUsQ0FBQztRQUM1RCxPQUFPLEdBQUcsS0FBSyxDQUFDLHFCQUFxQixDQUFFLGtCQUFrQixDQUFFLENBQUM7UUFDNUQsT0FBTyxHQUFHLEtBQUssQ0FBQyxxQkFBcUIsQ0FBRSxzQkFBc0IsQ0FBRSxDQUFDO1FBRWhFLDJFQUEyRTtRQUMzRSxZQUFZLENBQUMsSUFBSSxDQUFFLFdBQVcsQ0FBQyxhQUFh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