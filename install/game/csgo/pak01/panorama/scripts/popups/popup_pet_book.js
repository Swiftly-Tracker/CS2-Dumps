"use strict";
/// <reference path="../csgo.d.ts" />
/// <reference path="../popups/pet_book_pages.ts" />
/// <reference path="../popups/pet_book_turn.ts" />
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
        GameInterfaceAPI.SetChickenAudioSuppressed('pet_book', true);
        _m_bar = _m_cp.FindChildInLayoutFile('id-pet-book-bar');
        _m_hint = _m_cp.FindChildInLayoutFile('id-pet-book-hint');
        _m_prev = _m_cp.FindChildInLayoutFile('id-pet-book-prev');
        _m_next = _m_cp.FindChildInLayoutFile('id-pet-book-next');
        _m_open = _m_cp.FindChildInLayoutFile('id-pet-book-open-btn');
        PetBookPages.Init(PetBookTurn.RefreshSpread);
        _m_cp.FindChildInLayoutFile('id-pet-book-booth-btn').visible =
            _m_cp.GetAttributeInt('from_booth', 0) === 1 && PetBookPages.HasLivePet();
        PetBookTurn.Init({
            FillPage: PetBookPages.FillPage,
            OnBeforeTurn: PetBookPages.CloseFrame,
            OnSpreadChanged: _UpdateNav,
        }, PetBookPages.ShownPages(), _m_cp.GetAttributeInt('spread', 0));
        _MakeChapterButtons();
        _UpdateNav();
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
    function OpenPhotoBooth() {
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
    function Close() {
        PetBookPages.CancelDrag();
        GameInterfaceAPI.SetChickenAudioSuppressed('pet_book', false);
        $.DispatchEvent('UIPopupButtonClicked', '');
        $.DispatchEvent('CSGOPlaySoundEffect', PetBookTurn.Spread() > 0 ? 'UI.BookClose' : 'UIPanorama.mainmenu_press_quit', 'MOUSE');
    }
    PetBook.Close = Close;
    function _ChapterBtnId(strName) {
        return 'id-pet-book-chapter-' + strName;
    }
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
    function _UpdateNav() {
        const spread = PetBookTurn.Spread();
        const closed = spread === 0;
        _m_prev.enabled = spread > 0;
        _m_next.enabled = spread < PetBookTurn.NumSpreads() - 1;
        _m_bar.visible = !closed;
        _m_open.visible = closed;
        _m_hint.style.opacity = closed ? '1' : '0';
        const chapter = _ChapterOfSpread(spread);
        if (chapter) {
            _m_cp.FindChildTraverse(_ChapterBtnId(chapter.name)).checked = true;
        }
        _m_cp.SetDialogVariableInt('page', spread);
        _m_cp.SetDialogVariableInt('total', PetBookTurn.NumSpreads() - 1);
        _m_cp.SetDialogVariable('label', $.Localize('#pet_book_page_counter', _m_cp));
    }
})(PetBook || (PetBook = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicG9wdXBfcGV0X2Jvb2suanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9jb250ZW50L2NzZ28vcGFub3JhbWEvc2NyaXB0cy9wb3B1cHMvcG9wdXBfcGV0X2Jvb2sudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUNBLHFDQUFxQztBQUNyQyxvREFBb0Q7QUFDcEQsbURBQW1EO0FBTW5ELElBQVUsT0FBTyxDQW9MaEI7QUFwTEQsV0FBVSxPQUFPO0lBRWhCLE1BQU0sS0FBSyxHQUFHLENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQztJQUVsQyxJQUFJLE1BQWUsQ0FBQztJQUNwQixJQUFJLE9BQWdCLENBQUM7SUFDckIsSUFBSSxPQUFnQixDQUFDO0lBQ3JCLElBQUksT0FBZ0IsQ0FBQztJQUNyQixJQUFJLE9BQWdCLENBQUM7SUFFckIsSUFBSSxXQUFXLEdBQTZCLEVBQUUsQ0FBQztJQUUvQyxTQUFnQixJQUFJO1FBR25CLGdCQUFnQixDQUFDLHlCQUF5QixDQUFFLFVBQVUsRUFBRSxJQUFJLENBQUUsQ0FBQztRQUUvRCxNQUFNLEdBQUksS0FBSyxDQUFDLHFCQUFxQixDQUFFLGlCQUFpQixDQUFFLENBQUM7UUFDM0QsT0FBTyxHQUFHLEtBQUssQ0FBQyxxQkFBcUIsQ0FBRSxrQkFBa0IsQ0FBRSxDQUFDO1FBQzVELE9BQU8sR0FBRyxLQUFLLENBQUMscUJBQXFCLENBQUUsa0JBQWtCLENBQUUsQ0FBQztRQUM1RCxPQUFPLEdBQUcsS0FBSyxDQUFDLHFCQUFxQixDQUFFLGtCQUFrQixDQUFFLENBQUM7UUFDNUQsT0FBTyxHQUFHLEtBQUssQ0FBQyxxQkFBcUIsQ0FBRSxzQkFBc0IsQ0FBRSxDQUFDO1FBR2hFLFlBQVksQ0FBQyxJQUFJLENBQUUsV0FBVyxDQUFDLGFBQWEsQ0FBRSxDQUFDO1FBRy9DLEtBQUssQ0FBQyxxQkFBcUIsQ0FBRSx1QkFBdUIsQ0FBRSxDQUFDLE9BQU87WUFDN0QsS0FBSyxDQUFDLGVBQWUsQ0FB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